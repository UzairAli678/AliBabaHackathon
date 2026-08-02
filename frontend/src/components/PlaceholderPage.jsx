import React from 'react';

export default function PlaceholderPage({ title }) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-full bg-tealSoft px-4 py-2 text-sm font-medium text-primary">Coming next</div>
      <h1 className="mt-6 text-4xl font-medium tracking-tight text-heading">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
        This page is protected and ready for the next build phase, kept consistent with the premium CareLedger AI visual language.
      </p>
    </main>
  );
}
