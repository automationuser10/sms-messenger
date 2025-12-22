import React from 'react';
import { Message } from '../types';
import { formatTimestampDetailed } from '../utils/formatters';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  className?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, className = '' }) => {
  const isOutgoing = message.direction === 'Outgoing';

  const getStatusIcon = () => {
    if (!isOutgoing || !message.status) return null;

    switch (message.status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };
  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOutgoing ? 'ml-auto' : 'mr-auto'}`}>
        <div
          className={`
            px-4 py-2 rounded-lg shadow-sm
            ${isOutgoing 
              ? `bg-blue-500 text-white ${message.status === 'failed' ? 'bg-red-500' : ''}` 
              : 'bg-gray-100 text-gray-900'
            }
          `}
        >
          <p className="text-sm">{message.body}</p>
        </div>
        <div className={`flex items-center gap-1 text-xs text-gray-500 mt-1 ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
          <span>{formatTimestampDetailed(message.timestamp)}</span>
          {getStatusIcon()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;