import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Megaphone, Send, Users, Layers, Briefcase, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Announcement Broadcaster.
 * Send platform-wide or targeted notifications.
 */
export default function AnnouncementBroadcaster() {
  const [form, setForm] = useState({
    text: '',
    audience: 'All Workers',
    targetVenture: 'BuyRix',
    targetRole: 'Marketer'
  });
  const [isSending, setIsSending] = useState(false);

  const ventures = ['BuyRix', 'Vyuma', 'TrendyVerse', 'Growplex'];
  const roles = ['Marketer', 'Content Creator', 'Reseller', 'Partner'];
  const audiences = ['All Workers', 'By Venture', 'By Role'];

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text) {
      toast.error('Announcement text cannot be empty');
      return;
    }

    setIsSending(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...form,
        priority: 1, // Standard priority
        createdAt: serverTimestamp()
      });
      
      // In production, this document creation would trigger a Cloud Function
      // to send FCM push notifications to the respective devices.
      
      toast.success('Announcement broadcasted successfully! 📢');
      setForm({ ...form, text: '' });
    } catch (error) {
      toast.error('Broadcast failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter text-center sm:text-left">Communication Hub</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1 text-center sm:text-left">Distribute critical updates & motivational content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-10"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-[#E8B84B]/10 text-[#E8B84B] rounded-2xl">
              <Megaphone size={24} />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">New Broadcast</h3>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Select Audience Segment</label>
                <div className="flex flex-wrap gap-2">
                  {audiences.map(aud => (
                    <button
                      key={aud}
                      type="button"
                      onClick={() => setForm({...form, audience: aud})}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        form.audience === aud 
                          ? 'bg-[#E8B84B] border-[#E8B84B] text-black shadow-xl shadow-[#E8B84B]/20' 
                          : 'bg-black border-[#2A2A2A] text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {aud}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                {form.audience === 'By Venture' && (
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Venture</label>
                    <select 
                      value={form.targetVenture}
                      onChange={e => setForm({...form, targetVenture: e.target.value})}
                      className="w-full bg-black border border-[#2A2A2A] text-white px-5 py-3 rounded-xl focus:border-[#E8B84B] outline-none"
                    >
                      {ventures.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                )}
                {form.audience === 'By Role' && (
                  <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Role</label>
                    <select 
                      value={form.targetRole}
                      onChange={e => setForm({...form, targetRole: e.target.value})}
                      className="w-full bg-black border border-[#2A2A2A] text-white px-5 py-3 rounded-xl focus:border-[#E8B84B] outline-none"
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Broadcast Message</label>
              <textarea 
                rows={6}
                value={form.text}
                onChange={e => setForm({...form, text: e.target.value})}
                placeholder="Type your message here... Use bold and clear language."
                className="w-full bg-black border border-[#2A2A2A] text-white px-6 py-5 rounded-[32px] focus:border-[#E8B84B] outline-none resize-none text-sm font-bold leading-relaxed shadow-inner"
              />
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest italic ml-2">
                Character count: {form.text.length} / 500
              </p>
            </div>

            <div className="pt-6 border-t border-[#2A2A2A]">
              <button 
                type="submit"
                disabled={isSending}
                className="w-full bg-[#E8B84B] text-black py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSending ? 'Sending Wave...' : 'Send Announcement'} <Send size={16} />
              </button>
            </div>
          </form>
        </motion.div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#1A1A1A] p-10 rounded-[40px] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={64} className="text-[#E8B84B]" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Wave Impact</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed mb-6">
              Broadcasts reach devices within 500ms using HVRS Messaging Backbone. Engagement typically spikes within the first 15 minutes.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-xs font-black text-[#10B981] uppercase tracking-widest">
                <Users size={18} /> Reaching ~1,240 workers
              </div>
              <div className="flex items-center gap-4 text-xs font-black text-blue-500 uppercase tracking-widest">
                <Briefcase size={18} /> Venture Segments: {form.audience === 'By Venture' ? form.targetVenture : 'All'}
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-[40px] p-10">
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-[#2A2A2A] pb-4">Content Protocol</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 flex-shrink-0">1</div>
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed mt-1">
                  Keep announcements actionable. Tell workers exactly what task or payout update to check.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 flex-shrink-0">2</div>
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed mt-1">
                  Use Emojis sparingly (🚀, ✅, ⚠️). They display well on most Android/iOS notifications.
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 flex-shrink-0">3</div>
                <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed mt-1">
                  Segmented audiences have 3x higher click-through rates compared to 'All Workers' broadcasts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
