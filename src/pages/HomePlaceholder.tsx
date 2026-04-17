import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function HomePlaceholder() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8B84B] to-[#d4a63f] flex items-center justify-center shadow-[0_0_20px_rgba(232,184,75,0.3)] overflow-hidden p-1">
          <img src="https://gcdnb.pbrd.co/images/-QD5NsLGLsZD.png" alt="WorkPlex Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-3xl font-bold text-[#E8B84B]">Home Dashboard (Phase 2)</h1>
      </div>
      <pre className="bg-[#111111] p-4 rounded-lg overflow-auto mb-4">
        {JSON.stringify(userData, null, 2)}
      </pre>
      <button 
        onClick={async () => {
          await logout();
          navigate('/');
        }}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
