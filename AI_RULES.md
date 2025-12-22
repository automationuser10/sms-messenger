# AI Rules for SMS Conversation Management App

## Tech Stack

- **Framework**: React 18 with TypeScript and Vite for fast development and type safety
- **Styling**: Tailwind CSS for all UI components - use utility classes extensively, no custom CSS files
- **Icons**: lucide-react for all icons - already installed, use for any icon needs
- **State Management**: React hooks (useState, useEffect, useRef) - no external state management libraries
- **API Integration**: Custom ApiService singleton class for n8n webhook communication and message polling
- **Routing**: Single-page application with view-based navigation (no React Router needed)
- **Storage**: localStorage for settings, authentication state, and processed message tracking

## Library Usage Rules

### UI Components
- **ALWAYS** use Tailwind CSS utility classes for styling
- **NEVER** create separate CSS files or use inline styles
- Use lucide-react for all icons (Search, Send, MessageSquare, Settings, etc.)
- Keep components small and focused (under 200 lines when possible)

### Data Fetching
- **ALWAYS** use the ApiService singleton for all API calls
- **NEVER** make direct fetch calls outside of ApiService
- Use the polling mechanism for real-time message updates
- Handle errors gracefully with user-friendly messages

### State Management
- Use React hooks (useState, useEffect) for component state
- Use useRef for DOM references and mutable values that don't trigger re-renders
- Pass callbacks down for parent-child communication
- **NO** Redux, Zustand, or other state management libraries

### TypeScript
- **ALWAYS** define interfaces for props and data structures in src/types/index.ts
- Use strict typing - avoid `any` types
- Export types from a central location for reusability

### File Organization
- Components go in `src/components/`
- Utility functions go in `src/utils/`
- Type definitions go in `src/types/`
- Keep the main App.tsx as the orchestrator

## Architecture Patterns

### API Service Pattern
- ApiService is a singleton - use `ApiService.getInstance()`
- Handles all n8n webhook communication
- Manages message polling and deduplication
- Provides callbacks for new messages and errors
- Stores all messages in memory for fast access

### Message Flow
1. ApiService polls n8n GET endpoint every 30 seconds (configurable)
2. New messages are detected by comparing message IDs
3. Callbacks notify components of new messages
4. Components update UI reactively
5. Outgoing messages are sent via n8n POST endpoint

### Component Communication
- Parent components pass callbacks to children
- Use props for data down, callbacks for events up
- Avoid prop drilling - keep component hierarchy shallow
- Use composition over inheritance

## Code Style Guidelines

### Component Structure
```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Icon } from 'lucide-react';

// 2. Interface definitions
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// 3. Component definition
const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4. State hooks
  const [state, setState] = useState('');
  
  // 5. Effects
  useEffect(() => {
    // effect logic
  }, []);
  
  // 6. Event handlers
  const handleEvent = () => {
    // handler logic
  };
  
  // 7. Render
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### Naming Conventions
- Components: PascalCase (e.g., `MessageBubble.tsx`)
- Utilities: camelCase (e.g., `formatters.ts`)
- Interfaces: PascalCase (e.g., `Contact`, `Message`)
- Props interfaces: ComponentNameProps (e.g., `MessageBubbleProps`)

### Tailwind Best Practices
- Use responsive prefixes: `md:`, `lg:`, `xl:`
- Group related utilities: spacing, colors, typography
- Use Tailwind's color palette (blue-500, gray-100, etc.)
- Prefer Tailwind utilities over custom CSS

## API Integration Rules

### n8n Webhook Format
**GET Messages Endpoint** (`/webhook/get-messages`):
- Returns array of message objects
- Each message must have: id, conversationId, timestamp, messageBody, direction, participants, type
- Timestamp format: ISO 8601 or "MM/DD/YYYY, HH:MM:SS AM/PM"

**POST Send Message Endpoint** (`/webhook/send-sms`):
- Accepts: `{ to: string, body: string, timestamp: string }`
- Returns success/error response

### Error Handling
- Always provide user-friendly error messages
- Show connection status in UI
- Implement retry logic for failed requests
- Use 10-second timeout for all API calls

## Security & Authentication

- Simple username/password authentication (stored in localStorage)
- Valid credentials:
  - Username: "veerr", Password: "ai123456"
  - Username: "githmi", Password: "ai123456"
- No backend authentication - client-side only
- Settings stored in localStorage (not secure for production)

## Performance Considerations

- Message polling interval: 30 seconds (configurable)
- Deduplicate messages using Set of processed IDs
- Sort messages once when building conversations
- Use React.memo for expensive components if needed
- Lazy load components only if bundle size becomes an issue

## Mobile Responsiveness

- Mobile-first design approach
- Use Tailwind responsive prefixes (md:, lg:)
- Sidebar collapses on mobile with overlay
- Chat view takes full screen on mobile
- Touch-friendly button sizes (min 44px)

## Debugging & Logging

- Use console.log with emoji prefixes for visibility:
  - 🔄 for loading/polling operations
  - ✅ for successful operations
  - ❌ for errors
  - 🆕 for new messages
  - 📋 for data dumps
- Log API responses in development
- Include timestamps in logs for debugging polling

## Common Patterns

### Loading States
```typescript
const [loading, setLoading] = useState(false);
// Show spinner or skeleton while loading
{loading ? <Spinner /> : <Content />}
```

### Error States
```typescript
const [error, setError] = useState<string | null>(null);
// Show error banner when error exists
{error && <ErrorBanner message={error} />}
```

### Conditional Rendering
```typescript
// Use ternary for simple conditions
{isActive ? <ActiveView /> : <InactiveView />}

// Use && for single condition
{showMessage && <Message />}
```

## Testing Approach

- Manual testing in browser (no automated tests currently)
- Test on mobile viewport sizes
- Verify API integration with real n8n endpoints
- Check localStorage persistence across sessions

## Future Enhancements (Not Implemented)

- Real-time WebSocket connections instead of polling
- Contact management with names/avatars
- Message search functionality
- File/media attachments
- Message reactions and threading
- Push notifications
- Backend authentication with JWT