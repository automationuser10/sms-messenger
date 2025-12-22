export const formatTimestamp = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInMs = now.getTime() - messageDate.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInDays < 2) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return messageDate.toLocaleDateString([], { weekday: 'short' });
  } else {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

export const formatTimestampDetailed = (timestamp: string): string => {
  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Convert timestamp to Hong Kong time (HKT - UTC+8)
export const formatHongKongTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Hong_Kong',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting Hong Kong time:', error);
    return 'Invalid time';
  }
};

// Convert timestamp to Sri Lankan time (IST - UTC+5:30)
export const formatSriLankanTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'Asia/Colombo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting Sri Lankan time:', error);
    return 'Invalid time';
  }
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.substring(1);
    return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
  }
  return phone;
};

export const getInitials = (name: string, phone: string): string => {
  if (name && name.trim()) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  // Generate initials from phone number
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.slice(-2);
};

export const truncateMessage = (message: string, maxLength: number = 50): string => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};