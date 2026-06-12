import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: 'blue' | 'purple' | 'pink' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function NeonButton({ children, variant = 'blue', size = 'md', className, ...props }: NeonButtonProps) {
  const baseStyles = "relative font-display font-bold uppercase tracking-wider overflow-hidden group transition-all duration-300 rounded-sm";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
    xl: "px-12 py-5 text-xl"
  };
  
  const variantStyles = {
    blue: "bg-cyan-900/40 text-cyan-50 border border-cyan-400 hover:bg-cyan-500 hover:text-black shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.8)]",
    purple: "bg-fuchsia-900/40 text-fuchsia-50 border border-fuchsia-400 hover:bg-fuchsia-500 hover:text-black shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:shadow-[0_0_30px_rgba(217,70,239,0.8)]",
    pink: "bg-rose-900/40 text-rose-50 border border-rose-400 hover:bg-rose-500 hover:text-black shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.8)]",
    ghost: "bg-transparent text-white/70 border border-white/20 hover:border-white/60 hover:text-white"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      {variant !== 'ghost' && (
        <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0" />
      )}
    </motion.button>
  );
}
