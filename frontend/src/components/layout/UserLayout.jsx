import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import Footer from '../shared/Footer';

const UserLayout = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg font-sans text-brand-primary">
      <nav className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="bg-brand-primary p-2.5 rounded-xl text-white shadow-md flex items-center justify-center">
                <img src="/logo.png" alt="CivicFix Logo" className="h-6 w-6 invert" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-brand-primary leading-tight">CivicFix</h1>
                <p className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-widest">Citizen Portal</p>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <span className="text-sm font-bold text-gray-500">{user.email}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm">
                <FiLogOut /> Logout
              </button>
            </div>

            {/* Mobile Toggle */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-brand-primary hover:bg-gray-100 rounded-lg transition-colors">
              {isMenuOpen ? <FiX size={26} /> : <FiMenu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Simplified) */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute top-full left-0 w-full animate-fadeIn z-40">
            <div className="p-4">
              {/* Only the Logout Button now - Cleaner! */}
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2 w-full py-4 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                <FiLogOut size={18} /> Secure Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default UserLayout;