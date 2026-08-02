import React from 'react';
import logoSrc from '../logo.jpeg.jpeg';

export default function LogoMark({ className = 'h-10 w-auto', centered = false }) {
  return (
    <img
      src={logoSrc}
      alt="CareLedger AI logo"
      className={`${className} ${centered ? 'mx-auto' : ''} object-contain`}
    />
  );
}
