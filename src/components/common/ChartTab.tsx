import React, { useState } from "react";

interface ChartTabProps {
  activeTab: 'sales' | 'revenue';
  onTabChange: (tab: 'sales' | 'revenue') => void;
}

export default function ChartTab({ activeTab, onTabChange }: ChartTabProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onTabChange('sales')}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          activeTab === 'sales'
            ? 'bg-primary text-white'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        Sales
      </button>
      <button
        onClick={() => onTabChange('revenue')}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          activeTab === 'revenue'
            ? 'bg-primary text-white'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
      >
        Revenue
      </button>
    </div>
  );
}
