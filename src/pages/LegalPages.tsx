import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, FileText, Smartphone, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageLayout = ({ children, title, icon: Icon }: { children: React.ReactNode, title: string, icon: any }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>
        
        <header className="mb-16">
          <div className="bg-yellow-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
            <Icon className="w-8 h-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">{title}</h1>
          <div className="h-1 w-20 bg-yellow-500 rounded-full" />
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-invert prose-yellow max-w-none text-gray-400"
        >
          {children}
        </motion.div>
        
        <footer className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">
            Last Updated: April 2026 • © HVRS INNOVATIONS
          </p>
        </footer>
      </div>
    </div>
  );
};

export const PrivacyPolicy = () => (
  <PageLayout title="Privacy Policy" icon={Shield}>
    <section className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-4">1. Data Collection</h2>
        <p>At WorkPlex by HVRS Innovations, we collect information purely to facilitate work opportunities. This includes your Google identity, temporary phone ID, and eventually KYC documents which are stored using AES encryption.</p>
      </div>
      <div>
        <h2 className="text-white text-xl font-bold mb-4">2. AES Encryption</h2>
        <p>Your sensitive data (Aadhaar, PAN) is encrypted client-side using Advanced Encryption Standard (AES) before being stored in our secured Firebase environment.</p>
      </div>
      <div>
        <h2 className="text-white text-xl font-bold mb-4">3. Data Usage</h2>
        <p>We do not sell your data. We use it to verify your identity for financial withdrawals and to ensure AML compliance.</p>
      </div>
    </section>
  </PageLayout>
);

export const TermsOfService = () => (
  <PageLayout title="Terms of Service" icon={FileText}>
    <section className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-4">1. Acceptance</h2>
        <p>By using WorkPlex, you agree to abide by the rules of the platform, including the correct submission of tasks and honest disclosure of identity.</p>
      </div>
      <div>
        <h2 className="text-white text-xl font-bold mb-4">2. Wallet System</h2>
        <p>Earnings are stored in a Temp Wallet with a ₹500 cap until KYC is completed. HVRS Innovations reserves the right to lock wallets if fraudulent activity is detected.</p>
      </div>
      <div>
        <h2 className="text-white text-xl font-bold mb-4">3. Withdrawals</h2>
        <p>Withdrawals are only processed after successful KYC verification and trust score evaluation.</p>
      </div>
    </section>
  </PageLayout>
);

export const CookiePolicy = () => (
  <PageLayout title="Cookie Policy" icon={Smartphone}>
    <section className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-4">1. Session Management</h2>
        <p>We use cookies primarily for session persistence to ensure you stay logged in to your secure dashboard.</p>
      </div>
      <div>
        <h2 className="text-white text-xl font-bold mb-4">2. Language Persistence</h2>
        <p>A specific cookie is used to store your locked language preference across the application.</p>
      </div>
    </section>
  </PageLayout>
);

export const SecurityPolicy = () => (
  <PageLayout title="Security" icon={Lock}>
    <section className="space-y-8">
      <div>
        <h2 className="text-white text-xl font-bold mb-4">1. Infrastructure</h2>
        <p>WorkPlex is built on a serverless architecture with real-time field-level encryption for sensitive data.</p>
      </div>
      <div>
        <h2 className="text-white text-xl font-bold mb-4">2. Authentication</h2>
        <p>We've eliminated password vulnerabilities by strictly using Google OAuth and in-app secure OTP verification.</p>
      </div>
    </section>
  </PageLayout>
);

export const ContactPage = () => (
  <PageLayout title="Contact Us" icon={Mail}>
    <section className="space-y-8">
      <div className="bg-[#111] p-8 rounded-3xl border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-4">Email Support</h3>
          <p className="text-white font-bold text-lg">workplex@gmail.com</p>
          <p className="text-gray-500 text-sm mt-1">24/7 Response for active partners</p>
        </div>
        <div>
          <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-4">Business Phone</h3>
          <p className="text-white font-bold text-lg">9949175029</p>
          <p className="text-gray-500 text-sm mt-1">Mon-Fri: 10AM - 6PM IST</p>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-4">Headquarters</h3>
          <p className="text-white font-bold text-lg">Hyderabad, Telangana, India</p>
          <p className="text-gray-500 text-sm mt-1">HVRS INNOVATIONS PRIVATE LIMITED</p>
        </div>
      </div>
    </section>
  </PageLayout>
);
