'use client';

import React from 'react';
import { useTradingStore } from '../../store/tradingStore';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { connectionStatus, lastUpdate } = useTradingStore();

  return (
    <header className="flex-shrink-0">
      <button 
        onClick={onMenuClick}
        className="lg:hidden p-2"
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Trading Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${connectionStatus.spot ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">Spot</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${connectionStatus.futures ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">Futures</span>
          </div>
          
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          
          <button className="rounded-full bg-gray-100 p-2">
            <span className="sr-only">User menu</span>
            <div className="h-8 w-8 rounded-full bg-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};