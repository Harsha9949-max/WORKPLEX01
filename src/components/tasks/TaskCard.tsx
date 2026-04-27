import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, getStatusColor, getVentureColor } from '../../utils/taskUtils';
import CountdownTimer from './CountdownTimer';
import { ImageIcon, Link as LinkIcon, FileText, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';

interface Props {
  task: any;
  status: string;
  onClick: () => void;
  onSkip?: (e: React.MouseEvent) => void;
}

const getProofIcon = (type: string) => {
  switch (type) {
    case 'image': return <><ImageIcon size={14} className="inline mr-1"/> Image</>;
    case 'link': return <><LinkIcon size={14} className="inline mr-1"/> Link</>;
    case 'text': return <><FileText size={14} className="inline mr-1"/> Text</>;
    default: return <><ImageIcon size={14} className="inline mr-1"/> Image</>;
  }
};

const getStatusBadge = (status: string, reward: number) => {
  switch (status) {
    case 'submitted':
      return <div className="bg-blue-500/20 text-blue-400 font-bold px-3 py-1.5 rounded-lg text-xs w-full text-center">Awaiting Review</div>;
    case 'approved':
      return <div className="bg-green-500/20 text-green-400 font-bold px-3 py-1.5 rounded-lg text-xs w-full text-center flex items-center justify-center gap-1"><CheckCircle size={14}/> Approved +{formatCurrency(reward)}</div>;
    case 'rejected':
      return <div className="bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-lg text-xs w-full text-center flex items-center justify-center gap-1"><XCircle size={14}/> Rejected — Resubmit</div>;
    case 'expired':
      return <div className="bg-gray-800 text-gray-500 font-bold px-3 py-1.5 rounded-lg text-xs w-full text-center flex items-center justify-center gap-1"><Clock size={14}/> Deadline Passed</div>;
    default:
      return null;
  }
};

const VentureBadge = ({ venture }: { venture: string }) => {
  const ventureColors: Record<string, string> = {
    buyrix: '#3B82F6',
    vyuma: '#8B5CF6',
    growplex: '#00C9A7'
  };
  const color = ventureColors[venture?.toLowerCase() || 'buyrix'] || '#E8B84B';
  return (
    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: `${color}20`, color: color }}>
      {venture}
    </span>
  );
};

const getPlatformIcon = (platform?: string) => {
  if (!platform) return null;
  switch (platform.toLowerCase()) {
    case 'instagram': return <span className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 text-white px-2 py-0.5 rounded-sm">📷 IG</span>;
    case 'youtube': return <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded-sm">▶️ YT</span>;
    case 'facebook': return <span className="bg-blue-500/20 text-blue-500 border border-blue-500/30 px-2 py-0.5 rounded-sm">📘 FB</span>;
    case 'twitter': return <span className="bg-sky-500/20 text-sky-500 border border-sky-500/30 px-2 py-0.5 rounded-sm">🐦 X</span>;
    default: return null;
  }
};

const getContentTypeIcon = (cType?: string) => {
  if (!cType) return null;
  switch (cType.toLowerCase()) {
    case 'photo': return <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded-sm">📸 Photo</span>;
    case 'video': return <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded-sm">🎬 Video</span>;
    case 'reel': return <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded-sm">🎵 Reel</span>;
    case 'caption': return <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded-sm">✍️ Caption</span>;
    case 'blog': return <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded-sm">📖 Blog</span>;
    case 'infographic': return <span className="bg-[#2A2A2A] text-gray-300 px-2 py-0.5 rounded-sm">📊 Info</span>;
    default: return null;
  }
};

export default function TaskCard({ task, status = 'pending', onClick, onSkip }: Props) {
  // If task has expiresAt or deadline
  const deadline = task.expiresAt instanceof Timestamp ? task.expiresAt.toDate() : (task.deadline || new Date(Date.now() + 86400000));
  const isPending = status === 'pending';
  const [showBrief, setShowBrief] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors"
      onClick={!isPending ? onClick : undefined}
    >
      <div className="flex justify-between items-center">
         <div className="flex items-center gap-2 flex-wrap">
            <VentureBadge venture={task.venture || 'BuyRix'} />
            {(task.contentType || task.platform) && (
               <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
                  {getContentTypeIcon(task.contentType)}
                  {getPlatformIcon(task.platform)}
               </div>
            )}
         </div>
         <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest bg-[#1A1A1A] px-2 py-0.5 rounded-sm ml-2 shrink-0">
           {task.dayAssigned || 'DAY 1'}
         </span>
      </div>

      <div>
         <h3 className="text-white font-bold text-lg leading-tight mb-1">{task.title}</h3>
         <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{task.description}</p>
      </div>

      <div className="flex gap-2">
         <div className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2 flex items-center justify-center">
            <span className="text-[#E8B84B] font-black">{formatCurrency(task.reward || task.earnAmount || 0)}</span>
         </div>
         <div className="flex-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-2 flex items-center justify-center">
            {isPending ? (
               <span className="text-[#00C9A7] font-mono text-sm font-bold flex items-center gap-1">
                  ⏱ <CountdownTimer deadline={deadline} />
               </span>
            ) : (
               <span className="text-gray-500 font-mono text-sm font-bold flex items-center gap-1">
                  ⏱ --:--:--
               </span>
            )}
         </div>
      </div>

      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest border-t border-[#2A2A2A] mt-1 pt-3">
         <div className="flex items-center gap-1">
            Proof type: <span className="text-gray-300 ml-1">{getProofIcon(task.proofType || 'image')}</span>
         </div>
         {task.contentBrief && (
            <button 
               onClick={(e) => { e.stopPropagation(); setShowBrief(!showBrief); }}
               className="text-pink-500 hover:text-pink-400 flex items-center gap-1"
            >
               View Brief <ChevronDown size={14} className={`transition-transform ${showBrief ? 'rotate-180' : ''}`} />
            </button>
         )}
      </div>

      {showBrief && task.contentBrief && (
         <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3 mt-1 text-sm text-pink-100">
            <p className="font-bold text-pink-400 text-xs uppercase tracking-widest mb-1.5 flex items-center gap-1">
               <span>📋</span> Content Brief
            </p>
            <p className="leading-relaxed opacity-90">{task.contentBrief}</p>
         </div>
      )}

      {isPending ? (
         <div className="flex gap-2 mt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="flex-1 bg-[#E8B84B] text-black font-black uppercase tracking-widest text-xs py-3 rounded-lg shadow-[0_0_15px_rgba(232,184,75,0.2)] hover:bg-[#E8B84B]/90 transition"
            >
              Start Task
            </button>
            {onSkip && (
              <button 
                onClick={(e) => { e.stopPropagation(); onSkip(e); }}
                className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition bg-[#1A1A1A] rounded-lg border border-[#2A2A2A]"
              >
                Skip
              </button>
            )}
         </div>
      ) : (
         <div className="mt-2 text-center" onClick={(e) => { e.stopPropagation(); onClick(); }}>
            {getStatusBadge(status, task.reward || task.earnAmount || 0)}
         </div>
      )}
    </motion.div>
  );
}
