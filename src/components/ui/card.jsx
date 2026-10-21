import React from 'react';

export const Card = React.forwardRef(({ className = '', children, ...props }, ref) => {
  const hasCustomRounding = className.includes('rounded-');
  return (
    <div
      ref={ref}
      className={`${hasCustomRounding ? '' : 'rounded-xl'} border border-gray-200 bg-white text-gray-950 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

export const CardContent = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={`p-6 ${className}`} {...props}>
    {children}
  </div>
));
CardContent.displayName = 'CardContent';
