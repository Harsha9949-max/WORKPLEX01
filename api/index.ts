import express from "express";
import { Resend } from "resend";
import * as admin from "firebase-admin";

const app = express();
app.use(express.json());

// Initialize Firebase Admin if Service Account is provided
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp(); // Attempt default app credentials in GCP environment
    }
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
}

// Map simulating a simple DB for OTPs
const otpStore = new Map<string, { otp: string, expiresAt: number }>();

const getResend = () => {
  const key = process.env.RESEND_API_KEY || "re_KphYtwFU_6VDWdsQQZCcZ2GtuQgrZC23g";
  if (!key) throw new Error("RESEND_API_KEY not configured");
  return new Resend(key);
}

app.delete("/api/admin/delete-user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    if (!uid) return res.status(400).json({ error: "UID is required" });

    // Try to delete from Firebase Auth
    try {
      if (admin.apps.length > 0) {
        await admin.auth().deleteUser(uid);
      }
    } catch (authErr: any) {
      console.error("Failed to delete auth user, they may not exist or credentials missing:", authErr);
      // We don't fail the request completely if Auth fails, but we should let the caller know
    }

    res.json({ success: true, message: "Backend cleanup completed for user." });
  } catch (error: any) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message || "Failed to delete user" });
  }
});

app.post("/api/auth/send-otp", async (req, res) => {
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

app.post("/api/auth/verify-otp", async (req, res) => {
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

export default app;
