# 25. partnerShops Firestore Schema Update
```typescript
interface PartnerShop {
  id: string; // Document ID
  shopSlug: string; // Unique URL slug
  shopName: string;
  partnerId: string; // UID of the user who owns it
  venture: string; // e.g., 'BuyRix', 'Vyuma'
  
  // New Personalization/Theme Schema
  theme: {
    primaryColor: string; // Hex (e.g., '#14b8a6')
    secondaryColor: string;
    backgroundColor: string; // Hex for dark mode background
    fontStyle: 'modern' | 'classic' | 'minimal' | 'bold';
    buttonStyle: 'rounded' | 'sharp' | 'pill';
    layout: 'grid' | 'list' | 'masonry';
  };

  branding: {
    tagline: string;
    whatsappNumber: string;
    instagramHandle: string;
    bannerImage: string; // URL
    bannerText: string;
  };

  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };

  isActive: boolean;
  createdAt: Timestamp;
}
```

# 26. Global String Replacement Documentation
- **Company Name**: All instances of "HVRS Innovations Ltd", "HVRS Innovations Pvt Ltd" have been globally replaced with **"HVRS Innovations"**.
- **Hero Keywords**: "Work from Home" replaced with **"Work from Anywhere, Earn Daily"**.
- **Bonus Terminology**: "Signup Bonus" replaced with **"Welcome Incentive"**.
- **Welcome Text**: References to specific unverified amounts replaced with **"Join & Earn upto ₹500 in your first week"** and **"First Task Completion Incentive"**.
- **Ventures Update**: "TrendyVerse" completely removed. Replaced with **"Zaestify"**, which is explicitly marked as "Coming Soon" and non-clickable.
- **AI Models**: Payouts and predictions previously referencing "DeepSeek" are now explicitly referencing **"OpenRouter / Gemma 4 31B"**.
- **KYC Compliance**: All references, fields, and form inputs requesting **"Aadhaar"** have been purged to comply with data minimization and regulatory requirements.
