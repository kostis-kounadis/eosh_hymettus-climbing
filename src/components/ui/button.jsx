import React from 'react';

export const Button = React.forwardRef(
  ({ className = '', variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[#1e3a8a] text-white hover:bg-[#1e40af] shadow-sm',
      outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700',
      ghost: 'hover:bg-gray-100 text-gray-700',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    };
    const sizes = {
      default: 'h-9 px-4 py-2 text-sm',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-10 rounded-md px-6 text-base',
      icon: 'h-9 w-9',
    };
    const cls = `inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a8a] disabled:pointer-events-none disabled:opacity-50 ${variants[variant] || variants.default} ${sizes[size] || sizes.default} ${className}`;

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: `${cls} ${children.props.className || ''}`,
        ref,
        ...props,
      });
    }

    return (
      <button ref={ref} className={cls} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
