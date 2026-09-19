import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, RotateCcw, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { APP_CONFIG } from '../../config/constants';
import {
  getRoleDisplayName,
  CANONICAL_ROLE_DESCRIPTORS,
  resolveCanonicalRole,
} from '../../config/roles';

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
  const userEmail = user?.email || APP_CONFIG.adminUser.email;
  const canonicalRole = resolveCanonicalRole(user?.role);
  const roleDescriptor = CANONICAL_ROLE_DESCRIPTORS[canonicalRole];
  const userRoleDisplayName = getRoleDisplayName(user?.role);
  const isAdmin = canonicalRole === 'ADMIN';

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
        aria-label={`User profile for ${userName} (${userRoleDisplayName})`}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-xs shrink-0">
          {getInitials(userName)}
        </div>
        <div className="hidden sm:flex flex-col text-left min-w-0">
          <span className="text-xs font-semibold text-slate-800 leading-tight truncate">
            {userName}
          </span>
          <span className="text-[10px] text-slate-500 font-medium tracking-tight truncate">
            {userRoleDisplayName}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-profile-trigger"
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1.5 text-xs text-slate-700 focus:outline-hidden animate-in fade-in-50 duration-100"
        >
          {/* Header section with identity */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <p className="font-semibold text-slate-900 text-sm">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${roleDescriptor.badgeColor}`}
              >
                {userRoleDisplayName}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              {roleDescriptor.description}
            </p>
          </div>

          {/* Core navigation links */}
          <div className="py-1">
            <Link
              to="/my-work"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>My Work & Queue</span>
            </Link>

            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>System Health & Config</span>
            </Link>

            {isAdmin && (
              <Link
                to="/recovery"
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span className="font-semibold text-rose-700">Disaster Recovery (Admin)</span>
              </Link>
            )}
          </div>

          {/* Logout Section */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              role="menuitem"
              onClick={async () => {
                setIsOpen(false);
                await logout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 text-rose-600 transition-colors text-left font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
