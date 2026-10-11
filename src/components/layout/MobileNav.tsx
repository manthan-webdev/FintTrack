import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  PieChart,
  User,
  X,
} from 'lucide-react';
import { Sidebar } from './Sidebar.js';
import { useTranslation } from '../../context/LanguageContext.js';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#08090B]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Sidebar */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#111318] shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200">
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9297A1] hover:text-[#F4F1EA] bg-[#17191F] border border-[#262932]"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
};

export const MobileBottomBar: React.FC = () => {
  const { t } = useTranslation();

  const tabs = [
    { label: t('nav.dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('nav.transactions'), path: '/transactions', icon: ArrowLeftRight },
    { label: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
    { label: t('nav.budgets'), path: '/budgets', icon: PieChart },
    { label: t('nav.profile'), path: '/profile', icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#111318]/95 backdrop-blur-md border-t border-[#262932] px-2 flex items-center justify-around z-40">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#C9B58A]' : 'text-[#9297A1] hover:text-[#F4F1EA]'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="truncate max-w-[50px]">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
