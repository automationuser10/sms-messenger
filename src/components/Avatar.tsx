import React from 'react';
import { getInitials } from '../utils/formatters';

interface AvatarProps {
  name: string;
  phone: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, phone, size = 'md', className = '' }) => {
  const initials = getInitials(name, phone);
  
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
      text-white font-semibold
      ${className}
    `}>
      {initials}
    </div>
  );
};

export default Avatar;