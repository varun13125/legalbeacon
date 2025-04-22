import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-gray-800 p-4 rounded-xl shadow-md ${className}`}>
      {children}
    </div>
  );
}
