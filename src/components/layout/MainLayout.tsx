import React from 'react';

export default function MainLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
      </header>
      <main>{children}</main>
    </div>
  );
}
