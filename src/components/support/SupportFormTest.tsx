import React from 'react';
import { Card } from '../ui/Card';

export const SupportFormTest: React.FC = () => {
  return (
    <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-4">💬 Support</h2>
      <p className="text-slate-300">This is a test support component to verify the tab is working.</p>
    </Card>
  );
};
