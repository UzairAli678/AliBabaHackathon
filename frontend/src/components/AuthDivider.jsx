import React from 'react';

export default function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted">or continue with</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
