import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, CheckCircle, Video, Image as ImageIcon, MessageSquare, Info } from 'lucide-react';

export default function ContentStudioGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const tips = [
    {
      id: 'formats',
      title: 'Content Formats',
      icon: Video,
      description: 'We accept Reels, Shorts, standard posts, and carousels. Video content usually earns higher rewards.',
    },
    {
      id: 'quality',
      title: 'Quality Standards',
      icon: CheckCircle,
      description: 'Ensure good lighting, clear audio, and readable text. Tag the correct venture in your posts.',
    },
    {
      id: 'submission',
      title: 'How to Submit',
      icon: ImageIcon,
      description: 'Upload your final content via the Studio tab. Include your caption and relevant hashtags.',
    },
    {
      id: 'rewards',
      title: 'Getting Paid',
      icon: MessageSquare,
      description: 'Once approved, rewards are credited directly to your Wallet. Substandard content will be asked to revise.',
    }
  ];

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl overflow-hidden mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-[#1A1A1A] hover:bg-[#2A2A2A] transition"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={20} className="text-pink-500" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white">How it works</h2>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-[#2A2A2A] space-y-4 bg-[#111111]">
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                As a Content Creator, your role is to produce high-quality media for our ventures. Here's what you need to know:
              </p>
              
              <div className="grid grid-cols-2 gap-3 pb-2">
                {tips.map((tip) => (
                  <div 
                    key={tip.id} 
                    className="relative bg-[#1A1A1A] p-3 rounded-xl border border-[#2A2A2A] cursor-pointer hover:border-pink-500/50 transition-colors"
                    onMouseEnter={() => setShowTooltip(tip.id)}
                    onMouseLeave={() => setShowTooltip(null)}
                    onClick={() => setShowTooltip(showTooltip === tip.id ? null : tip.id)}
                  >
                    <tip.icon size={16} className="text-pink-500 mb-2" />
                    <h3 className="text-[10px] font-bold text-white uppercase">{tip.title}</h3>
                    
                    <AnimatePresence>
                      {showTooltip === tip.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute z-50 left-0 bottom-full mb-2 w-[200px] bg-[#0A0A0A] border border-[#2A2A2A] p-3 rounded-lg shadow-xl shadow-black/50 pointer-events-none"
                        >
                          <div className="flex items-start gap-2">
                             <Info size={14} className="text-pink-500 shrink-0 mt-0.5" />
                             <p className="text-[10px] text-gray-300 font-medium leading-relaxed">{tip.description}</p>
                          </div>
                          {/* Triangle indicator */}
                          <div className="absolute -bottom-2 left-4 w-4 h-4 bg-[#0A0A0A] border-b border-l border-[#2A2A2A] transform -rotate-45"></div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
