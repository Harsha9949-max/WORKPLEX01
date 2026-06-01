import express from "express";
import { Resend } from "resend";
import * as admin from "firebase-admin";

const app = express();
app.use(express.json());

// Lazy Firebase Admin Initialization
const initFirebaseAdmin = () => {
  if (admin.apps.length > 0) return true;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      return true;
    }
  } catch (err) {
    console.error("Firebase Admin lazy initialization error:", err);
  }
  return false;
};

// Map simulating a simple DB for OTPs
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

const getResend = () => {
  const key = process.env.RESEND_API_KEY || "re_KphYtwFU_6VDWdsQQZCcZ2GtuQgrZC23g";
  if (!key) throw new Error("RESEND_API_KEY not configured");
  return new Resend(key);
}

const router = express.Router();

router.get("/admin/users", async (req, res) => {
  try {
    const isInitialized = initFirebaseAdmin();
    let authUsers: any[] = [];
    let firestoreUsers: any[] = [];

    // 1. Fetch from Firestore (Admin SDK)
    if (isInitialized) {
      try {
        const snapshot = await admin.firestore().collection("users").get();
        snapshot.forEach((doc) => {
          firestoreUsers.push({ id: doc.id, ...doc.data() });
        });
      } catch (fsErr) {
        console.error("Backend failed to fetch Firestore users:", fsErr);
      }
    }

    // 2. Fetch from Firebase Auth
    if (isInitialized) {
      try {
        const authList = await admin.auth().listUsers(1000);
        authUsers = authList.users;
      } catch (authErr) {
        console.error("Backend failed to fetch Auth users:", authErr);
      }
    }

    // 3. Merge them by user id / uid
    const mergedMap = new Map<string, any>();

    // Add Firestore users first
    firestoreUsers.forEach((user) => {
      mergedMap.set(user.id, {
        ...user,
        authExists: false, // default in case not found in Auth
      });
    });

    // Add/Merge Auth users
    authUsers.forEach((authUser) => {
      const existing = mergedMap.get(authUser.uid);
      const joinedAtDate = authUser.metadata.creationTime 
        ? new Date(authUser.metadata.creationTime) 
        : new Date();

      if (existing) {
        mergedMap.set(authUser.uid, {
          ...existing,
          authExists: true,
          disabled: authUser.disabled,
          status: authUser.disabled ? "suspended" : (existing.status || "active"),
          emailVerified: authUser.emailVerified,
          name: existing.name || authUser.displayName || authUser.email?.split("@")[0] || "No Name",
          email: existing.email || authUser.email,
          phone: existing.phone || authUser.phoneNumber || undefined,
        });
      } else {
        // Synthesized worker entry from Auth since Firestore is not available/missing
        mergedMap.set(authUser.uid, {
          id: authUser.uid,
          uid: authUser.uid,
          name: authUser.displayName || authUser.email?.split("@")[0] || "No Name",
          email: authUser.email,
          phone: authUser.phoneNumber || undefined,
          status: authUser.disabled ? "suspended" : "active",
          role: "Unassigned",
          venture: "Unassigned",
          joinedAt: {
            seconds: Math.floor(joinedAtDate.getTime() / 1000),
            nanoseconds: 0,
          },
          wallets: { earned: 0, pending: 0, bonus: 0, savings: 0 },
          authExists: true,
          disabled: authUser.disabled,
        });
      }
    });

    const mergedList = Array.from(mergedMap.values());
    res.json({ success: true, workers: mergedList });
  } catch (error: any) {
    console.error("Backend List Users error:", error);
    res.status(500).json({ error: error.message || "Failed to get users list" });
  }
});

