import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in">
      <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-mono font-bold text-lg">
        404
      </div>
      <h2 className="text-lg font-bold text-slate-900">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
        The route you are trying to access is not part of the Burra Pariksha CMS navigation hierarchy.
      </p>
      <div className="pt-2">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" icon={Home}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
