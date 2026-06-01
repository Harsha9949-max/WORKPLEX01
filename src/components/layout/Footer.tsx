import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Mail, Phone, MapPin, ShieldCheck, ChevronRight, Zap, Twitter, Instagram, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-12 md:pt-20 pb-8 md:pb-10 relative overflow-hidden z-10 w-full mt-auto">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-[#E8B84B]/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12 mb-10 md:mb-16">
          
          {/* Column 1: Brand */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex flex-col items-center md:items-start gap-4">
               <Logo variant="white" size="md" />
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] flex items-center justify-center p-0.5">
                   <img src="https://gcdnb.pbrd.co/images/-QD5NsLGLsZD.png" alt="HVRS Innovations Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                 </div>
                 <span className="font-outfit font-bold text-[10px] md:text-xs text-gray-400 tracking-tight">POWERED BY HVRS INNOVATIONS</span>
               </div>
            </div>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-[280px]">
              Empowering India's gig workforce with transparent, compliant, and highly rewarding digital opportunities.
            </p>
            <div className="flex items-center gap-3 md:gap-4 mt-2">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#E8B84B]/10 hover:text-[#E8B84B] transition-all border border-white/5">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Legal Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-white font-bold mb-4 md:mb-6 flex items-center gap-2 uppercase tracking-widest text-[10px] md:text-xs">
              <ShieldCheck className="text-[#E8B84B]" size={14} /> Legal & Compliance
            </h4>
            <ul className="space-y-3 md:space-y-4 text-center md:text-left text-xs md:text-sm">
              {[
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms of Service', path: '/terms' },
                { name: 'Cookie Policy', path: '/cookies' },
                { name: 'Security Center', path: '/security' }
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="group flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-[#E8B84B] transition-colors">
                    <ChevronRight size={14} className="hidden md:block opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#E8B84B]" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-widest text-[10px] md:text-xs">Contact Headquarters</h4>
            <ul className="space-y-4 md:space-y-6">
              <li>
                <a href="mailto:workplex@gmail.com" className="group flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#E8B84B]/20 transition-colors shrink-0 border border-white/5">
                    <Mail size={14} className="text-gray-400 group-hover:text-[#E8B84B]" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5 md:mb-1">Email Support</p>
                    <span className="text-gray-300 text-xs md:text-sm group-hover:text-white transition-colors">workplex@gmail.com</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="tel:9949175029" className="group flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00C9A7]/20 transition-colors shrink-0 border border-white/5">
                    <Phone size={14} className="text-gray-400 group-hover:text-[#00C9A7]" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5 md:mb-1">Direct Line</p>
                    <span className="text-gray-300 text-xs md:text-sm group-hover:text-white transition-colors">9949175029</span>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                    <MapPin size={14} className="text-gray-400" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5 md:mb-1">Location</p>
                    <span className="text-gray-300 text-xs md:text-sm">Hyderabad, India<br/><span className="text-[10px] md:text-xs text-gray-500">Global Operations Center</span></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust Badges */}
          <div className="flex flex-col items-center md:items-start">
             <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-widest text-[10px] md:text-xs">Platform Trust</h4>
             <div className="space-y-3 md:space-y-4 w-full max-w-[280px] md:max-w-none">
                <div className="glass-card p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 flex items-center gap-3 md:gap-4 hover:border-white/10 transition-colors cursor-default">
                   <div className="bg-[#00C9A7]/10 p-2 rounded-lg">
                     <ShieldCheck className="text-[#00C9A7]" size={20} />
                   </div>
                   <div>
                      <p className="text-white text-xs md:text-sm font-bold">DPDP Act Ready</p>
                      <p className="text-gray-500 text-[9px] md:text-[10px] uppercase tracking-widest mt-0.5">Vetted & Compliant</p>
                   </div>
                </div>
                <div className="glass-card p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 flex items-center gap-3 md:gap-4 hover:border-[#E8B84B]/20 transition-colors cursor-default">
                   <div className="bg-[#E8B84B]/10 p-2 rounded-lg">
                     <Zap className="text-[#E8B84B]" size={20} />
                   </div>
                   <div>
                      <p className="text-white text-xs md:text-sm font-bold">Lightning Payouts</p>
                      <p className="text-gray-500 text-[9px] md:text-[10px] uppercase tracking-widest mt-0.5">Powered by Razorpay</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-center">
          <p className="text-gray-500 text-[10px] md:text-xs">
            © {new Date().getFullYear()} HVRS Innovations. All rights reserved.
          </p>
          <div className="flex items-center gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span className="hover:text-gray-400 transition-colors cursor-pointer">WorkPlex Hub</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="hover:text-gray-400 transition-colors cursor-pointer">Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
