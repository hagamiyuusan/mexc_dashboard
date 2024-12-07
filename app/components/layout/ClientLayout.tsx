"use client";
import { useState } from "react";
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body className="h-screen flex">
        {/* Overlay - Lower z-index */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 lg:hidden z-20" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
  
        {/* Sidebar - Higher z-index */}
        <div className={`
          w-64 bg-gray-800 h-screen fixed
          transform transition-transform duration-200 ease-in-out z-30
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative
        `}>
          <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
        </div>
  
        <div className="flex-1 lg:ml-64">
          <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}