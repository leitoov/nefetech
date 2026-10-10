import React from 'react';

export function Icon({ name, className = '', filled = false, size }) {
  const style = {
    fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
    fontSize: size ? (typeof size === 'number' ? `${size}px` : size) : undefined,
  };

  return (
    <span
      className={`material-symbols-outlined select-none inline-flex items-center justify-center leading-none align-middle ${className}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
