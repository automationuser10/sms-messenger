import React from 'react';
import { ConversationFilter } from '../types';

interface FilterTabsProps {
  filters: ConversationFilter[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ 
  filters, 
  activeFilter, 
  onFilterChange, 
  className = '' 
}) => {
  return (
    <div className={`flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.type}
          onClick={() => onFilterChange(filter.type)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${activeFilter === filter.type 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default FilterTabs;