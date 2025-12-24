import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { formatPhoneNumber } from '../utils/formatters';
import { ApiService } from '../utils/api';
import { ArrowLeft, Phone, MoreVertical, RefreshCw } from 'lucide-react';

interface ChatViewProps {
  selectedPhone: string | null;
  contactName: string;
  onBack?: () => void;
  onMessageSent?: () => void;
  className?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  selectedPhone, 
  contactName, 
  onBack,
  onMessageSent,
  className = '' 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [leadNumber, setLeadNumber] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessageCount = useRef(0);

  // Calculate lead number based on all conversations
  useEffect(() => {
    const calculateLeadNumber = async () => {
      if (!selectedPhone) return;
      
      const apiService = ApiService.getInstance();
      const result = await apiService.fetchConversations();
      
      if (!result.error && result.data.length > 0) {
        // Sort by timestamp (oldest first) to assign numbers in order of first contact
        const sortedByFirstContact = [...result.data].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        const index = sortedByFirstContact.findIndex(c => c.phone === selectedPhone);
        if (index !== -1) {
          setLeadNumber(index + 1);
        }
      }
    };
    
    calculateLeadNumber();
  }, [selectedPhone]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedPhone) {
      loadMessages();
    }
  }, [selectedPhone]);

  // Handle new messages from API polling
  useEffect(() => {
    if (!selectedPhone) return;

    const apiService = ApiService.getInstance();
    
    const handleNewMessages = (newMessages: Message[]) => {
      // Filter messages for current conversation
      const relevantMessages = newMessages.filter(msg => msg.conversationId === selectedPhone);
      
      if (relevantMessages.length > 0) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const trulyNewMessages = relevantMessages.filter(m => m.id && !existingIds.has(m.id));
          
          if (trulyNewMessages.length > 0) {
            const updated = [...prev, ...trulyNewMessages]
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            // Show new message indicator
            setNewMessageCount(trulyNewMessages.length);
            setTimeout(() => setNewMessageCount(0), 3000);
            
            return updated;
          }
          
          return prev;
        });
      }
    };

    // Set up callback for this conversation
    apiService.setNewMessageCallback(handleNewMessages);

    return () => {
      // Clean up callback when conversation changes
      apiService.setNewMessageCallback(() => {});
    };
  }, [selectedPhone]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > previousMessageCount.current) {
      scrollToBottom();
    }
    previousMessageCount.current = messages.length;
  }, [messages]);

  const loadMessages = async () => {
    if (!selectedPhone) return;

    setLoading(true);
    setError(null);

    try {
      const apiService = ApiService.getInstance();
      const result = await apiService.fetchMessages(selectedPhone);
      
      if (result.error) {
        setError(result.error);
        setMessages([]);
      } else {
        setMessages(result.data);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (messageBody: string) => {
    if (!selectedPhone || sending) return;

    setSending(true);
    setError(null);

    try {
      const apiService = ApiService.getInstance();
      const result = await apiService.sendMessage(selectedPhone, messageBody);
      
      if (result.error) {
        setError('Failed to send message. Please try again.');
      } else {
        // Reload messages to show the sent message immediately
        await loadMessages();
        
        // Notify parent to refresh conversation list
        onMessageSent?.();
        
        scrollToBottom();
      }
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    loadMessages();
  };

  if (!selectedPhone) {
    return (
      <div className={`${className} flex items-center justify-center h-full bg-gray-50`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Phone className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
          <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} h-full flex flex-col`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {/* Numbered Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {leadNumber || '?'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Lead #{leadNumber || '...'}
            </h2>
            <p className="text-sm text-gray-600">{formatPhoneNumber(selectedPhone)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh messages"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* New message indicator */}
      {newMessageCount > 0 && (
        <div className="bg-green-100 border-b border-green-200 p-2 text-center">
          <p className="text-sm text-green-800">
            {newMessageCount} new message{newMessageCount > 1 ? 's' : ''} received
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-gray-500">Loading messages...</div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Start the conversation below!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        disabled={sending}
      />
    </div>
  );
};

export default ChatView;