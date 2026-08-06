'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-sm",
      secondary: "bg-[var(--color-brand-50)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-100)]",
      outline: "border border-[var(--color-app-border)] bg-transparent hover:bg-gray-50 text-[var(--color-app-text)]",
      ghost: "bg-transparent hover:bg-gray-100 text-[var(--color-app-text)]",
      danger: "bg-[var(--color-status-danger)] text-white hover:bg-red-600 shadow-sm",
    };

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
