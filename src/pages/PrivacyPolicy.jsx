import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-black uppercase tracking-tighter">Privacy Policy</h1>
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-amber-500">1. Data Collected</h2>
        <p className="text-sm text-gray-400">We collect minimal data: Full name, phone number, profile photo, encrypted PAN/bank details for payment compliance, device fingerprints for fraud prevention, and earnings history.</p>
        <h2 className="text-lg font-bold text-amber-500">2. Rights Under DPDP Act 2023</h2>
        <p className="text-sm text-gray-400">You hold rights to access, correct, delete, or port your data. To exercise these, please contact: privacy@hvrsltd.online</p>
      </section>
      <section className="p-4 bg-[#111111] rounded-2xl border border-white/5">
        <p className="text-[10px] font-bold text-gray-500 uppercase">Data Protection Officer: HVRS Innovations</p>
      </section>
    </div>
  );
}
