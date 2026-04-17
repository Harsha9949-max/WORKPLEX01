import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, HelpCircle, Phone, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { chatbotQuery } from '../../lib/cloudFunctions';

export default function AIChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { t, i18n } = useTranslation();
  const { currentUser, userData } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'bot', text: t('chatbot.help') }]);
    }
  }, [isOpen, messages.length, t]);

  const handleSend = async (textText: string = input) => {
    if (!textText.trim()) return;
    const userMsg = textText.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
        let botReply = "I am processing your request.";
        
        if (userMsg.toLowerCase().includes('agent') || userMsg.toLowerCase().includes('human')) {
           botReply = "I have notified our support team. A human agent will contact you shortly.";
           if (currentUser) {
             await addDoc(collection(db, 'chatbotEscalations'), {
               userId: currentUser.uid,
               message: userMsg,
               timestamp: serverTimestamp()
             });
           }
        } else {
           botReply = await chatbotQuery(userMsg, i18n.language);
        }

        setMessages(prev => [...prev, { role: 'bot', text: botReply }]);
        setIsTyping(false);
    } catch (e) {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to AI." }]);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-20 right-4 w-80 sm:w-96 h-[500px] bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[#E8B84B] flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                  <Bot size={18} className="text-black" />
                </div>
                <div>
                  <h3 className="font-black text-black uppercase tracking-widest text-sm leading-tight">WorkPlex Support</h3>
                  <p className="text-black/70 text-[10px] font-bold">AI Context Engine • {i18n.language.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-black/70 hover:text-black">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#E8B84B] text-black rounded-tr-sm font-medium' 
                      : 'bg-[#222222] text-white border border-white/5 rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#222222] text-gray-400 p-3 rounded-2xl border border-white/5 rounded-tl-sm flex gap-1">
                    <span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span><span className="animate-bounce" style={{animationDelay: '0.4s'}}>.</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips */}
            <div className="p-2 border-t border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => handleSend("What is KYC?")} className="flex-shrink-0 bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors">
                <HelpCircle size={12} /> FAQ
              </button>
              <button onClick={() => handleSend("Contact Human")} className="flex-shrink-0 bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors">
                <Phone size={12} /> Contact Human
              </button>
            </div>

            {/* InputBox */}
            <div className="p-3 border-t border-white/5 bg-[#1A1A1A]">
              <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl p-1 pr-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-white px-3 py-2 text-sm outline-none"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="bg-[#E8B84B] text-black w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 w-12 h-12 bg-[#E8B84B] text-black rounded-full shadow-lg shadow-[#E8B84B]/20 flex items-center justify-center z-[90] hover:scale-105 transition-transform"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </>
  );
}
