import React, { useState, useEffect, useRef } from 'react';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import ConversationList from './components/ConversationList';
import ChatView from './components/ChatView';
import Settings from './components/Settings';
import { Contact } from './types';
import { Menu } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeView, setActiveView] = useState<'conversations' | 'settings'>('conversations');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const conversationListRef = useRef<{ refreshConversations: () => void } | null>(null);

  // Check authentication status on app load
  useEffect(() => {
    const authStatus = localStorage.getItem('sms-app-authenticated');
    setIsAuthenticated(authStatus === 'true');
  }, []);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('sms-app-authenticated');
    setIsAuthenticated(false);
    // Reset app state
    setActiveView('conversations');
    setSelectedPhone(null);
    setSelectedContact(null);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (phone: string, contact?: Contact) => {
    setSelectedPhone(phone);
    setSelectedContact(contact || null);
    
    // Close sidebar on mobile when selecting a conversation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleNewMessage = (phone: string, contact: Contact) => {
    // If this conversation is currently selected, the ChatView will handle the update
    // Otherwise, just update the conversation list (which is handled automatically by polling)
    console.log('New message received for:', phone);
  };

  const handleBackToList = () => {
    setSelectedPhone(null);
    setSelectedContact(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleViewChange = (view: 'conversations' | 'settings') => {
    setActiveView(view);
    if (view === 'settings') {
      setSelectedPhone(null);
      setSelectedContact(null);
    }
  };

  const handleMessageSent = () => {
    // Trigger conversation list refresh when a message is sent
    console.log('📤 MESSAGE SENT: Refreshing conversation list');
    // The ConversationList component will handle the refresh through its polling mechanism
    // We just need to ensure it re-renders with the latest data
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between md:hidden">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {activeView === 'conversations' ? 'Conversations' : 'Settings'}
            </h1>
            <div className="w-9" /> {/* Spacer for centering */}
          </div>
        )}

        {activeView === 'conversations' ? (
          <>
            {/* Conversation List */}
            <div className={`
              ${isMobile && selectedPhone ? 'hidden' : 'block'}
              ${isMobile ? 'w-full' : 'w-80'}
              bg-white border-r border-gray-200 h-full
            `}>
              <ConversationList
                selectedPhone={selectedPhone}
                onSelectConversation={handleSelectConversation}
                onNewMessage={handleNewMessage}
                className="h-full"
              />
            </div>

            {/* Chat View */}
            <div className={`
              ${isMobile && !selectedPhone ? 'hidden' : 'block'}
              flex-1 h-full
            `}>
              <ChatView
                selectedPhone={selectedPhone}
                contactName={selectedContact?.name || ''}
                onBack={isMobile ? handleBackToList : undefined}
                onMessageSent={handleMessageSent}
                className="h-full"
              />
            </div>
          </>
        ) : (
          /* Settings View */
          <div className="flex-1 h-full">
            <Settings className="h-full" />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;