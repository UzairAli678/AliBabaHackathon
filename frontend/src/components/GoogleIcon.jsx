import React from 'react';

export default function GoogleIcon({ className = 'h-5 w-5' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" role="img">
        <path fill="#EA4335" d="M21.35 11.1H12v3.9h5.35c-.8 2.35-2.95 4.02-5.35 4.02a6.95 6.95 0 1 1 0-13.9c1.43 0 2.75.5 3.78 1.34l2.82-2.82A10.5 10.5 0 1 0 12 22c5.52 0 10-4.48 10-10 0-.3-.02-.6-.05-.9Z" />
        <path fill="#4285F4" d="M21.35 11.1H12v3.9h5.35c-.8 2.35-2.95 4.02-5.35 4.02a6.95 6.95 0 0 1-6.6-4.76L2.01 17.7A10.99 10.99 0 0 0 12 22c5.52 0 10-4.48 10-10 0-.3-.02-.6-.05-.9h-.6Z" opacity="0.001" />
        <path fill="#FBBC05" d="M4.44 14.26a6.93 6.93 0 0 1 0-4.52L1.48 7.46a10.99 10.99 0 0 0 0 9.08l2.96-2.28Z" />
        <path fill="#34A853" d="M12 5.1a6.9 6.9 0 0 1 4.88 1.91l3.65-3.65A10.93 10.93 0 0 0 12 1C7.98 1 4.49 3.15 2.01 6.2l2.43 2.98A6.94 6.94 0 0 1 12 5.1Z" />
      </svg>
      <span className="text-sm font-medium text-heading">Google</span>
    </span>
  );
}
