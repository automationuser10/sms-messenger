import React from 'react';
import { Contact } from '../types';
import { Clock } from 'lucide-react';

interface ConversationItemProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  contact,
  isSelected,
  onClick
}) => {
  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        return `${Math.floor(diffHours)}h ago`;
      } else if (diffDays < 7) {
        return `${Math.floor(diffDays)}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.warn('Failed to format timestamp:', timestamp);
      return 'Unknown';
    }
  };

  // Truncate message for preview
  const truncateMessage = (message: string, maxLength: number = 50): string => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {contact.name ? contact.name.charAt(0).toUpperCase() : contact.phone.slice(-2)}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {contact.name || contact.phone}
            </h3>
            <div className="flex items-center space-x-1">
              {contact.unread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimestamp(contact.timestamp)}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-600 truncate mt-1">
            {truncateMessage(contact.lastMessage)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;