import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, UserCheck, Shield, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../config/constants';
import { UserRole } from '../../types';

export interface UserProfileMenuProps {
  id?: string;
  className?: string;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  id = 'user-profile-menu',
  className = '',
}) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const userName = user?.name || APP_CONFIG.adminUser.name;
  const userRole = user?.role || APP_CONFIG.adminUser.role;
  const userEmail = user?.email || APP_CONFIG.adminUser.email;
  const isAdmin = userRole === UserRole.ADMIN || userRole === 'ADMIN';

  const getInitials = (name?: string) => {
    if (!name) return 'BP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div id={id} ref={menuRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        id="user-profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`User profile for ${userName}`}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs shrink-0">
          {getInitials(userName)}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 leading-tight">
            {userName}
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-wide">
            {userRole}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-profile-trigger"
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1.5 text-xs text-slate-700 focus:outline-hidden animate-in fade-in-50 duration-100"
        >
          {/* Header section with identity */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="font-semibold text-slate-900 text-sm">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Role: {userRole}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              to="/my-work"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>My Workboard</span>
            </Link>

            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>System Settings</span>
            </Link>

            {isAdmin && (
              <Link
                to="/recovery"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Admin & System Health</span>
              </Link>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
