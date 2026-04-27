import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Mail, Phone, MapPin, ShieldCheck, ChevronRight, Zap, Twitter, Instagram, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-20 pb-10 relative overflow-hidden z-10 w-full mt-auto">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-32 bg-[#E8B84B]/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex flex-col gap-4">
               <Logo variant="white" size="md" />
               <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] flex items-center justify-center p-0.5">
                   <img src="https://gcdnb.pbrd.co/images/-QD5NsLGLsZD.png" alt="HVRS Innovations Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                 </div>
                 <span className="font-outfit font-bold text-xs text-gray-400 tracking-tight">POWERED BY HVRS INNOVATIONS</span>
               </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering India's gig workforce with transparent, compliant, and highly rewarding digital opportunities.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Facebook, Instagram, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#E8B84B]/10 hover:text-[#E8B84B] transition-all border border-white/5">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Legal Links */}
          <div>
            <h4 className="text-white font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
              <ShieldCheck className="text-[#E8B84B]" size={16} /> Legal & Compliance
            </h4>
            <ul className="space-y-4">
              {[
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms of Service', path: '/terms' },
                { name: 'Cookie Policy', path: '/cookies' },
                { name: 'Security Center', path: '/security' }
              ].map((link, i) => (
                <li key={i}>
                  <Link to={link.path} className="group flex items-center gap-2 text-gray-400 hover:text-[#E8B84B] text-sm transition-colors">
                    <ChevronRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-[#E8B84B]" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Contact Headquarters</h4>
            <ul className="space-y-6">
              <li>
                <a href="mailto:workplex@gmail.com" className="group flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#E8B84B]/20 transition-colors shrink-0 border border-white/5">
                    <Mail size={16} className="text-gray-400 group-hover:text-[#E8B84B]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Email Support</p>
                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">workplex@gmail.com</span>
                  </div>
                </a>
              </li>
              <li>
                <a href="tel:9949175029" className="group flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00C9A7]/20 transition-colors shrink-0 border border-white/5">
                    <Phone size={16} className="text-gray-400 group-hover:text-[#00C9A7]" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Direct Line</p>
                    <span className="text-gray-300 text-sm group-hover:text-white transition-colors">9949175029</span>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                    <MapPin size={16} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Location</p>
                    <span className="text-gray-300 text-sm">Hyderabad, India<br/><span className="text-xs text-gray-500">Global Operations Center</span></span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust Badges */}
          <div>
             <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Platform Trust</h4>
             <div className="space-y-4">
                <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-white/10 transition-colors cursor-default">
                   <div className="bg-[#00C9A7]/10 p-2 rounded-lg">
                     <ShieldCheck className="text-[#00C9A7]" size={24} />
                   </div>
                   <div>
                      <p className="text-white text-sm font-bold">DPDP Act Ready</p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">Vetted & Compliant</p>
                   </div>
                </div>
                <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:border-[#E8B84B]/20 transition-colors cursor-default">
                   <div className="bg-[#E8B84B]/10 p-2 rounded-lg">
                     <Zap className="text-[#E8B84B]" size={24} />
                   </div>
                   <div>
                      <p className="text-white text-sm font-bold">Lightning Payouts</p>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-0.5">Powered by Razorpay</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} HVRS Innovations. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
            <span className="hover:text-gray-400 transition-colors cursor-pointer">WorkPlex Hub</span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="hover:text-gray-400 transition-colors cursor-pointer">Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
