import { Contact, Message, ApiResponse } from '../types';

export interface ApiMessage {
  id: string;
  phoneNumber: number;
  direction: 'INBOUND' | 'OUTBOUND';
  lastMessage: string;
  lastMessageHK: string;
  lastMessageSL: string;
}

export class ApiService {
  private static instance: ApiService;
  private settings: {
    n8nWebhookUrl: string;
    n8nGetMessagesUrl: string;
    pollingInterval: number;
  };
  private processedMessageIds: Set<string> = new Set();
  private allMessages: Message[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private onNewMessageCallback: ((messages: Message[]) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  private constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('sms-app-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      this.settings = {
        n8nWebhookUrl: parsed.n8nWebhookUrl || 'https://cloud.automationhoster.org/webhook/send-sms',
        n8nGetMessagesUrl: parsed.n8nGetMessagesUrl || 'https://cloud.automationhoster.org/webhook/get-messages',
        pollingInterval: parsed.pollingInterval || 30
      };
    } else {
      this.settings = {
        n8nWebhookUrl: 'https://cloud.automationhoster.org/webhook/send-sms',
        n8nGetMessagesUrl: 'https://cloud.automationhoster.org/webhook/get-messages',
        pollingInterval: 30
      };
    }
    
    console.log('🚀 API SERVICE INITIALIZED with settings:', this.settings);
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  updateSettings(settings: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...settings };
    console.log('⚙️ SETTINGS UPDATED:', this.settings);
    this.restartPolling();
  }

  // Set callback for new messages
  setNewMessageCallback(callback: (messages: Message[]) => void) {
    this.onNewMessageCallback = callback;
    console.log('📞 NEW MESSAGE CALLBACK SET');
  }

  // Set callback for errors
  setErrorCallback(callback: (error: string) => void) {
    this.onErrorCallback = callback;
    console.log('📞 ERROR CALLBACK SET');
  }

  // Convert API message format to internal format
  private convertApiMessage(apiMessage: ApiMessage): Message {
    console.log('🔄 CONVERTING MESSAGE:', JSON.stringify(apiMessage, null, 2));
    
    // Convert direction from "INBOUND"/"OUTBOUND" to "Incoming"/"Outgoing"
    // INBOUND = message from lead (Incoming to us)
    // OUTBOUND = message from us (Outgoing to lead)
    const direction = apiMessage.direction === 'INBOUND' ? 'Incoming' : 'Outgoing';
    
    // Use phone number as conversation ID
    const conversationId = String(apiMessage.phoneNumber);
    
    const converted: Message = {
      conversationId: conversationId,
      timestamp: this.convertTimestamp(apiMessage.lastMessageHK), // Use HK timestamp as primary
      body: apiMessage.lastMessage,
      direction: direction,
      id: apiMessage.id,
      status: direction === 'Outgoing' ? 'delivered' : undefined
    };
    
    console.log('✅ CONVERTED TO:', JSON.stringify(converted, null, 2));
    return converted;
  }

  // Convert timestamp from API format to ISO format
  private convertTimestamp(timestamp: string): string {
    console.log('🕐 CONVERTING TIMESTAMP:', timestamp);
    
    try {
      // Handle MM/DD/YYYY, HH:MM:SS AM/PM format specifically
      if (timestamp.includes('/') && timestamp.includes(',')) {
        // Parse format like "12/22/2025, 2:45:11 PM"
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          const isoString = date.toISOString();
          console.log('✅ TIMESTAMP CONVERTED:', timestamp, '->', isoString);
          return isoString;
        }
      }
      
      // Try direct parsing
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        const isoString = date.toISOString();
        console.log('✅ TIMESTAMP CONVERTED:', timestamp, '->', isoString);
        return isoString;
      }
      
