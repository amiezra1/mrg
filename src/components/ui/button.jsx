import React from 'react';
import './styles.css';

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