import React from 'react';
import LogoMark from './LogoMark';

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="min-h-[calc(100vh-0px)] bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <div className="rounded-[28px] border border-border bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-col items-center text-center">
            <LogoMark className="h-16 w-auto" centered />
            <h1 className="mt-6 text-3xl font-medium tracking-tight text-heading">{title}</h1>
            <p className="mt-3 text-sm leading-7 text-muted">{subtitle}</p>
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
