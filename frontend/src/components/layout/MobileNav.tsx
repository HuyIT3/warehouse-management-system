import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowUpRight, FileText, ClipboardList, History } from 'lucide-react';
import clsx from 'clsx';

export const MobileNav: React.FC = () => {
  const items = [
    { to: '/', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
    { to: '/goods-receipts', label: 'Phiếu Nhập', icon: FileText },
    { to: '/stock-out', label: 'Xuất kho', icon: ArrowUpRight, primary: true },
    { to: '/inventory', label: 'Tồn kho', icon: ClipboardList },
    { to: '/transactions', label: 'Lịch sử', icon: History },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-medium transition-all',
                  item.primary && isActive
                    ? 'text-white bg-blue-600 shadow-md shadow-blue-500/30'
                    : item.primary
                    ? 'text-blue-400 bg-blue-950/60 font-semibold'
                    : isActive
                    ? 'text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                )
              }
            >
              <Icon className={clsx('w-5 h-5 mb-0.5', item.primary && 'w-5 h-5')} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
