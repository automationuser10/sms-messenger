import React, { useState, useEffect } from 'react';
import { Contact, Message } from '../types';
import { ApiService } from '../utils/api';
import { Search, RefreshCw, MessageCircle, Clock } from 'lucide-react';

interface ConversationListProps {
  selectedPhone: string | null;
  onSelectConversation: (phone: string, contact?: Contact) => void;
  onNewMessage: (phone: string, contact: Contact) => void;
  className?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({
  selectedPhone,
  onSelectConversation,
  onNewMessage,
  className = ''
}) => {
  const [conversations, setConversations] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const apiService = ApiService.getInstance();

  // Load conversations
  const loadConversations = async () => {
    console.log('🔄 LOADING CONVERSATIONS: Starting...');
    try {
      const result = await apiService.fetchConversations();
      
      if (result.error) {
        console.error('❌ CONVERSATION LOAD ERROR:', result.error);
        setError(result.error);
        setConversations([]);
      } else {
        console.log('✅ CONVERSATIONS LOADED:', result.data.length, 'conversations');
        console.log('📋 CONVERSATION DATA:', JSON.stringify(result.data, null, 2));
        setConversations(result.data);
        setError(null);
      }
    } catch (err) {
      console.error('❌ CONVERSATION LOAD EXCEPTION:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(errorMessage);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    console.log('🔄 MANUAL REFRESH: Starting...');
    setRefreshing(true);
    setError(null);
    
    try {
      // Force a fresh poll of messages from the API
      console.log('🔄 MANUAL REFRESH: Calling pollMessages()...');
      await apiService.pollMessages();
      
      // Wait a moment for the polling to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then reload conversations
      console.log('🔄 MANUAL REFRESH: Reloading conversations...');
      await loadConversations();
      
      console.log('✅ MANUAL REFRESH: Complete');
    } catch (err) {
      console.error('❌ MANUAL REFRESH ERROR:', err);
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle new messages
  const handleNewMessages = (newMessages: Message[]) => {
    console.log('🆕 NEW MESSAGES RECEIVED:', newMessages.length, 'messages');
    console.log('📋 NEW MESSAGE DATA:', JSON.stringify(newMessages, null, 2));
    
    // Reload conversations to reflect new messages
    loadConversations();
    
    // Notify parent component about new messages
    newMessages.forEach(message => {
      const contact: Contact = {
        phone: message.conversationId,
        name: apiService.formatPhoneNumber(message.conversationId),
        lastMessage: message.body,
        timestamp: message.timestamp,
        unread: message.direction === 'Incoming'
      };
      onNewMessage(message.conversationId, contact);
    });
  };

  // Handle API errors
  const handleApiError = (errorMessage: string) => {
    console.error('🚨 API ERROR RECEIVED:', errorMessage);
    setError(errorMessage);
  };

  // Initialize component
  useEffect(() => {
    console.log('🚀 CONVERSATION LIST: Initializing...');
    
    // Set up API callbacks
    apiService.setNewMessageCallback(handleNewMessages);
    apiService.setErrorCallback(handleApiError);
    
    // Start polling
    apiService.startPolling();
    
    // Load initial conversations
    loadConversations();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 CONVERSATION LIST: Cleaning up...');
      apiService.stopPolling();
    };
  }, []);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.phone.toLowerCase().includes(searchLower) ||
      contact.lastMessage.toLowerCase().includes(searchLower)
    );
  });

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
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh conversations"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 font-medium">Connection Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs text-red-700 underline hover:text-red-900 mt-1 disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2 text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading conversations...</span>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <MessageCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">
              {searchTerm ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline disabled:opacity-50"
              >
                {refreshing ? 'Refreshing...' : 'Refresh to check for messages'}
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((contact) => (
              <div
                key={contact.phone}
                onClick={() => onSelectConversation(contact.phone, contact)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedPhone === contact.phone ? 'bg-blue-50 border-r-2 border-blue-500' : ''
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;