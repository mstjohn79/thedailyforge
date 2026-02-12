import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { useAuthStore } from '../../stores/authStore';

interface SupportFormData {
  subject: string;
  message: string;
  category: 'bug' | 'feature' | 'general' | 'billing';
}

export const SupportForm: React.FC = () => {
  const { token } = useAuthStore();
  const [formData, setFormData] = useState<SupportFormData>({
    subject: '',
    message: '',
    category: 'general'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      if (!token) {
        setError('You must be logged in to submit a support request');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/support/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setFormData({ subject: '', message: '', category: 'general' });
      } else {
        setError(result.error || 'Failed to send support request');
      }
    } catch (error) {
      setError('Failed to send support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Support Request Sent!</h3>
          <p className="text-slate-300 mb-4">
            We've received your message and will get back to you within 24 hours.
          </p>
          <Button
            onClick={() => setIsSubmitted(false)}
            className="bg-green-600 hover:bg-green-700"
          >
            Send Another Message
          </Button>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-green-400" />
        <h2 className="text-2xl font-bold text-white">Contact Support</h2>
      </div>

      <p className="text-slate-300 mb-6">
        Have a question or need help? Send us a message and we'll get back to you as soon as possible.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
            className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
          >
            <option value="general">General Question</option>
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="billing">Billing Issue</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Subject *
          </label>
          <Input
            type="text"
            placeholder="Brief description of your issue"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            required
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Message *
          </label>
          <Textarea
            placeholder="Please describe your issue or question in detail..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="w-full bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            rows={6}
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Be as specific as possible to help us assist you better.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Send Support Request
            </div>
          )}
        </Button>
      </form>
    </Card>
  );
};

