import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  text: string;
  priority: number;
}

interface Props {
  announcements: Announcement[];
}

export default function AnnouncementBanner({ announcements }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [announcements, isPaused]);

  if (announcements.length === 0) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 z-40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="bg-gradient-to-r from-[#E8B84B] to-[#00C9A7] p-[1px] rounded-full shadow-lg">
        <div className="bg-[#0A0A0A] rounded-full px-4 py-2 flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0">
            <Megaphone className="w-4 h-4 text-[#E8B84B]" />
          </div>
          
          <div className="flex-grow relative h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentIndex}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="text-xs font-medium text-white whitespace-nowrap"
              >
                {announcements[currentIndex].text}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
