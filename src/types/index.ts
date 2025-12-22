export interface Contact {
  phone: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread?: boolean;
}

export interface Message {
  conversationId: string;
  timestamp: string;
  body: string;
  direction: 'Incoming' | 'Outgoing';
  id?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
}

export interface ConversationFilter {
  type: 'all' | 'unread' | 'recents' | 'starred';
  label: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface Settings {
  sheetId: string;
  apiKey: string;
  n8nWebhookUrl: string;
  pollingInterval: number;
}