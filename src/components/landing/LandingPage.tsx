import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Mountain } from 'lucide-react';
import { BookOpen, Users, Target, Zap, Heart, TrendingUp, Sun, CheckCircle, BarChart3, FileText } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const LandingPage: React.FC = () => {
  const { signup, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signupMessage, setSignupMessage] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupData.password !== signupData.confirmPassword) {
      setSignupMessage('Passwords do not match');
      return;
    }

    setSignupMessage('');

    const success = await signup(
      signupData.displayName,
      signupData.email,
      signupData.password
    );

    if (success) {
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      setSignupMessage(error || 'Failed to create account');
    }
  };

  const features = [
    {
      icon: <CheckCircle className="w-8 h-8 text-green-400" />,
      title: "Daily Intentions",
      description: "Set purposeful daily actions aligned with your values and God's calling for intentional living and growth"
    },
    {
      icon: <Sun className="w-8 h-8 text-green-400" />,
      title: "Daily Gratitude Practice",
      description: "Cultivate a heart of thankfulness with guided gratitude exercises that transform your perspective and attitude"
    },
    {
      icon: <BookOpen className="w-8 h-8 text-green-400" />,
      title: "SOAP Bible Study",
      description: "Structured Scripture study with Scripture, Observation, Application, and Prayer method for deep spiritual growth"
    },
    {
      icon: <FileText className="w-8 h-8 text-green-400" />,
      title: "Sermon Notes",
      description: "Record and organize church service notes with search and filtering to capture and revisit spiritual insights"
    },
    {
      icon: <Users className="w-8 h-8 text-green-400" />,
      title: "Prayer & Praise Tracking",
      description: "Keep track of your prayer list and celebrate praise reports as you see God's faithfulness in your life and community"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-green-400" />,
      title: "Growth Analytics",
      description: "Track your spiritual growth and progress over time with detailed analytics and insights into your journey"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-green-800/20 to-slate-900/20"></div>
      </div>
      
      {/* Hero Section */}
      <div className="relative z-10 px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 sm:mb-12 lg:mb-16"
          >
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              <span className="text-green-400">The Daily</span> Forge
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-green-200 mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
              Step into your purpose. Grow as a man of God with daily discipline and community.
            </p>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Grow spiritually through structured Bible study, prayer tracking, and daily disciplines that build godly character and faith.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
              <Button
                onClick={() => setShowSignup(true)}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Your Journey
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full sm:w-auto border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300"
              >
                Sign In
              </Button>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 px-2"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <Card className="p-4 sm:p-6 lg:p-8 bg-slate-800/80 backdrop-blur-sm border-slate-700 hover:border-green-500/50 transition-all duration-300 h-full">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start mb-3 sm:mb-4">
                    <div className="mb-2 sm:mb-0 sm:mr-3">{feature.icon}</div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white text-center sm:text-left">{feature.title}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Call to Action Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center px-2"
          >
            <Card className="p-6 sm:p-8 lg:p-12 bg-slate-800/80 backdrop-blur-sm border-slate-700 hover:border-green-500/50 transition-all duration-300">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
                Ready to Live with Purpose?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-200 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Step into your calling. Join men who are committed to growing in faith, character, and spiritual discipline as they pursue God's purpose for their lives.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => setShowSignup(true)}
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Begin Your Growth Journey
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-300"
                >
                  Continue Growing
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-sm sm:max-w-md"
          >
            <Card className="p-4 sm:p-6 bg-slate-800 border-slate-700">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">Start Your Journey</h2>
                <button
                  onClick={() => setShowSignup(false)}
                  className="text-slate-400 hover:text-white text-xl sm:text-2xl p-1"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-1 sm:mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Your first name"
                    value={signupData.displayName}
                    onChange={(e) => setSignupData({ ...signupData, displayName: e.target.value })}
                    required
                    className="w-full text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-200 mb-1 sm:mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="w-full text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-200 mb-1 sm:mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    className="w-full text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-200 mb-1 sm:mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                    className="w-full text-sm sm:text-base"
                  />
                </div>

                {signupMessage && (
                  <div className={`p-2 sm:p-3 rounded-md text-xs sm:text-sm ${
                    signupMessage.includes('success') 
                      ? 'bg-green-900/50 text-green-300 border border-green-700' 
                      : 'bg-red-900/50 text-red-300 border border-red-700'
                  }`}>
                    {signupMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold"
                >
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Start Your Journey'}
                </Button>
              </form>

              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-slate-400 text-xs sm:text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setShowSignup(false);
                      navigate('/login');
                    }}
                    className="text-green-400 hover:text-green-300 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};
