// Demo page showing Bible integration with SOAP study
// This demonstrates the complete workflow

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { BibleIntegration } from '../daily/BibleIntegration';
import { BibleVerse } from '../../lib/bibleService';

export const BibleIntegrationDemo: React.FC = () => {
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [soapData, setSoapData] = useState({
    scripture: '',
    observation: '',
    application: '',
    prayer: ''
  });

  const handleVerseSelect = (verse: BibleVerse) => {
    setSelectedVerse(verse);
    setSoapData(prev => ({
      ...prev,
      scripture: `${verse.reference} - ${verse.content}`
    }));
  };

  const handleSOAPChange = (field: string, value: string) => {
    setSoapData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📖 Bible Integration Demo
        </h1>
        <p className="text-lg text-gray-600">
          See how scripture selection integrates with SOAP study
        </p>
      </motion.div>

      {/* Bible Integration Component */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <BibleIntegration
          onVerseSelect={handleVerseSelect}
          selectedVerse={selectedVerse || undefined}
        />
      </motion.div>

      {/* SOAP Study Form */}
      {selectedVerse && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              📝 SOAP Study
            </h3>
            
            <div className="space-y-6">
              {/* Scripture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scripture (S)
                </label>
                <Textarea
                  value={soapData.scripture}
                  onChange={(e) => handleSOAPChange('scripture', e.target.value)}
                  placeholder="Selected scripture will appear here..."
                  rows={3}
                  className="bg-blue-50 border-blue-200"
                />
              </div>

              {/* Observation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observation (O)
                </label>
                <Textarea
                  value={soapData.observation}
                  onChange={(e) => handleSOAPChange('observation', e.target.value)}
                  placeholder="What do you observe in this passage? What stands out to you?"
                  rows={4}
                />
              </div>

              {/* Application */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Application (A)
                </label>
                <Textarea
                  value={soapData.application}
                  onChange={(e) => handleSOAPChange('application', e.target.value)}
                  placeholder="How does this apply to your life? What should you do differently?"
                  rows={4}
                />
              </div>

              {/* Prayer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prayer (P)
                </label>
                <Textarea
                  value={soapData.prayer}
                  onChange={(e) => handleSOAPChange('prayer', e.target.value)}
                  placeholder="Pray about what you've learned and ask God for help in applying it..."
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button className="bg-green-500 hover:bg-green-600">
                  Save SOAP Study
                </Button>
                <Button variant="outline">
                  Share Study
                </Button>
                <Button variant="outline">
                  Clear & Start Over
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            🚀 Integration Features
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">📖 Scripture Selection</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Search across 2,500+ Bible versions</li>
                <li>• Browse by book, chapter, verse</li>
                <li>• Keyword search functionality</li>
                <li>• Multiple Bible translations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">📚 Manly Devotional Tracks</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Warrior Psalms - Strength & courage</li>
                <li>• Leadership Proverbs - Godly leadership</li>
                <li>• Courage & Conquest - Joshua & Judges</li>
                <li>• Strength in Isaiah - Hope & endurance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">🔗 YouVersion Integration</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Deep links to YouVersion app</li>
                <li>• Access to additional resources</li>
                <li>• Community features</li>
                <li>• Audio Bible options</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">📝 SOAP Integration</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Auto-populate scripture from API.Bible</li>
                <li>• Manly-themed study prompts</li>
                <li>• Save and track progress</li>
                <li>• Share studies with others</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
