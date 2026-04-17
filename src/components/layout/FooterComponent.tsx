import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ExternalLink, Shield } from 'lucide-react';

export default function FooterComponent() {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/cookies' },
    { name: 'Security', path: '/security' }
  ];

  return (
    <footer className="bg-black border-t border-white/5 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-black text-white mb-4 tracking-tighter">HVRS INNOVATIONS</h2>
            <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
              WorkPlex is a unified digital workforce platform designed to empower professionals across India 
              with seamless task management and global opportunities.
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:workplex@gmail.com" className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                <Mail className="w-5 h-5 text-gray-400" />
              </a>
              <a href="tel:9949175029" className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                <Phone className="w-5 h-5 text-gray-400" />
              </a>
              <div className="bg-white/5 p-3 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">Legal & Trust</h3>
            <ul className="space-y-4">
              {legalLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-gray-500 hover:text-yellow-500 transition-colors text-sm flex items-center gap-2 group">
                    {link.name}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-6">Contact Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3 text-gray-500">
                <Mail className="w-4 h-4 text-yellow-500/50" />
                <span>workplex@gmail.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <Phone className="w-4 h-4 text-yellow-500/50" />
                <span>+91 9949175029</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <MapPin className="w-4 h-4 text-yellow-500/50" />
                <span>Hyderabad, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">
            © {currentYear} HVRS INNOVATIONS. All Rights Reserved.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-gray-700 font-black uppercase tracking-widest">
            <Shield className="w-3 h-3" />
            <span>Encrypted & Secure Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
