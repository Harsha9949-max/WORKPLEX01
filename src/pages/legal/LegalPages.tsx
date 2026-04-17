import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PageLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#0A0A0A] flex flex-col text-white pb-20">
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
      <Link to="/" className="inline-flex items-center gap-2 text-[#E8B84B] font-bold text-sm mb-8 hover:underline">
        <ArrowLeft size={16} /> Back
      </Link>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-8 text-[#E8B84B]">{title}</h1>
        <div className="prose prose-invert prose-amber max-w-none">
          {children}
        </div>
      </motion.div>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <PageLayout title="Privacy Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <h3>1. Information We Collect</h3>
    <p>We collect information to provide better services to all our users. Information you give us includes your name, phone number, and KYC details (Aadhaar, PAN) which are stored securely using AES encryption.</p>
    
    <h3>2. How We Use Information</h3>
    <p>We use the information we collect from all our services to provide, maintain, protect and improve them, to develop new ones, and to protect HVRS Innovations and our users.</p>
  </PageLayout>
);

export const TermsOfService = () => (
  <PageLayout title="Terms of Service">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <h3>1. Acceptance of Terms</h3>
    <p>By accessing and using WorkPlex, provided by HVRS Innovations, you accept and agree to be bound by the terms and provision of this agreement.</p>
    
    <h3>2. User Responsibilities</h3>
    <p>Users are responsible for maintaining the confidentiality of their account and password and for restricting access to their computer.</p>
  </PageLayout>
);

export const CookiePolicy = () => (
  <PageLayout title="Cookie Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <h3>1. What are cookies?</h3>
    <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website.</p>
    
    <h3>2. How we use cookies</h3>
    <p>We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.</p>
  </PageLayout>
);

export const SecurityPolicy = () => (
  <PageLayout title="Security">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <h3>1. Data Encryption</h3>
    <p>We use AES encryption for all sensitive KYC information stored in our databases.</p>
    
    <h3>2. Authentication</h3>
    <p>We employ multi-factor authentication and strict Firebase Security Rules to ensure that your data is only accessible to you.</p>
  </PageLayout>
);

export const ContactPage = () => (
  <PageLayout title="Contact Us">
    <div className="space-y-6">
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
        <h4 className="text-[#E8B84B] font-bold mb-2">Email Support</h4>
        <p className="text-gray-300">workplex@gmail.com</p>
      </div>
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
        <h4 className="text-[#00C9A7] font-bold mb-2">Direct Line</h4>
        <p className="text-gray-300">9949175029</p>
      </div>
      <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
        <h4 className="text-white font-bold mb-2">Headquarters</h4>
        <p className="text-gray-300">Hyderabad, India<br/>Global Operations Center</p>
      </div>
    </div>
  </PageLayout>
);
