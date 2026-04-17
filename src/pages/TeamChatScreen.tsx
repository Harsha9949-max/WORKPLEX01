import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  ChevronLeft, 
  Users, 
  MoreVertical, 
  Smile, 
  Image as ImageIcon,
  ShieldCheck,
  TrendingUp,
  Circle
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
}

export default function TeamChatScreen() {
  const { leadId } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!leadId) return;

    // Fetch Team Lead Info
    getDoc(doc(db, 'users', leadId)).then(docSnap => {
      if (docSnap.exists()) {
        setTeamInfo(docSnap.data());
      }
    });

    // Listen for Messages
    const q = query(
      collection(db, 'teamChats', leadId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [leadId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !leadId) return;

    try {
      await addDoc(collection(db, 'teamChats', leadId, 'messages'), {
        senderId: currentUser.uid,
        senderName: userData?.name || 'Worker',
        text: inputText.trim(),
        timestamp: serverTimestamp()
      });
      setInputText('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  if (!currentUser) return null;

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col z-50">
      {/* Header */}
      <div className="bg-[#111111] border-b border-white/5 p-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
          <ChevronLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E8B84B] to-amber-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Users size={20} className="text-black" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#111111] rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">{teamInfo?.name || 'Team'}'s Venture</h3>
            <div className="flex items-center gap-1.5">
              <Circle size={8} className="fill-green-500 text-green-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{messages.length < 5 ? 'New Team' : 'Active Discussion'}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full">
          <MoreVertical size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {/* Welcome Banner */}
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/5">
            <ShieldCheck size={32} className="text-amber-500" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-widest">End-to-End Secured</h4>
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tight max-w-[200px]">Only your team lead and venture members can see this chat.</p>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 ml-2">
                    {msg.senderName}
                  </span>
                )}
                <div 
                  className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                    isMe 
                    ? 'bg-[#E8B84B] text-black rounded-tr-none' 
                    : 'bg-[#1A1A1A] text-white rounded-tl-none border border-white/5'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-tighter mt-1 px-1">
                  {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'sending...'}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#111111] border-t border-white/5 pb-10">
        <form 
          onSubmit={handleSendMessage}
          className="bg-black/40 border border-white/5 rounded-[32px] p-2 flex items-center gap-2"
        >
          <button type="button" className="p-3 text-gray-500 hover:text-white transition-colors">
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none text-white text-sm py-3 px-2 placeholder:text-gray-700"
          />
          <button type="button" className="p-3 text-gray-500 hover:text-white transition-colors">
            <ImageIcon size={20} />
          </button>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 bg-[#E8B84B] rounded-2xl flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#E8B84B]/20 disabled:opacity-20 disabled:grayscale"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Floating Insight (Contextual) */}
      <div className="absolute top-24 right-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 flex items-center gap-2 backdrop-blur-md"
        >
          <TrendingUp size={14} className="text-green-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Live: +12 Active</span>
        </motion.div>
      </div>
    </div>
  );
}
