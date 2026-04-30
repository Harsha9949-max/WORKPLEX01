import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, FileCheck, CreditCard, Tag, TrendingUp, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AddWorkerModal from './AddWorkerModal';
import toast from 'react-hot-toast';

import SubAdminTasks from './SubAdminTasks';
import SubAdminWithdrawals from './SubAdminWithdrawals';
import SubAdminCoupons from './SubAdminCoupons';
import SubAdminAnalytics from './SubAdminAnalytics';

const PendingWorkerCard = ({ worker, venture, onApprove, onReject }: any) => {
   const [selectedRole, setSelectedRole] = useState('');
   const roles = venture === 'Growplex' ? ['Promoter', 'Content Creator'] : ['Marketer', 'Content Creator', 'Reseller'];

   return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] flex items-center justify-center font-bold text-[#F59E0B]">
               {worker.name?.charAt(0) || 'W'}
            </div>
            <div className="flex flex-col">
               <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">{worker.name}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">⏳ Pending</span>
               </div>
               <span className="text-xs text-gray-400 font-medium font-mono mt-1">{worker.phone}</span>
               
               <div className="flex items-center gap-4 mt-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">KYC: <span className="text-[#10B981]">Submitted ✅</span></span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Agrmt: <span className="text-[#10B981]">Signed ✅</span></span>
               </div>
            </div>
         </div>

         <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <select 
               value={selectedRole}
               onChange={(e) => setSelectedRole(e.target.value)}
               className="w-full sm:w-auto bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-[#F59E0B] text-sm"
            >
               <option value="" disabled>Select Role...</option>
               {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            
            <div className="flex w-full sm:w-auto gap-2">
               <button onClick={onReject} className="flex-1 sm:flex-none text-xs bg-[#1A1A1A] font-bold text-red-500 uppercase px-4 py-2 rounded-lg hover:bg-red-500/10 transition">Reject</button>
               <button onClick={() => onApprove(selectedRole)} className="flex-1 sm:flex-none text-xs bg-[#F59E0B] text-black font-black uppercase px-6 py-2 rounded-lg hover:bg-[#F59E0B]/90 transition">Approve & Activate</button>
            </div>
         </div>
      </div>
   );
};