router.post("/admin/update-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, phone, venture, role, status } = req.body;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    const isInitialized = initFirebaseAdmin();
    if (isInitialized) {
      // 1. Update Firebase Auth properties (displayName, disabled status)
      try {
        const updateParams: any = {};
        if (name) updateParams.displayName = name;
        if (status) {
          updateParams.disabled = status === "suspended";
        }
        await admin.auth().updateUser(uid, updateParams);
      } catch (authErr) {
        console.error(`Failed to update Auth properties for ${uid}:`, authErr);
      }

      // 2. Perform synchronization in Firestore Doc
      try {
        const userRef = admin.firestore().collection("users").doc(uid);
        const docSnap = await userRef.get();
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (venture !== undefined) updateData.venture = venture;
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;

        if (docSnap.exists) {
          await userRef.update(updateData);
        } else {
          // Worker document didn't exist, create it now!
          await userRef.set({
            name: name || "New Worker",
            phone: phone || "",
            venture: venture || "Unassigned",
            role: role || "Unassigned",
            status: status || "active",
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
            wallets: { earned: 0, pending: 0, bonus: 0, savings: 0 },
            kycDone: false,
            firstTaskDone: false,
            contractSigned: false
          });
        }

        // 3. Update phoneDirectory mapping
        if (phone) {
          try {
            await admin.firestore().collection("phoneDirectory").doc(phone).set({
              uid,
              registeredAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          } catch (pErr) {
            console.error("Failed to update phone directory entry on backend:", pErr);
          }
        }
      } catch (fsErr) {
        console.error(`Failed to write/update user doc for ${uid} in Firestore:`, fsErr);
      }
    }

    res.json({ success: true, message: "User updated successfully on backend." });
  } catch (error: any) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message || "Failed to update user status" });
  }
});

router.delete("/admin/delete-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    // Try to delete from Firebase Auth and Firestore on the backend directly
    try {
      const isInitialized = initFirebaseAdmin();
      if (isInitialized) {
        // 1. Delete from Firebase Auth
        try {
          await admin.auth().deleteUser(uid);
        } catch (authErr: any) {
          console.warn("Auth delete failed or user does not exist in Auth:", authErr);
        }

        // 2. Lookup phone number in user collection first for directory cleanup
        let phone: string | undefined;
        try {
          const userDoc = await admin.firestore().collection("users").doc(uid).get();
          if (userDoc.exists) {
            phone = userDoc.data()?.phone;
          }
        } catch (pErr) {
          console.error("Failed to lookup phone from user document on deletion:", pErr);
        }

        // 3. Clean up users collection document
        try {
          await admin.firestore().collection("users").doc(uid).delete();
        } catch (fsErr) {
          console.error("Firestore user doc deletion failed:", fsErr);
        }

        // 4. Clean up phone directory index
        if (phone) {
          try {
            await admin.firestore().collection("phoneDirectory").doc(phone).delete();
            const cleanPhone = phone.replace("+91", "");
            await admin.firestore().collection("phoneDirectory").doc(cleanPhone).delete();
          } catch (phErr) {
            console.error("Firestore phoneDirectory doc deletion failed:", phErr);
          }
        }
      } else {
        console.warn("Firebase Admin not initialized, skipping Auth user deletion");
      }
    } catch (authErr: any) {
      console.error("Failed to delete auth user, they may not exist or credentials missing:", authErr);
    }

    res.json({ success: true, message: "Backend cleanup completed for user." });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
});

router.post("/auth/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry
    
    otpStore.set(email, { otp, expiresAt });

    const resend = getResend();
    const { data, error: resendError } = await resend.emails.send({
      from: 'WorkPlex <onboarding@workplex.sbs>',
      to: email,
      subject: 'Your WorkPlex Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 8px; overflow: hidden; background-color: #09090b; color: #ffffff;">
          <div style="padding: 24px; text-align: center; border-bottom: 1px solid #27272a;">
            <h1 style="color: #00c9a7; margin: 0; font-size: 24px;">WorkPlex</h1>
          </div>
          <div style="padding: 32px 24px;">
            <h2 style="margin-top: 0; color: #ffffff; font-size: 20px;">Verify your email</h2>
            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.5;">Please use the following verification code to securely log in to your WorkPlex account. This code will expire in 5 minutes.</p>
            <div style="background-color: #18181b; padding: 16px; border-radius: 6px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #00c9a7;">${otp}</span>
            </div>
            <p style="color: #a1a1aa; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
          </div>
        </div>
      `
    });

    if (resendError) {
      console.error("Resend API exact error:", resendError);
      return res.json({ 
        success: true, 
        message: "OTP generated (delivery blocked or suppressed by Resend).", 
        devOtp: otp,
        isResendFreeTier: true 
      });
    }

    res.json({ success: true, message: "OTP sent successfully", devOtp: process.env.NODE_ENV !== "production" ? otp : undefined });
  } catch (error: any) {
    console.error("OTP send error:", error);
    res.status(500).json({ error: error.message || "Failed to send OTP" });
  }
});

router.post("/auth/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: "No OTP found or expired. Request a new one." });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP expired" });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    otpStore.delete(email);

    res.json({ success: true, message: "OTP verified" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);
app.use("/", router);

export default app;
