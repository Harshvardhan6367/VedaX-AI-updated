import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- BUTTONS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
    isLoading?: boolean;
    icon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    icon: Icon,
    className = '',
    ...props
}) => {
    const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden group";

    const variants = {
        primary: "btn-primary hover:shadow-blue-500/40",
        secondary: "btn-secondary",
        ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400",
        danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25",
        glass: "glass hover:bg-white/30 dark:hover:bg-slate-800/50 text-gray-900 dark:text-white"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></span>
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : Icon && <Icon size={18} className="transition-transform group-hover:scale-110" />}
            {children}
        </button>
    );
};

// --- CARDS ---
export const Card: React.FC<{ children: React.ReactNode; className?: string; glass?: boolean }> = ({
    children,
    className = '',
    glass = true
}) => {
    return (
        <div className={`${glass ? 'glass-card' : 'bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800'} ${className}`}>
            {children}
        </div>
    );
};

// --- BADGES ---
export const Badge: React.FC<{ children: React.ReactNode; variant?: 'success' | 'warning' | 'error' | 'info'; className?: string }> = ({
    children,
    variant = 'info',
    className = ''
}) => {
    const variants = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
        error: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50",
        info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50"
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// --- INPUTS ---
export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }> = ({
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className="relative group">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <input
                className={`w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl py-3 ${Icon ? 'pl-12' : 'px-4'} pr-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm ${className}`}
                {...props}
            />
        </div>
    );
};
// --- SKELETON LOADERS ---
export const Skeleton: React.FC<{ className?: string; variant?: 'box' | 'circle' | 'text' }> = ({
    className = '',
    variant = 'box'
}) => {
    const variants = {
        box: "rounded-2xl",
        circle: "rounded-full",
        text: "rounded-lg h-4 w-3/4"
    };

    return (
        <div className={`bg-slate-200 dark:bg-slate-800 animate-pulse ${variants[variant]} ${className}`}></div>
    );
};
