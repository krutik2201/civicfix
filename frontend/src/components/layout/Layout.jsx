import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../shared/Header'; // Adjusted path
import Footer from '../shared/Footer'; // Adjusted path

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;