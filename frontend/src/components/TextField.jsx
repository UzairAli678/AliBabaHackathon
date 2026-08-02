import React from 'react';

export default function TextField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-heading">{label}</span>
      <input
        {...props}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-heading outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10 ${
          error ? 'border-critical' : 'border-border'
        }`}
      />
      {error ? <span className="mt-2 block text-sm text-critical">{error}</span> : null}
    </label>
  );
}
