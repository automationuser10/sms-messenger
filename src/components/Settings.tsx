import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle, RefreshCw, Wifi } from 'lucide-react';
import { ApiService } from '../utils/api';

interface SettingsProps {
  className?: string;
}

const Settings: React.FC<SettingsProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState({
    n8nWebhookUrl: 'https://cloud.automationhoster.org/webhook/send-sms',
    n8nGetMessagesUrl: 'https://cloud.automationhoster.org/webhook/get-messages',
    pollingInterval: 30
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('sms-app-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings({
        n8nWebhookUrl: parsed.n8nWebhookUrl || 'https://cloud.automationhoster.org/webhook/send-sms',
        n8nGetMessagesUrl: parsed.n8nGetMessagesUrl || 'https://cloud.automationhoster.org/webhook/get-messages',
        pollingInterval: parsed.pollingInterval || 30
      });
    }
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);

    try {
      // Save to localStorage
      localStorage.setItem('sms-app-settings', JSON.stringify(settings));
      
      // Update API service
      const apiService = ApiService.getInstance();
      apiService.updateSettings(settings);
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPolling = () => {
    const apiService = ApiService.getInstance();
    apiService.resetProcessedMessages();
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  return (
    <div className={`${className} bg-white h-full overflow-y-auto`}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your SMS conversation management app</p>
        </div>

        {/* API Integration Status */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Wifi className="w-4 h-4 text-blue-600" />
            </div>
            API Integration Status
          </h2>
          
          <div className={`p-4 rounded-lg ${
            settings.n8nGetMessagesUrl && settings.n8nWebhookUrl 
              ? 'bg-blue-50' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                settings.n8nGetMessagesUrl && settings.n8nWebhookUrl 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                settings.n8nGetMessagesUrl && settings.n8nWebhookUrl 
                  ? 'text-blue-900' 
                  : 'text-yellow-800'
              }`}>
                {settings.n8nGetMessagesUrl && settings.n8nWebhookUrl 
                  ? 'n8n API Configured' 
                  : 'n8n API Not Configured'
                }
              </span>
            </div>
            {settings.n8nGetMessagesUrl && settings.n8nWebhookUrl ? (
              <p className="text-sm text-blue-700">
                Polling messages every {settings.pollingInterval} seconds from:<br />
                <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                  {settings.n8nGetMessagesUrl}
                </code>
              </p>
            ) : (
              <p className="text-sm text-yellow-700">
                Please configure both n8n webhook URLs below to enable SMS functionality.
              </p>
            )}
          </div>
        </div>

        {/* n8n Webhook Configuration */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-orange-600 font-bold text-sm">n8n</span>
            </div>
            n8n Webhook Integration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                n8n Send Message Webhook URL
              </label>
              <input
                type="url"
                value={settings.n8nWebhookUrl}
                onChange={(e) => handleInputChange('n8nWebhookUrl', e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/send-sms"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your n8n webhook URL for sending SMS messages
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                n8n Get Messages Webhook URL
              </label>
              <input
                type="url"
                value={settings.n8nGetMessagesUrl}
                onChange={(e) => handleInputChange('n8nGetMessagesUrl', e.target.value)}
                placeholder="https://your-n8n-instance.com/webhook/get-messages"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Your n8n webhook URL for retrieving SMS messages
              </p>
            </div>
          </div>
        </div>

        {/* App Configuration */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-purple-600 font-bold text-sm">⚙️</span>
            </div>
            App Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Polling Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.pollingInterval}
                onChange={(e) => handleInputChange('pollingInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                How often to check for new messages (10-300 seconds). Recommended: 30 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Message Polling Management */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <RefreshCw className="w-4 h-4 text-green-600" />
            </div>
            Message Polling Management
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                <li>• App polls the n8n API every {settings.pollingInterval} seconds</li>
                <li>• New messages are automatically detected and displayed</li>
                <li>• Conversations are created/updated in real-time</li>
                <li>• Duplicate messages are prevented using message IDs</li>
              </ul>
              
              <p className="text-sm text-gray-700 mb-3">
                Reset the message polling system to check for all messages again. 
                This is useful if you think some messages were missed.
              </p>
              <button
                onClick={handleResetPolling}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Reset Message Polling
              </button>
            </div>
          </div>
        </div>

        {/* API Endpoints Info */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h2>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Get Messages (Polling)</div>
              <code className="text-xs text-gray-600">GET {settings.n8nGetMessagesUrl}</code>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-900">Send Message</div>
              <code className="text-xs text-gray-600">POST {settings.n8nWebhookUrl}</code>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>

          {saveStatus && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              saveStatus === 'success' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {saveStatus === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>
                {saveStatus === 'success' ? 'Settings saved successfully!' : 'Failed to save settings'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;