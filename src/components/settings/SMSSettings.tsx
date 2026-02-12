import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getAuthHeaders } from '../../stores/authStore';
import { API_BASE_URL } from '../../config/api';

interface SMSSettings {
  phoneNumber: string | null;
  smsNotificationsEnabled: boolean;
  notificationTime: string;
  timezone: string;
  notificationFrequency: string;
  lastNotificationSent: string | null;
}

interface NotificationLog {
  id: number;
  phoneNumber: string;
  messageContent: string;
  messageType: string;
  status: string;
  twilioSid: string | null;
  errorMessage: string | null;
  sentAt: Date;
}

export const SMSSettings: React.FC = () => {
  const [settings, setSettings] = useState<SMSSettings>({
    phoneNumber: null,
    smsNotificationsEnabled: false,
    notificationTime: '07:00',
    timezone: 'America/New_York',
    notificationFrequency: 'daily',
    lastNotificationSent: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user/sms-settings`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading SMS settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const response = await fetch(`${API_BASE_URL}/api/user/sms-settings`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.settings);
          setTestMessage('Settings saved successfully!');
          setTimeout(() => setTestMessage(''), 3000);
        }
      } else {
        const errorData = await response.json();
        setTestMessage(`Error: ${errorData.error}`);
        setTimeout(() => setTestMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      setTestMessage('Error saving settings');
      setTimeout(() => setTestMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const sendTestMessage = async () => {
    if (!settings.phoneNumber) {
      setTestMessage('Please enter a phone number first');
      setTimeout(() => setTestMessage(''), 3000);
      return;
    }

    try {
      setIsTesting(true);
      const response = await fetch(`${API_BASE_URL}/api/user/sms-test`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: settings.phoneNumber })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTestMessage('Test message sent successfully! Check your phone.');
        } else {
          setTestMessage(`Error: ${data.error}`);
        }
      } else {
        const errorData = await response.json();
        setTestMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setTestMessage('Error sending test message');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestMessage(''), 5000);
    }
  };

  const sendDailyMessage = async () => {
    if (!settings.phoneNumber) {
      setTestMessage('Please enter a phone number first');
      setTimeout(() => setTestMessage(''), 3000);
      return;
    }

    try {
      setIsTesting(true);
      const response = await fetch(`${API_BASE_URL}/api/user/sms-daily`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: settings.phoneNumber })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTestMessage('Daily inspiration message sent! Check your phone.');
        } else {
          setTestMessage(`Error: ${data.error}`);
        }
      } else {
        const errorData = await response.json();
        setTestMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error sending daily message:', error);
      setTestMessage('Error sending daily message');
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestMessage(''), 5000);
    }
  };

  const loadNotificationLogs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/notification-logs?limit=20`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLogs(data.logs);
          setShowLogs(true);
        }
      }
    } catch (error) {
      console.error('Error loading notification logs:', error);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">📱 SMS Notifications</h2>
        
        {testMessage && (
          <div className={`mb-4 p-3 rounded-md ${
            testMessage.includes('Error') 
              ? 'bg-red-900/50 text-red-300 border border-red-700' 
              : 'bg-green-900/50 text-green-300 border border-green-700'
          }`}>
            {testMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-green-200 mb-2">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={settings.phoneNumber || ''}
              onChange={(e) => setSettings({
                ...settings,
                phoneNumber: e.target.value
              })}
              className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              Enter your phone number to receive daily inspiration messages
            </p>
          </div>

          {/* Enable Notifications */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="sms-enabled"
              checked={settings.smsNotificationsEnabled}
              onChange={(e) => setSettings({
                ...settings,
                smsNotificationsEnabled: e.target.checked
              })}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-slate-600 rounded bg-slate-700"
            />
            <label htmlFor="sms-enabled" className="text-sm font-medium text-green-200">
              Enable daily SMS notifications
            </label>
          </div>

          {/* Time and Timezone - Side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Notification Time */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                Notification Time
              </label>
              <Input
                type="time"
                value={settings.notificationTime}
                onChange={(e) => setSettings({
                  ...settings,
                  notificationTime: e.target.value
                })}
                className="w-full bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400 mt-1">
                Daily messages will be sent at this time
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({
                  ...settings,
                  timezone: e.target.value
                })}
                className="w-full px-3 py-2 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-700 text-white"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center sm:justify-start">
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Test Messages */}
      <Card className="p-4 sm:p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">🧪 Test Messages</h3>
        
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Test your SMS notifications to make sure everything is working correctly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={sendTestMessage}
              disabled={isTesting || !settings.phoneNumber}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              {isTesting ? <LoadingSpinner size="sm" /> : 'Send Test Message'}
            </Button>
            
            <Button
              onClick={sendDailyMessage}
              disabled={isTesting || !settings.phoneNumber}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
            >
              {isTesting ? <LoadingSpinner size="sm" /> : 'Send Daily Inspiration'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Logs */}
      <Card className="p-4 sm:p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-white">📋 Notification History</h3>
          <Button
            onClick={loadNotificationLogs}
            className="bg-slate-600 hover:bg-slate-700 text-white w-full sm:w-auto"
          >
            {showLogs ? 'Refresh Logs' : 'View Logs'}
          </Button>
        </div>

        {showLogs && (
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-sm">No notification logs found.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border border-slate-600 rounded-lg p-3 sm:p-4 bg-slate-700/50">
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          log.status === 'sent' 
                            ? 'bg-green-900/50 text-green-300' 
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-xs text-slate-400">
                          {log.messageType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(log.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300">
                      {formatPhoneNumber(log.phoneNumber)}
                    </p>
                    {log.errorMessage && (
                      <p className="text-xs text-red-400">
                        Error: {log.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-amber-900/20 border-amber-700/50">
        <h3 className="text-lg font-semibold text-amber-300 mb-3">ℹ️ About SMS Notifications</h3>
        <div className="text-sm text-amber-200 space-y-2">
          <p>
            • Receive daily inspirational messages and Bible verses to help you stand firm and fight like a man
          </p>
          <p>
            • Messages are sent at your chosen time with motivational content and Scripture
          </p>
          <p>
            • You can test the system anytime using the buttons above
          </p>
          <p>
            • Standard messaging rates may apply. Reply STOP to unsubscribe anytime.
          </p>
        </div>
      </Card>
    </div>
  );
};
