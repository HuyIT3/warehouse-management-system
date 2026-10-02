import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import {
  Warehouse,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Shield,
  Briefcase,
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  Package,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ username: username.trim(), password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate('/');
      } else {
        setError(res.message || 'Đăng nhập thất bại.');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          'Không thể kết nối đến máy chủ. Vui lòng thử lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  const demoAccounts = [
    {
      role: 'Quản trị viên (Admin)',
      user: 'admin',
      pass: 'Admin@123',
      color: 'text-rose-400 border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30',
      icon: Shield,
    },
    {
      role: 'Quản lý kho (Manager)',
      user: 'manager',
      pass: 'Manager@123',
      color: 'text-amber-400 border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/30',
      icon: Briefcase,
    },
    {
      role: 'NV Nhập kho (Inbound)',
      user: 'inbound1',
      pass: 'Staff@123',
      color: 'text-blue-400 border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/30',
      icon: ArrowDownLeft,
    },
    {
      role: 'NV Xuất kho (Outbound)',
      user: 'outbound1',
      pass: 'Staff@123',
      color: 'text-orange-400 border-orange-500/30 bg-orange-950/20 hover:bg-orange-900/30',
      icon: ArrowUpRight,
    },
    {
      role: 'NV Kiểm kê (Auditor)',
      user: 'auditor1',
      pass: 'Staff@123',
      color: 'text-purple-400 border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/30',
      icon: ClipboardCheck,
    },
    {
      role: 'NV Kho tổng hợp',
      user: 'staff1',
      pass: 'Staff@123',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-900/30',
      icon: Package,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow aesthetics */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/25 text-white mb-4">
            <Warehouse className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Warehouse Pro WMS
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Hệ thống Quản lý Kho Thông Minh & Phân Quyền Đa Vai Trò
          </p>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/50 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, manager, inbound1, outbound1..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Đang xác thực...</span>
              ) : (
                <>
                  <span>Đăng Nhập Vào Hệ Thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login for Multi-Role Showcase */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Chọn vai trò thử nghiệm nhanh:
              </p>
              <span className="text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/40">
                6 Roles Có Sẵn
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.user}
                    type="button"
                    onClick={() => handleQuickLogin(item.user, item.pass)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${item.color} cursor-pointer group`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.role}</span>
                    </div>
                    <div className="text-[11px] opacity-75 mt-0.5">
                      {item.user} / {item.pass}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
