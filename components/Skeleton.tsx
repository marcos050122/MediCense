import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
    const variantClasses = {
        text: 'h-4 w-full rounded',
        rect: 'h-24 w-full rounded-2xl',
        circle: 'h-12 w-12 rounded-full',
    };

    return (
        <div
            className={`bg-slate-200 animate-pulse ${variantClasses[variant]} ${className}`}
            aria-hidden="true"
        />
    );
};

export default Skeleton;
