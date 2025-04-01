import React from 'react';
import './styles.css';

// קומפוננטת כפתור
export function Button({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) {
  const getButtonClass = () => {
    const baseClass = 'button';
    const variantClass = `button-${variant}`;
    const sizeClass = size !== 'md' ? `button-${size}` : '';

    return `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();
  };

  return (
    <button
      className={getButtonClass()}
      {...props}
    >
      {children}
    </button>
  );
}

// קומפוננטת אינפוט
export function Input({
  className = '',
  ...props
}) {
  return (
    <input
      {...props}
      className={`border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300 ${className}`}
    />
  );
}