      // Fallback to current time
      console.warn('⚠️ TIMESTAMP FALLBACK: Could not parse', timestamp, 'using current time');
      return new Date().toISOString();
    } catch (error) {
      console.error('❌ TIMESTAMP ERROR:', error, 'for timestamp:', timestamp);
      return new Date().toISOString();
    }
  }

  // Fetch messages from API
  private async fetchMessagesFromApi(): Promise<ApiResponse<ApiMessage[]>> {
    console.log('🌐 FETCHING FROM API:', this.settings.n8nGetMessagesUrl);
    
    try {
      // Check if URL is configured
      if (!this.settings.n8nGetMessagesUrl || this.settings.n8nGetMessagesUrl.trim() === '') {
        throw new Error('n8n Get Messages URL not configured. Please check Settings.');
      }

      const response = await fetch(this.settings.n8nGetMessagesUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      console.log('📡 RESPONSE STATUS:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data = await response.json();
      console.log('📦 RAW API RESPONSE:', JSON.stringify(data, null, 2));
      
      // Handle API response format
      let messagesArray: ApiMessage[];
      if (Array.isArray(data)) {
        // Direct array response - validate message format
        messagesArray = data;
        console.log('✅ RESPONSE IS ARRAY with', messagesArray.length, 'items');
      } else {
        console.error('❌ API response is not an array:', data);
        return { 
          data: [], 
          error: 'API response must be an array of message objects. Please check your n8n webhook configuration.' 
        };
      }

      // Validate message format
      const validMessages = messagesArray.filter(msg => {
        const hasId = typeof msg.id === 'string';
        const hasPhone = typeof msg.phoneNumber === 'number' || typeof msg.phoneNumber === 'string';
        const hasDirection = msg.direction === 'INBOUND' || msg.direction === 'OUTBOUND';
        const hasMessage = typeof msg.lastMessage === 'string';
        const hasHKTime = typeof msg.lastMessageHK === 'string';
        const hasSLTime = typeof msg.lastMessageSL === 'string';
        
        const isValid = msg && 
          typeof msg === 'object' &&
          hasId &&
          hasPhone &&
          hasDirection &&
          hasMessage &&
          hasHKTime &&
          hasSLTime;
        
        if (!isValid) {
          console.warn('❌ INVALID MESSAGE FORMAT:', {
            message: msg,
            checks: { hasId, hasPhone, hasDirection, hasMessage, hasHKTime, hasSLTime }
          });
        }
        
        return isValid;
      });

      console.log(`✅ VALIDATED: ${validMessages.length} valid messages out of ${messagesArray.length} total`);

      if (validMessages.length !== messagesArray.length) {
        console.warn(`⚠️ Filtered out ${messagesArray.length - validMessages.length} invalid messages`);
      }

      return { data: validMessages };
    } catch (error) {
      console.error('❌ FETCH ERROR:', error);
      
      let errorMessage = 'Network connection failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - n8n endpoint took too long to respond';
        } else if (error.message.includes('NetworkError') || error.message.includes('ERR_NETWORK')) {
          errorMessage = 'Network error - cannot reach n8n endpoint. Please check your internet connection and n8n URL in Settings.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to n8n endpoint. Please check your internet connection and n8n URL in Settings.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
          errorMessage = 'n8n endpoint not found or refused connection. Please verify the URL in Settings and ensure n8n is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        data: [], 
        error: errorMessage
      };
    }
  }

  // Poll for new messages
  async pollMessages() {
    console.log('🔄 POLLING: Starting message poll from:', this.settings.n8nGetMessagesUrl);
    
    const result = await this.fetchMessagesFromApi();
    
    if (result.error) {
      console.error('❌ POLLING ERROR:', result.error);
      this.onErrorCallback?.(result.error);
      
      // Retry after 60 seconds on error to avoid spamming failed endpoint
      this.retryTimeout = setTimeout(() => {
        this.pollMessages();
      }, 60000);
      return;
    }

    console.log('✅ API RESPONSE: Received', result.data.length, 'messages from API');
    console.log('📋 RAW API DATA:', JSON.stringify(result.data, null, 2));

    // Convert API messages to internal format
    const newApiMessages = result.data;
    console.log('🔄 CONVERTING: Processing', newApiMessages.length, 'API messages');
    
    const convertedMessages = newApiMessages.map(msg => this.convertApiMessage(msg));
    console.log('✅ CONVERTED: Created', convertedMessages.length, 'internal messages');
    console.log('📋 CONVERTED DATA:', JSON.stringify(convertedMessages, null, 2));
    
    // Update all messages with current API data
    this.allMessages = convertedMessages
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    console.log('💾 STORED: Total messages in memory:', this.allMessages.length);
    console.log('📋 ALL MESSAGES:', JSON.stringify(this.allMessages, null, 2));
    
    // Find truly new messages (not processed before) 
    const newMessages = convertedMessages.filter(msg => {
      if (!msg.id) return false;
      
      const isNew = !this.processedMessageIds.has(msg.id);
      if (isNew) {
        this.processedMessageIds.add(msg.id);
      }
      return isNew;
    });

    if (newMessages.length > 0) {
      console.log('🆕 NEW MESSAGES: Found', newMessages.length, 'new messages');
      console.log('📋 NEW MESSAGE DATA:', JSON.stringify(newMessages, null, 2));
      // Notify about new messages
      this.onNewMessageCallback?.(newMessages);
    } else {
      console.log('ℹ️ NO NEW MESSAGES: All messages already processed');
      console.log('🔍 PROCESSED IDS:', Array.from(this.processedMessageIds));
    }
  }

  // Start polling
  startPolling() {
    console.log('▶️ STARTING POLLING with interval:', this.settings.pollingInterval, 'seconds');
    this.stopPolling();
    
    // Initial fetch
    this.pollMessages();
    
    // Set up interval
    this.pollingInterval = setInterval(() => {
      this.pollMessages();
    }, this.settings.pollingInterval * 1000);
    
    console.log('✅ POLLING STARTED');
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('⏸️ POLLING STOPPED');
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  // Restart polling with new settings
  private restartPolling() {
    if (this.pollingInterval) {
      console.log('🔄 RESTARTING POLLING');
      this.stopPolling();
      this.startPolling();
    }
  }

  // Get all messages
  getAllMessages(): Message[] {
    console.log('📨 GET ALL MESSAGES: Returning', this.allMessages.length, 'messages');
    return this.allMessages;
  }

  // Build conversations from all messages
  async fetchConversations(): Promise<ApiResponse<Contact[]>> {
    try {
      console.log('🏗️ BUILDING CONVERSATIONS: Starting with', this.allMessages.length, 'total messages');
      
      const messages = this.getAllMessages();
      console.log('📋 MESSAGES FOR CONVERSATIONS:', JSON.stringify(messages, null, 2));
      
      const conversationMap = new Map<string, Contact>();

      // Group messages by phone number (conversation ID) and find latest message
      messages.forEach(message => {
        const phone = message.conversationId;
        console.log('🔄 PROCESSING MESSAGE for phone:', phone, 'Message:', message.body);
        
        const existing = conversationMap.get(phone);
        console.log('📋 EXISTING CONVERSATION:', existing ? 'Found' : 'Not found');
        
        const messageTime = new Date(message.timestamp);
        const existingTime = existing ? new Date(existing.timestamp) : new Date(0);
        
        console.log('🕐 TIME COMPARISON:', {
          messageTime: messageTime.toISOString(),
          existingTime: existingTime.toISOString(),
          isNewer: messageTime > existingTime
        });
        
        if (!existing || messageTime > existingTime) {
          const newContact: Contact = {
            phone,
            name: this.formatPhoneNumber(phone), // Use formatted phone as display name
            lastMessage: message.body,
            timestamp: message.timestamp,
            unread: message.direction === 'Incoming' && (!existing || messageTime > existingTime)
          };
          
          console.log(existing ? '🔄 UPDATING CONVERSATION:' : '🆕 CREATING CONVERSATION:', newContact);
          conversationMap.set(phone, newContact);
        } else if (existing && message.direction === 'Incoming' && messageTime > existingTime) {
          // Mark as unread if there's a newer incoming message
          console.log('📬 MARKING AS UNREAD:', phone);
          existing.unread = true;
        }
      });

      // Convert to array and sort by timestamp (newest first)
      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log('✅ CONVERSATIONS BUILT:', conversations.length, 'total conversations');
      console.log('📋 FINAL CONVERSATIONS:', JSON.stringify(conversations, null, 2));
      
      // Log conversation grouping summary
      const groupingSummary = conversations.map(c => ({
        phoneNumber: c.phone,
        messageCount: messages.filter(m => m.conversationId === c.phone).length,
        lastMessage: c.lastMessage,
        timestamp: c.timestamp,
        direction: messages.find(m => m.conversationId === c.phone && m.timestamp === c.timestamp)?.direction
      }));
      console.log('📊 CONVERSATION SUMMARY:', groupingSummary);
      
      return { data: conversations };
    } catch (error) {
      console.error('❌ CONVERSATION BUILD ERROR:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get messages for a specific conversation (phone number)
  async fetchMessages(phoneNumber: string): Promise<ApiResponse<Message[]>> {
    try {
      console.log('📱 FETCHING MESSAGES for phone number:', phoneNumber);
      
      const messages = this.getAllMessages()
        .filter(msg => msg.conversationId === phoneNumber)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      console.log('✅ FOUND', messages.length, 'messages for phone number:', phoneNumber);
      return { data: messages };
    } catch (error) {
      console.error('❌ ERROR fetching messages for phone number:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Send message via n8n webhook
  async sendMessage(to: string, body: string): Promise<ApiResponse<boolean>> {
    try {
      // Check if URL is configured
      if (!this.settings.n8nWebhookUrl || this.settings.n8nWebhookUrl.trim() === '') {
        throw new Error('n8n Send Message URL not configured. Please check Settings.');
      }

      const response = await fetch(this.settings.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          body,
          timestamp: new Date().toISOString()
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      // Add optimistic message to local state
      const optimisticMessage: Message = {
        conversationId: to,
        timestamp: new Date().toISOString(),
        body,
        direction: 'Outgoing',
        id: `temp-${Date.now()}`,
        status: 'sent'
      };

      this.allMessages.push(optimisticMessage);
      if (optimisticMessage.id) {
        this.processedMessageIds.add(optimisticMessage.id);
      }

      console.log('✅ MESSAGE SENT successfully');
      return { data: true };
    } catch (error) {
      console.error('❌ ERROR sending message:', error);
      let errorMessage = 'Failed to send message';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Send timeout - n8n endpoint took too long to respond';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to n8n endpoint. Please check your internet connection and n8n URL in Settings.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { data: false, error: errorMessage };
    }
  }

  // Format phone number for display
  formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US/Canada format: +1 (XXX) XXX-XXXX
      const number = cleaned.substring(1);
      return `+1 (${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
    } else if (cleaned.length === 10) {
      // US/Canada without country code: (XXX) XXX-XXXX
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length > 10) {
      // International format: +XX XXXXXXXXXX
      return `+${cleaned}`;
    }
    
    // Return as-is if format is unknown
    return phone;
  }

  // Mark conversation as read
  markConversationAsRead(phone: string) {
    // This could be enhanced to update read status via API
    // For now, handle locally
  }

  // Reset processed messages
  resetProcessedMessages() {
    console.log('🔄 RESETTING processed messages');
    this.processedMessageIds.clear();
    this.allMessages = [];
  }

  // Get new messages since last check (for compatibility)
  async fetchNewIncomingMessages(): Promise<ApiResponse<Message[]>> {
    const allMessages = this.getAllMessages();
    const newIncomingMessages = allMessages.filter(msg => 
      msg.direction === 'Incoming' && 
      msg.id && 
      !this.processedMessageIds.has(msg.id)
    );

    return { data: newIncomingMessages };
  }
}