import React from 'react';

export function Input({ value, onChange, placeholder, className = '', onKeyDown }: any) {
  return (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`w-full px-4 py-2 rounded-md bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}
