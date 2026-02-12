import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { ProfileSettings } from './ProfileSettings';
import { SupportForm } from '../support';

type SettingsTab = 'profile' | 'notifications' | 'support';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const location = useLocation();

  // Check for tab query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'support' || tab === 'profile' || tab === 'notifications') {
      setActiveTab(tab as SettingsTab);
    }
    // If tab is 'sms' or invalid, default to 'profile'
  }, [location.search]);

  const tabs = [
    { id: 'profile' as SettingsTab, label: '👤 Profile', icon: '👤' },
    { id: 'notifications' as SettingsTab, label: '🔔 Notifications', icon: '🔔' },
    { id: 'support' as SettingsTab, label: '💬 Support', icon: '💬' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return (
          <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">🔔 Notification Settings</h2>
            <p className="text-slate-300">Additional notification settings coming soon...</p>
          </Card>
        );
      case 'support':
        return <SupportForm />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative z-10 px-2 sm:px-4">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-4">Settings</h1>
        <p className="text-sm sm:text-base lg:text-xl text-green-200 px-4">Manage your Daily David preferences, notifications, and support</p>
      </motion.div>

      <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Sidebar - Mobile: Horizontal tabs, Desktop: Vertical sidebar */}
        <div className="xl:w-64">
          <Card className="p-3 sm:p-4 bg-slate-800/80 backdrop-blur-sm border-slate-700">
            <nav className="flex xl:flex-col space-x-2 xl:space-x-0 xl:space-y-2 overflow-x-auto xl:overflow-x-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 xl:w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                      : 'text-green-200 hover:text-white hover:bg-green-700/50'
                  }`}
                >
                  <span className="mr-2 sm:mr-3">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
