import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { Save, Loader, Plus, Trash2 } from 'lucide-react';

export default function MainPageCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    heroTitle: 'WORK FROM\nANYWHERE,\nEARN DAILY',
    heroSubtitle: 'Join India\'s fastest-growing gig network.',
    statsWorkersText: '50K+',
    statsWorkersLabel: 'Active Workers',
    statsPaidText: '₹12M+',
    statsPaidLabel: 'Paid Out Securely',
    statsMissionsText: '750+',
    statsMissionsLabel: 'Daily Missions Added',
    ventures: [
      { 
        id: 'BUYRIX', 
        desc: 'Premium e-commerce platform. Earn commissions by promoting high-demand retail products.',
        potential: 'Up to ₹2,000/day',
        comingSoon: false
      },
      { 
        id: 'VYUMA', 
        desc: 'Next-gen media network. Get paid for content creation, video reviews, and social engagement.',
        potential: 'Up to ₹3,500/day',
        comingSoon: false
      },
      { 
        id: 'ZAESTIFY', 
        desc: 'Fashion & lifestyle hub. Influence trends and earn through curated style recommendations.',
        potential: 'Coming Soon',
        comingSoon: true
      },
      { 
        id: 'GROWPLEX', 
        desc: 'B2B growth engine. Earn big by acquiring high-value clients and providing support services.',
        potential: 'Up to ₹5,000/day',
        comingSoon: false
      }
    ]
  });

  useEffect(() => {
    fetchCMS();
  }, []);

  const fetchCMS = async () => {
    try {
      const docRef = doc(db, 'settings', 'landingPage');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData(prev => ({ 
          ...prev, 
          ...data,
          ventures: data.ventures || prev.ventures // Fallback if no ventures in DB
        }));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load CMS data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'landingPage'), formData, { merge: true });
      toast.success('Landing page updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save CMS data');
    } finally {
      setSaving(false);
    }
  };

  const updateVenture = (index: number, field: string, value: any) => {
    const newVentures = [...formData.ventures];
    newVentures[index] = { ...newVentures[index], [field]: value };
    setFormData({ ...formData, ventures: newVentures });
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader className="animate-spin text-[#E8B84B]" size={32} /></div>;

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Main Page CMS</h1>
        <p className="text-gray-500 text-sm mt-1">Modify text and content for the public landing page.</p>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#E8B84B]">Hero Section</h2>
        
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">Hero Title</label>
          <textarea 
            value={formData.heroTitle}
            onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-4 rounded-xl font-bold font-outfit uppercase h-32"
          />
          <p className="text-xs text-gray-500 mt-2">Use new lines for line breaks as they appear in the UI.</p>
        </div>

        <div>
           <label className="block text-sm font-bold text-gray-400 mb-2">Hero Subtitle</label>
           <input 
             type="text"
             value={formData.heroSubtitle}
             onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
             className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white p-4 rounded-xl"
           />
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#E8B84B]">Platform Stats Section</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stat 1 Value</label>
              <input 
                type="text"
                value={formData.statsWorkersText}
                onChange={(e) => setFormData({...formData, statsWorkersText: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stat 1 Label</label>
              <input 
                type="text"
                value={formData.statsWorkersLabel}
                onChange={(e) => setFormData({...formData, statsWorkersLabel: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stat 2 Value</label>
              <input 
                type="text"
                value={formData.statsPaidText}
                onChange={(e) => setFormData({...formData, statsPaidText: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stat 2 Label</label>
              <input 
                type="text"
                value={formData.statsPaidLabel}
                onChange={(e) => setFormData({...formData, statsPaidLabel: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stat 3 Value</label>
              <input 
                type="text"
                value={formData.statsMissionsText}
                onChange={(e) => setFormData({...formData, statsMissionsText: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-lg font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1">Stat 3 Label</label>
              <input 
                type="text"
                value={formData.statsMissionsLabel}
                onChange={(e) => setFormData({...formData, statsMissionsLabel: e.target.value})}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#E8B84B]">Ventures Display</h2>
        
        <div className="space-y-6">
          {formData.ventures.map((venture, index) => (
            <div key={index} className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl space-y-4 relative">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Venture Name</label>
                    <input 
                      type="text"
                      value={venture.id}
                      onChange={(e) => updateVenture(index, 'id', e.target.value)}
                      className="w-full bg-[#111] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg font-bold uppercase tracking-widest text-sm"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">Earning Potential</label>
                    <input 
                      type="text"
                      value={venture.potential}
                      onChange={(e) => updateVenture(index, 'potential', e.target.value)}
                      className="w-full bg-[#111] border border-[#2A2A2A] text-[#00C9A7] px-3 py-2 rounded-lg font-bold text-sm"
                    />
                 </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Description</label>
                <textarea 
                  value={venture.desc}
                  onChange={(e) => updateVenture(index, 'desc', e.target.value)}
                  className="w-full bg-[#111] border border-[#2A2A2A] text-white px-3 py-2 rounded-lg text-xs leading-relaxed"
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={venture.comingSoon}
                  onChange={(e) => updateVenture(index, 'comingSoon', e.target.checked)}
                  className="w-4 h-4 rounded bg-[#111] border-[#2A2A2A] text-[#E8B84B] focus:ring-[#E8B84B] focus:ring-offset-black"
                />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mark as "Coming Soon"</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 bg-[#E8B84B] text-black w-full md:w-auto px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
      >
        {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
        Publish Changes
      </button>
    </div>
  );
}
