import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Shield, Warehouse, Menu, Briefcase, ArrowDownLeft, ArrowUpRight, ClipboardCheck, Package } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getRoleDisplay = () => {
    const r = String(user?.role || '').toUpperCase();
    switch (r) {
      case 'ADMIN':
      case '0':
        return {
          label: 'Quản Trị Viên',
          color: 'text-rose-400 bg-rose-950/40 border-rose-800/50',
          icon: Shield,
        };
      case 'MANAGER':
      case '1':
        return {
          label: 'Quản Lý Kho',
          color: 'text-amber-400 bg-amber-950/40 border-amber-800/50',
          icon: Briefcase,
        };
      case 'INBOUND_STAFF':
      case '2':
        return {
          label: 'NV Nhập Kho',
          color: 'text-blue-400 bg-blue-950/40 border-blue-800/50',
          icon: ArrowDownLeft,
        };
      case 'OUTBOUND_STAFF':
      case '3':
        return {
          label: 'NV Xuất Kho',
          color: 'text-orange-400 bg-orange-950/40 border-orange-800/50',
          icon: ArrowUpRight,
        };
      case 'AUDITOR':
      case '4':
        return {
          label: 'NV Kiểm Kê',
          color: 'text-purple-400 bg-purple-950/40 border-purple-800/50',
          icon: ClipboardCheck,
        };
      default:
        return {
          label: 'NV Kho Tổng Hợp',
          color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
          icon: Package,
        };
    }
  };

  const roleInfo = getRoleDisplay();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20 text-white font-bold">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
                  WMS Pro
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800/50 rounded-full">
                  Industrial WMS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Hệ thống Quản lý Kho & Vật tư Công nghiệp</p>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-200">{user.fullName}</div>
                <div className="flex items-center justify-end gap-1 text-[11px] mt-0.5">
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" /> {roleInfo.label}
                  </span>
                </div>
              </div>

              <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
