import React from 'react';

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-[0.98]',
  secondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 active:scale-[0.98]',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.98]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
