import React from 'react';

interface AvatarProps {
  leadNumber: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ leadNumber, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div className={`
      ${sizeClasses[size]} 
      rounded-full 
      bg-gradient-to-br from-blue-500 to-purple-600 
      flex items-center justify-center 
      text-white font-bold
      ${className}
    `}>
      {leadNumber}
    </div>
  );
};

export default Avatar;