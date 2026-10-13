import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { dashboardApi } from '../../services/api';
import { NotificationItem } from '../../types';
import {
  Layers,
  Bell,
  LogOut,
  Menu,
  User as UserIcon,
  Shield,
  Briefcase,
  UserCheck,
  Code2
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar, onOpenAuth }) => {
  const { user, logout } = useAuth();
  const { lastEvent } = useWebSocket();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await dashboardApi.getNotifications();
      setNotifications(res.data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, lastEvent]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: number) => {
    try {
      await dashboardApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {
      // Ignore
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return { label: 'Admin', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'ROLE_PM':
        return { label: 'Project Manager', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'ROLE_CLIENT':
        return { label: 'Client', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'ROLE_TEAM_MEMBER':
      default:
        return { label: 'Team Member', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger + Project Name only */}
          <div className="flex items-center gap-3">
            {onToggleMobileSidebar && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white">
                    NEXORA
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Enterprise
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-slate-400 font-medium tracking-tight">
                  Issue Tracking & Project Management Platform
                </p>
              </div>
            </div>
          </div>

          {/* Right: Login Details only */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                    className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    title="System Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifDropdown && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                        <span className="font-semibold text-sm text-white">System Notifications</span>
                        <span className="text-xs text-slate-400">{unreadCount} unread</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No notifications</div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs transition-colors hover:bg-slate-800/50 ${
                                !n.read ? 'bg-blue-950/30' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-slate-200">{n.title}</span>
                                {!n.read && (
                                  <button
                                    onClick={() => handleMarkRead(n.id)}
                                    className="text-blue-400 hover:text-blue-300 text-[10px] shrink-0 font-medium"
                                  >
                                    Mark read
                                  </button>
                                )}
                              </div>
                              <p className="text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-slate-500 mt-1.5 block">
                                {new Date(n.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logged In User Profile Details */}
                <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white uppercase ring-2 ring-blue-500/30 shrink-0">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>

                  <div className="hidden sm:block text-left">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[140px]">
                        {user.name}
                      </p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(user.role).color}`}>
                        {getRoleBadge(user.role).label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[180px]">
                      {user.email}
                    </p>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                    title="Sign Out of Nexora"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Unauthenticated: Show Login / Create Account options */
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition-all"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
