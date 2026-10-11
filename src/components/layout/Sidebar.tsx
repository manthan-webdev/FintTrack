import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PieChart,
  Tags,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTranslation } from '../../context/LanguageContext.js';

interface SidebarProps {
  onNavigate?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const mainNavItems = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('nav.transactions'), path: '/transactions', icon: ArrowLeftRight },
    { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
    { label: t('nav.budgets'), path: '/budgets', icon: PieChart },
    { label: t('nav.categories'), path: '/categories', icon: Tags },
  ];

  const bottomNavItems = [
    { label: t('nav.settings'), path: '/settings', icon: Settings },
    { label: t('nav.profile'), path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-[#111318] border-r border-[#262932] flex flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-[#262932]">
        <NavLink
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 group focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-[#C9B58A] flex items-center justify-center font-bold text-[#08090B] text-sm tracking-wider shadow-sm group-hover:scale-105 transition-transform">
            FT
          </div>
          <div>
            <span className="text-base font-bold text-[#F4F1EA] tracking-tight">FinTrack</span>
          </div>
        </NavLink>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 flex flex-col justify-between overflow-y-auto">
        <div>
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#17191F] text-[#C9B58A] border border-[#C9B58A]/30 shadow-xs'
                        : 'text-[#9297A1] hover:text-[#F4F1EA] hover:bg-[#17191F]/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-[#262932]/60">
          <nav className="flex flex-col gap-1 mb-3">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#17191F] text-[#C9B58A] border border-[#C9B58A]/30 shadow-xs'
                        : 'text-[#9297A1] hover:text-[#F4F1EA] hover:bg-[#17191F]/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User profile footer */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#17191F] border border-[#262932]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#262932] flex items-center justify-center text-xs font-bold text-[#C9B58A] shrink-0">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#F4F1EA] truncate">
                  {user?.full_name || 'Member'}
                </p>
                <p className="text-[10px] text-[#9297A1] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="text-[#9297A1] hover:text-[#D97979] p-1.5 rounded-md hover:bg-[#262932]/50 transition-colors shrink-0"
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
