import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { safeStringify } from '../utils/jsonUtils';
import { Logo } from '../components/ui/Logo';

export default function HomePlaceholder() {
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
      <div className="flex items-center gap-4 mb-8">
        <Logo variant="primary" size="md" />
        <h1 className="text-xl font-bold text-[#E8B84B]">Home Dashboard Phase 2</h1>
      </div>
      <pre className="bg-[#111111] p-4 rounded-lg overflow-auto mb-4">
        {safeStringify(userData, 2)}
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
