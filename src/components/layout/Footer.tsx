import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const appVersion = '2.0.2';

  return (
    <footer className="bg-slate-800/90 backdrop-blur-sm border-t border-slate-700 py-4 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
          {/* Left: Contact & Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <Link 
              to="/settings?tab=support" 
              className="flex items-center gap-1.5 hover:text-green-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Support</span>
            </Link>
            <span className="text-slate-500">|</span>
            <span>© {currentYear} Daily David</span>
          </div>
          
          {/* Center: Version */}
          <div className="text-slate-500">
            <span className="hidden sm:inline">Version </span>
            <span className="text-slate-400">{appVersion}</span>
          </div>
          
          {/* Right: Links */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a 
              href="#" 
              className="hover:text-green-400 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              Privacy Policy
            </a>
            <span className="text-slate-500">|</span>
            <a 
              href="#" 
              className="hover:text-green-400 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

