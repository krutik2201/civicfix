import React from 'react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2.5 font-black text-2xl tracking-tight text-brand-primary">
          <div className="bg-brand-primary p-2 rounded-xl text-white shadow-md flex items-center justify-center">
            <img src="/logo.png" alt="CivicFix Logo" className="h-6 w-6 invert" />
          </div>
          CivicFix
        </div>
      </div>
    </header>
  );
};

export default Header;