export default function SubAdminPanel() {
  const { userData, currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab') || 'workers';

  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [workers, setWorkers] = useState<any[]>([]);
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);

  useEffect(() => {
     if (tabFromUrl) {
        setActiveTab(tabFromUrl);
     }
  }, [tabFromUrl]);

  // Fetch Workers for the Venture
  useEffect(() => {
     if (!userData?.venture) return;

     const usersRef = collection(db, 'users');
     const q = query(usersRef, where('venture', '==', userData.venture));
     
     const unsubscribe = onSnapshot(q, (snapshot) => {
        const workerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkers(workerList);
     });

     return () => unsubscribe();
  }, [userData?.venture]);

  if (authLoading) return <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">Loading...</div>;
  if (!userData) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">User data not found</div>;

  if (userData.role !== 'Sub-Admin') {
     return <Navigate to="/home" replace />;
  }

  const activeWorkers = workers.filter(w => w.status === 'active');
  const pendingWorkers = workers.filter(w => w.status === 'pending');

  const handleApproveWorker = async (workerId: string, role: string) => {
     if (!role) return toast.error('Please select a role to approve.');
     try {
        await updateDoc(doc(db, 'users', workerId), {
           status: 'active',
           role: role,
           approvedBy: currentUser?.uid,
           approvedAt: new Date()
        });
        toast.success('Worker approved & activated!');
     } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'users');
     }
  };

  const handleRejectWorker = async (workerId: string) => {
     try {
        await updateDoc(doc(db, 'users', workerId), {
           status: 'rejected'
        });
        toast.success('Worker application rejected.');
     } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'users');
     }
  };

  const tabs = [
    { id: 'workers', label: 'Workers', icon: Users },
    { id: 'pending', label: 'Pending Approval', icon: FileCheck },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const renderTabContent = () => {
     switch (activeTab) {
        case 'workers':
           return (
              <div className="space-y-6">
                 <div className="flex justify-between items-center bg-[#111111] p-4 rounded-2xl border border-[#2A2A2A]">
                    <div>
                       <h2 className="text-xl font-black text-white uppercase tracking-tight">Workers</h2>
                       <p className="text-xs text-gray-400 font-medium">Managing {activeWorkers.length} active workers</p>
                    </div>
                    <button onClick={() => setIsAddWorkerOpen(true)} className="bg-[#F59E0B] text-black text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#F59E0B]/90 transition shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                       + Add Worker
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeWorkers.map(worker => (
                       <div key={worker.id} className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-4 flex flex-col">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-12 h-12 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] flex items-center justify-center font-bold text-[#F59E0B]">
                                {worker.name?.charAt(0) || 'W'}
                             </div>
                             <div className="flex flex-col">
                                <span className="font-bold text-white leading-tight">{worker.name}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{worker.phone}</span>
                             </div>
                             <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-[#10B981]/20 text-[#10B981] px-2 py-1 rounded">Active</span>
                          </div>
                          
                          <div className="bg-[#1A1A1A] rounded-xl p-3 mb-4 flex justify-between items-center border border-[#2A2A2A]">
                             <div className="flex flex-col">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Role</span>
                                <span className="text-sm font-bold text-white">{worker.role || 'Unassigned'}</span>
                             </div>
                             <div className="flex flex-col text-right">
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Earned</span>
                                <span className="text-sm font-bold text-[#E8B84B]">Rs.{worker.wallets?.earned || 0}</span>
                             </div>
                          </div>

                          <div className="flex gap-2 mt-auto pt-2 border-t border-[#2A2A2A]">
                             <button className="flex-1 text-[10px] bg-[#1A1A1A] font-bold text-gray-400 uppercase py-2 rounded-lg hover:text-white transition">Edit Role</button>
                             <button className="flex-1 text-[10px] bg-[#1A1A1A] font-bold text-red-500 uppercase py-2 rounded-lg hover:bg-red-500/10 transition">Suspend</button>
                             <button className="flex-1 text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] font-bold uppercase py-2 rounded-lg hover:bg-[#F59E0B]/30 transition">Details</button>
                          </div>
                       </div>
                    ))}
                    {activeWorkers.length === 0 && (
                       <div className="col-span-full py-12 text-center text-gray-500">No active workers found.</div>
                    )}
                 </div>
              </div>
           );
        case 'pending':
           return (
              <div className="space-y-6">
                 <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
                    <h3 className="text-blue-400 font-bold mb-1">Pending Workers</h3>
                    <p className="text-sm text-gray-300">Workers who signed up for {userData.venture} are listed here. Review and assign their role to activate their account.</p>
                 </div>

                 {pendingWorkers.length === 0 ? (
                    <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                       <CheckCircle size={48} className="text-[#10B981] mb-4 opacity-50" />
                       <p className="text-white font-bold text-lg">No pending approvals!</p>
                       <p className="text-sm text-gray-400 mt-1">All worker signups have been reviewed.</p>
                    </div>
                 ) : (
                    <div className="grid gap-4">
                       {pendingWorkers.map(worker => (
                          <PendingWorkerCard 
                             key={worker.id} 
                             worker={worker} 
                             venture={userData.venture}
                             onApprove={(role) => handleApproveWorker(worker.id, role)}
                             onReject={() => handleRejectWorker(worker.id)}
                          />
                       ))}
                    </div>
                 )}
              </div>
           );
        case 'tasks':
           return <SubAdminTasks venture={userData.venture || ''} subAdminId={currentUser?.uid || ''} />;
        case 'withdrawals':
           return <SubAdminWithdrawals venture={userData.venture || ''} subAdminId={currentUser?.uid || ''} />;
        case 'coupons':
           return <SubAdminCoupons venture={userData.venture || ''} subAdminId={currentUser?.uid || ''} />;
        case 'analytics':
           return <SubAdminAnalytics venture={userData.venture || ''} />;
        default:
           return <div className="p-4 text-gray-400">Select a tab.</div>;
     }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 md:pb-0 font-sans text-white md:flex">
      
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-[#111111] border-b border-[#2A2A2A] px-4 py-3 flex flex-col justify-center">
         <div className="flex items-center gap-3">
             <Logo variant="primary" size="sm" />
             <div className="w-[1px] h-6 bg-[#2A2A2A]"></div>
             <div className="flex flex-col">
                <span className="text-white font-bold text-sm tracking-tight">{userData.venture} Admin Panel</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Managing workers</span>
             </div>
         </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#111111] border-r border-[#2A2A2A] h-screen sticky top-0 flex-col shrink-0">
          <div className="p-6 border-b border-[#2A2A2A]">
             <Logo variant="primary" size="md" />
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{userData.venture} Admin Panel</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
             {tabs.map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                      activeTab === tab.id 
                         ? 'bg-[#F59E0B]/10 text-[#F59E0B]' 
                         : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                   }`}
                >
                   <tab.icon size={18} />
                   {tab.label}
                </button>
             ))}
          </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col h-screen overflow-hidden">
         {/* Mobile Tabs */}
         <div className="md:hidden bg-[#111111] border-b border-[#2A2A2A] sticky top-[60px] z-30">
            <div className="flex overflow-x-auto scrollbar-hide px-2">
               {tabs.map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`flex-shrink-0 px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-[#F59E0B] text-[#F59E0B]'
                        : 'border-transparent text-gray-500'
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>
         </div>

         <div className="flex-1 overflow-y-auto w-full p-4 md:p-8">
            {renderTabContent()}
         </div>
         
         <AddWorkerModal 
            isOpen={isAddWorkerOpen} 
            onClose={() => setIsAddWorkerOpen(false)} 
            subAdminVenture={userData.venture || ''} 
            subAdminId={currentUser?.uid || ''} 
         />
      </main>

      <style>{`
         .scrollbar-hide::-webkit-scrollbar { display: none; }
         .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
