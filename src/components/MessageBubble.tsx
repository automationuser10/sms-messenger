import React from 'react';
import { Message } from '../types';
import { formatHongKongTime, formatSriLankanTime } from '../utils/formatters';
import { Check, CheckCheck, AlertCircle, Clock } from 'lucide-react';

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
        
        {/* Timestamp with timezone info */}
        <div className={`mt-1 space-y-0.5 ${isOutgoing ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="font-medium">HK:</span>
            <span>{formatHongKongTime(message.timestamp)}</span>
            {isOutgoing && getStatusIcon()}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span className="font-medium">LK:</span>
            <span>{formatSriLankanTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;