import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL } from '../../config/api';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  memberSince: string;
}

export const ProfileSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('auth-token') || 
                      JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token;
        
        if (!token) {
          console.error('No token found');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (result.success) {
          setProfile(result.profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">👤 Profile</h2>
        <p className="text-slate-300">Loading profile information...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">👤 Profile</h2>
      
      <div className="space-y-4">
        {/* Display Name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-slate-600">
          <label className="text-green-200 font-medium w-32">Name:</label>
          <span className="text-white">{profile?.name || user?.name || 'N/A'}</span>
        </div>
        
        {/* Email */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-slate-600">
          <label className="text-green-200 font-medium w-32">Email:</label>
          <span className="text-white break-all">{profile?.email || user?.email || 'N/A'}</span>
        </div>
        
        {/* Account Type */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-slate-600">
          <label className="text-green-200 font-medium w-32">Account Type:</label>
          <span className="text-white capitalize">{profile?.role || user?.role || 'N/A'}</span>
        </div>
        
        {/* Member Since */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-slate-600">
          <label className="text-green-200 font-medium w-32">Member Since:</label>
          <span className="text-white">{profile?.memberSince ? formatDate(profile.memberSince) : 'N/A'}</span>
        </div>
      </div>
      
      {/* Placeholder for future features */}
      <div className="mt-8 pt-6 border-t border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
        <p className="text-slate-400 text-sm">
          Additional profile settings coming soon...
        </p>
      </div>
    </Card>
  );
};

