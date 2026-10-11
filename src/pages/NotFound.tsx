import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.js';
import { ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090B] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-lg mb-6 shadow-sm">
        FT
      </div>
      <h1 className="text-4xl sm:text-6xl font-bold font-mono text-[#F4F1EA] mb-3">404</h1>
      <h2 className="text-lg font-semibold text-[#F4F1EA] mb-2">Page Not Found</h2>
      <p className="text-xs sm:text-sm text-[#8E929B] max-w-sm mb-6">
        The financial resource or page you requested does not exist or may have been relocated.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
