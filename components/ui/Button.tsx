
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger';
  isLoading?: boolean;
  icon?: React.ElementType;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit" | "reset";
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon: Icon,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "relative overflow-hidden px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 border border-white/10 hover:shadow-indigo-500/50",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600",
    glass: "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-md",
    danger: "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30 border border-white/10"
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {isLoading ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          {children}
          {Icon && <Icon size={20} />}
        </>
      )}
    </motion.button>
  );
};
