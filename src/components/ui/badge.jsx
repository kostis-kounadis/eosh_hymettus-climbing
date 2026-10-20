import React from 'react';

export const Badge = React.forwardRef(({ className = '', variant = 'default', children, ...props }, ref) => {
  const hasCustomBg = /\bbg-/.test(className);
  const hasCustomText = /\btext-(?!xs|sm|base|lg|xl|2xl|left|center|right)/.test(className);
  const hasCustomBorder = /\bborder-/.test(className);

  const variants = {
    default: `${hasCustomBorder ? '' : 'border-transparent'} ${hasCustomBg ? '' : 'bg-[#1e3a8a]'} ${hasCustomText ? '' : 'text-white'}`,
    secondary: `${hasCustomBorder ? '' : 'border-transparent'} ${hasCustomBg ? '' : 'bg-gray-100'} ${hasCustomText ? '' : 'text-gray-900'}`,
    outline: `${hasCustomBorder ? '' : 'border-gray-200'} ${hasCustomBg ? '' : 'bg-transparent'} ${hasCustomText ? '' : 'text-gray-700'}`,
  };

  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});
Badge.displayName = 'Badge';
