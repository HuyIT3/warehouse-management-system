import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  MapPin,
  ClipboardList,
  History,
  Users,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, isInboundStaff, isOutboundStaff } = useAuth();

  const primaryNavItems = [
    { to: '/', label: 'Tổng Quan (Dashboard)', icon: LayoutDashboard, exact: true },
  ];

  const operationalNavItems = [
    {
      to: '/goods-receipts',
      label: 'Phiếu Nhập Kho (Inbound)',
      icon: FileText,
      badge: 'Mới',
      show: isInboundStaff,
    },
    {
      to: '/stock-out',
      label: 'Xuất Vật Tư (Mobile Flow)',
      icon: ArrowUpRight,
      highlight: true,
      badge: 'Chính',
      show: isOutboundStaff,
    },
    {
      to: '/stock-in',
      label: 'Nhập Kho Nhanh',
      icon: ArrowDownLeft,
      show: isInboundStaff,
    },
  ];

  const inventoryNavItems = [
    { to: '/materials', label: 'Danh Mục Vật Tư', icon: Boxes, show: true },
    { to: '/locations', label: 'Sơ Đồ Vị Trí Ô Kệ', icon: MapPin, show: true },
    { to: '/inventory', label: 'Tra Cứu Tồn Kho', icon: ClipboardList, show: true },
    { to: '/transactions', label: 'Lịch Sử Biến Động', icon: History, show: true },
  ];

  const adminNavItems = [
    { to: '/users', label: 'Quản Lý Người Dùng', icon: Users, show: isAdmin },
  ];

  const renderNavGroup = (title: string, items: any[]) => {
    const visibleItems = items.filter((i) => i.show !== false);
    if (visibleItems.length === 0) return null;

    return (
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {title}
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => onClose()}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? item.highlight
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800 text-blue-400 font-semibold border border-blue-500/20'
                    : item.highlight
                    ? 'bg-blue-950/40 text-blue-400 border border-blue-800/40 hover:bg-blue-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate text-xs font-semibold">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900/95 transition-transform duration-300 md:translate-x-0 overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col justify-between p-3 space-y-4">
          <div className="space-y-4">
            {/* User Active Role Pill */}
            <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                {String(user?.role || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{user?.fullName || user?.username}</div>
                <div className="text-[10px] text-blue-400 font-medium truncate">{user?.roleName || String(user?.role || '')}</div>
              </div>
            </div>

            {renderNavGroup('Tổng Quan', primaryNavItems)}
            {renderNavGroup('Nghiệp Vụ Nhập / Xuất', operationalNavItems)}
            {renderNavGroup('Kho Hàng & Tồn Kho', inventoryNavItems)}
            {renderNavGroup('Quản Trị', adminNavItems)}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <div className="rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Hệ Thống Sẵn Sàng</span>
              </div>
              <p className="text-[10px] text-slate-500">
                .NET 8 API • React 19 • Clean Arch
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
