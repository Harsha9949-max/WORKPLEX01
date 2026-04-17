import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Zap, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, 
  Trophy, Target, Flame, ShoppingBag, Video, TrendingUp, 
  Users, Wallet, Clock, ChevronDown, Facebook, Twitter, 
  Instagram, Linkedin, Mail, Phone, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 3D Tilt Card Component
const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative w-full h-full rounded-2xl glass-card p-6 shadow-2xl transition-colors duration-300 hover:border-[#E8B84B]/50 ${className}`}
    >
      <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

interface FAQProps {
  question: string;
  answer: string;
  key?: React.Key;
}

const FAQItem = ({ question, answer }: FAQProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-medium text-gray-200 group-hover:text-[#E8B84B] transition-colors">{question}</span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#E8B84B]' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden relative selection:bg-[#E8B84B] selection:text-black">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E8B84B]/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00C9A7]/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-noise z-10" />
      </div>

      {/* 1. Unified Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] flex items-center justify-center shadow-[0_0_20px_rgba(232,184,75,0.3)] overflow-hidden p-1">
              <img src="https://gcdnb.pbrd.co/images/-QD5NsLGLsZD.png" alt="WorkPlex Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="font-outfit font-black text-2xl tracking-tight">WORKPLEX</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#ventures" className="hover:text-white transition-colors">Ventures</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#tasks" className="hover:text-white transition-colors">Tasks</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden md:block text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Login
            </button>
            <button 
              onClick={() => navigate('/join')}
              className="bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] text-black font-bold px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(232,184,75,0.2)]"
            >
              Start Earning
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* 2. The Power Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-[float_6s_ease-in-out_infinite]"
          >
            <Sparkles className="w-4 h-4 text-[#E8B84B]" />
            <span className="text-sm font-medium text-gray-300">Powered by HVRS Innovations</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-outfit font-black text-6xl md:text-8xl lg:text-9xl uppercase tracking-tighter leading-[0.9] mb-8"
          >
            Work From Home<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B84B] via-[#fff] to-[#E8B84B] text-glow-gold">
              Earn Daily
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12"
          >
            India's most advanced commission-based gig network. Complete simple tasks, share premium products, and withdraw your earnings instantly.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <button 
              onClick={() => navigate('/join')}
              className="group flex items-center gap-2 bg-gradient-to-r from-[#E8B84B] to-[#d4a63f] text-black font-bold px-8 py-4 rounded-full text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(232,184,75,0.3)]"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#ventures" className="px-8 py-4 rounded-full text-lg font-medium text-white glass-card hover:bg-white/5 transition-colors">
              Explore Ventures
            </a>
          </motion.div>
        </section>

        {/* 3. Venture Ecosystem Detailed */}
        <section id="ventures" className="max-w-7xl mx-auto px-6 py-32">
          <div className="text-center mb-20">
            <h2 className="font-outfit font-black text-4xl md:text-6xl uppercase tracking-tight mb-4">
              Our <span className="text-[#E8B84B]">Ventures</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Choose from our diverse ecosystem of platforms and start earning based on your skills and interests.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                id: 'BUYRIX', 
                icon: ShoppingBag, 
                color: 'text-blue-400', 
                bg: 'bg-blue-400/10',
                desc: 'Premium e-commerce platform. Earn commissions by promoting high-demand retail products.',
                potential: 'Up to ₹2,000/day'
              },
              { 
                id: 'VYUMA', 
                icon: Video, 
                color: 'text-purple-400', 
                bg: 'bg-purple-400/10',
                desc: 'Next-gen media network. Get paid for content creation, video reviews, and social engagement.',
                potential: 'Up to ₹3,500/day'
              },
              { 
                id: 'TRENDYVERSE', 
                icon: TrendingUp, 
                color: 'text-pink-400', 
                bg: 'bg-pink-400/10',
                desc: 'Fashion & lifestyle hub. Influence trends and earn through curated style recommendations.',
                potential: 'Up to ₹2,500/day'
              },
              { 
                id: 'GROWPLEX', 
                icon: Users, 
                color: 'text-green-400', 
                bg: 'bg-green-400/10',
                desc: 'B2B growth engine. Earn big by acquiring high-value clients and providing support services.',
                potential: 'Up to ₹5,000/day'
              }
            ].map((venture, i) => (
              <motion.div
                key={venture.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 rounded-3xl flex flex-col group hover:border-[#E8B84B]/30 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl ${venture.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <venture.icon className={`w-7 h-7 ${venture.color}`} />
                </div>
                <h3 className="font-outfit font-black text-2xl mb-3 tracking-wider">{venture.id}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-grow">
                  {venture.desc}
                </p>
                <div className="pt-6 border-t border-white/5">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Earning Potential</p>
                  <p className="text-[#00C9A7] font-bold">{venture.potential}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. How It Works Section */}
        <section id="how-it-works" className="w-full bg-white/[0.02] border-y border-white/5 py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="font-outfit font-black text-4xl md:text-6xl uppercase tracking-tight mb-4">
                How It <span className="text-[#00C9A7]">Works</span>
              </h2>
              <p className="text-gray-400 text-lg">Four simple steps to financial freedom.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-12 relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2 z-0" />
              
              {[
                { step: '01', title: 'Join', desc: 'Create your free account in 60 seconds and get your ₹27 joining bonus.', icon: Users },
                { step: '02', title: 'Pick', desc: 'Select a task from any of our 4 ventures that matches your interest.', icon: Target },
                { step: '03', title: 'Submit', desc: 'Complete the task and upload your proof (screenshot or link).', icon: CheckCircle2 },
                { step: '04', title: 'Earn', desc: 'Get your commission approved and withdraw directly to your UPI.', icon: Wallet }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative z-10 flex flex-col items-center text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-[#111111] border border-white/10 flex items-center justify-center mb-6 relative group">
                    <div className="absolute inset-0 rounded-full bg-[#E8B84B]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <item.icon className="w-8 h-8 text-[#E8B84B] relative z-10" />
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#E8B84B] text-black font-bold text-xs flex items-center justify-center border-4 border-[#0A0A0A]">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Feature Highlight (Existing) */}
        <section id="tasks" className="max-w-7xl mx-auto px-6 py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <h2 className="font-outfit font-black text-4xl md:text-6xl uppercase tracking-tight leading-tight">
                Simple Tasks.<br />
                <span className="text-[#00C9A7]">Real Earnings.</span>
              </h2>
              <p className="text-gray-400 text-lg">
                No complex interviews. No hidden fees. Just pick a task, submit your proof, and get paid directly to your UPI.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Choose Your Role (Creator, Promoter, Reseller)',
                  'Submit Proof (Screenshots or Links)',
                  'Instant Joining Bonus (₹27 Guaranteed)',
                  'Razorpay Secure Payouts'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle2 className="w-6 h-6 text-[#00C9A7] flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[500px]"
            >
              <TiltCard>
                <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-xl border border-white/10 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-[#E8B84B]/20 flex items-center justify-center">
                      <Target className="w-6 h-6 text-[#E8B84B]" />
                    </div>
                    <span className="font-mono text-sm text-[#00C9A7] bg-[#00C9A7]/10 px-3 py-1 rounded-full">₹ 150.00</span>
                  </div>
                  <h3 className="font-bold text-xl mb-2">Social Media Promotion</h3>
                  <p className="text-sm text-gray-400 mb-6">Share the latest BuyRix catalog on your WhatsApp status and submit a screenshot.</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-gray-500 bg-white/5">
                      Upload Screenshot Proof
                    </div>
                    <button className="w-full bg-[#E8B84B] text-black font-bold py-3 rounded-lg">
                      Submit Proof
                    </button>
                  </div>
                </div>
              </TiltCard>

              {/* Floating Badge */}
              <motion.div 
                className="absolute -bottom-6 -left-6 glass-card p-4 rounded-2xl flex items-center gap-4 animate-[float_5s_ease-in-out_infinite]"
                style={{ animationDelay: '1s' }}
              >
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="font-bold text-white">Joining Bonus</p>
                  <p className="text-xs text-gray-400">Up to ₹500</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* 6. FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-32">
          <div className="text-center mb-16">
            <h2 className="font-outfit font-black text-4xl md:text-6xl uppercase tracking-tight mb-4">
              Common <span className="text-[#E8B84B]">Questions</span>
            </h2>
            <p className="text-gray-400">Everything you need to know about starting your gig journey.</p>
          </div>

          <div className="glass-card rounded-[2rem] p-8 md:p-12 border border-white/5">
            {[
              { 
                question: "How do I get paid?", 
                answer: "All payments are processed securely via Razorpay. Once your task proof is approved by our admins, the commission is added to your wallet. You can withdraw your earnings directly to your UPI ID once you reach the minimum threshold." 
              },
              { 
                question: "Is there any joining fee?", 
                answer: "No, WorkPlex is completely free to join. In fact, we give you a ₹27 joining bonus just for creating your account and completing your profile." 
              },
              { 
                question: "What kind of tasks will I do?", 
                answer: "Tasks vary by venture. You might share product catalogs on social media, create short video reviews, acquire new clients for B2B services, or provide customer support. You choose what suits you best." 
              },
              { 
                question: "How long does task approval take?", 
                answer: "Our team typically reviews and approves task submissions within 12-24 hours. During peak times, it might take up to 48 hours." 
              },
              { 
                question: "Can I work for multiple ventures?", 
                answer: "Yes! While you pick a primary venture during onboarding, you can explore and complete tasks from any of the four ventures (BuyRix, Vyuma, TrendyVerse, Growplex) once you're inside the platform." 
              }
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* 6.5 Live Platform Stats / Wall of Trust */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card rounded-[2rem] p-8 border border-white/5 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Users className="w-24 h-24 text-white" />
              </div>
              <h3 className="font-outfit font-black text-5xl text-[#00C9A7] mb-2">50K+</h3>
              <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Active Workers</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-[2rem] p-8 border border-[#E8B84B]/20 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-[#E8B84B]/5 to-transparent"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-24 h-24 text-[#E8B84B]" />
              </div>
              <h3 className="font-outfit font-black text-5xl text-[#E8B84B] mb-2">₹12M+</h3>
              <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Paid Out Securely</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-[2rem] p-8 border border-white/5 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target className="w-24 h-24 text-white" />
              </div>
              <h3 className="font-outfit font-black text-5xl text-white mb-2">750+</h3>
              <p className="text-gray-400 font-medium uppercase tracking-widest text-sm">Daily Tasks Added</p>
            </motion.div>
          </div>
        </section>

        {/* 7. Final Conversion - Ultra Modern CTA */}
        <section className="mx-auto px-4 sm:px-6 lg:px-8 py-24 mb-10 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden bg-[#0A0A0A] border-y border-[#E8B84B]/30"
          >
            {/* Glowing background flares */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-[#E8B84B]/20 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-[#00C9A7]/10 blur-[100px] pointer-events-none rounded-full" />

            {/* Grid Pattern overlay */}
            <div 
              className="absolute inset-0 opacity-50 pointer-events-none mask-image-gradient-b" 
              style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')" }}
            />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8B84B]/30 bg-[#E8B84B]/10 text-[#E8B84B] text-sm font-bold mb-8">
                <Zap size={16} /> 100% Free Registration
              </div>
              
              <h2 className="font-outfit font-black text-5xl md:text-8xl uppercase tracking-tighter mb-6 leading-[0.9]">
                Ready to take <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8B84B] to-white">Control?</span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                No boss. No commute. Just your phone and unlimited earning potential. Create your account today and unlock your guaranteed ₹27 joining bonus.
              </p>
              
              <button 
                onClick={() => navigate('/join')}
                className="group relative inline-flex items-center justify-center bg-[#E8B84B] text-black font-black px-12 py-5 rounded-full text-xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(232,184,75,0.4)]"
              >
                <span>Create Free Account</span>
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-10 flex flex-wrap justify-center items-center gap-6 md:gap-12">
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-[#00C9A7]" />
                  Verify in 2 Mins
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <ShieldCheck className="w-5 h-5 text-[#00C9A7]" />
                  Razorpay Secured
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                  <Sparkles className="w-5 h-5 text-[#E8B84B]" />
                  Instant Withdrawals
                </div>
              </div>

              <div className="mt-12 text-center text-xs tracking-[0.2em] text-gray-600 uppercase font-bold">
                Powered by HVRS Innovations
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
