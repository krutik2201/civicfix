import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiLogOut, FiShield } from 'react-icons/fi';
import Footer from '../shared/Footer'; // Adjusted path

const AdminLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg font-sans">
      <nav className="bg-brand-primary text-white shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm"><FiShield size={20} className="text-white" /></div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">City Admin</h1>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Control Center</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold border border-white/10 transition-all active:scale-95 shadow-sm">
              Secure Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default AdminLayout;