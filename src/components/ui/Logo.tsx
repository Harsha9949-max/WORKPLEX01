import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface LogoProps {
  variant?: 'primary' | 'white' | 'icon' | 'horizontal' | 'vertical' | 'mono';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  onClick?: () => void;
  loading?: 'eager' | 'lazy';
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  animated = false,
  onClick,
}) => {
  const [error, setError] = useState(false);

  // Responsive size classes
  const sizes = {
    xs: 'h-6 sm:h-8',
    sm: 'h-8 sm:h-10',
    md: 'h-8 md:h-10 lg:h-12', // mobile: 32px, tablet: 40px, desktop: 48px
    lg: 'h-16 lg:h-20',
    xl: 'h-24 lg:h-32',
  };

  // Base paths for if we use external images. 
  // In this implementation, we use inline SVGs as a robust fallback/primary to ensure it looks amazing instantly.
  
  const getGlowColor = () => {
     switch (variant) {
        case 'primary': return 'rgba(232, 184, 75, 0.4)';
        case 'white': return 'rgba(255, 255, 255, 0.3)';
        case 'mono': return 'rgba(156, 163, 175, 0.2)';
        default: return 'rgba(232, 184, 75, 0.4)';
     }
  };

  const glowEffect = {
    boxShadow: [
      `0 0 10px ${getGlowColor()}`,
      `0 0 25px ${getGlowColor()}`,
      `0 0 10px ${getGlowColor()}`
    ]
  };

  const LogoContent = () => {
    // We will render beautiful inline SVGs for the WorkPlex brand since files aren't uploaded yet
    
    const primaryColor = variant === 'white' || variant === 'mono' ? '#FFFFFF' : '#E8B84B';
    const secondaryColor = variant === 'mono' ? '#9CA3AF' : variant === 'white' ? '#FFFFFF' : '#00C9A7';
    const textColor = variant === 'mono' ? '#9CA3AF' : '#FFFFFF';

    if (error) {
      return (
         <div className={`font-black tracking-tighter flex items-center ${textColor === '#FFFFFF' ? 'text-white' : 'text-gray-400'}`} style={{ height: '100%', fontSize: 'inherit' }}>
            WORK<span style={{ color: primaryColor }}>PLEX</span>
         </div>
      );
    }

    if (variant === 'icon') {
       return (
         <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full drop-shadow-lg">
           <rect x="10" y="10" width="80" height="80" rx="20" fill="url(#gradIcon)" />
           <path d="M30 35 L42 65 L50 45 L58 65 L70 35" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
           <path d="M42 65 L50 45 L58 65" stroke={primaryColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
           <defs>
             <linearGradient id="gradIcon" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
               <stop stopColor="#1A1A1A" />
               <stop offset="1" stopColor="#0A0A0A" />
             </linearGradient>
           </defs>
         </svg>
       );
    }

    if (variant === 'vertical') {
       return (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
             <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full max-h-[70%] drop-shadow-2xl">
               <path d="M20 25 L40 75 L50 50 L60 75 L80 25" stroke={primaryColor} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
               <path d="M40 75 L50 50 L60 75" stroke={secondaryColor} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
             <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter" style={{ color: textColor }}>
                WORK<span style={{ color: primaryColor }}>PLEX</span>
             </h1>
          </div>
       );
    }

    // Horizontal / Primary / White / Mono
    return (
      <svg viewBox="0 0 450 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-auto h-full drop-shadow-md">
        <path d="M20 25 L40 75 L50 50 L60 75 L80 25" stroke={primaryColor} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 75 L50 50 L60 75" stroke={secondaryColor} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        
        <text x="110" y="70" fontFamily="sans-serif" fontWeight="900" fontSize="56" fill={textColor} letterSpacing="-2">
          WORK<tspan fill={primaryColor}>PLEX</tspan>
        </text>
      </svg>
    );
  };

  const Wrapper = motion.div;

  return (
    <Wrapper 
      className={`relative inline-flex items-center justify-center ${sizes[size]} w-auto cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B84B] rounded-lg ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      aria-label="WorkPlex - Earn From Home"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
         if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
         }
      }}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
    >
       <div className="relative w-full h-full z-10 flex items-center justify-center">
          <LogoContent />
       </div>
       
       {animated && (
          <motion.div 
            className="absolute inset-0 rounded-full z-0 blur-xl"
            animate={glowEffect}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
       )}
    </Wrapper>
  );
};

export default Logo;
