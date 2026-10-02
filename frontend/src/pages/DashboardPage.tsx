import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import type { DashboardSummary } from '../types';
import { StatCard, Badge, LoadingSpinner } from '../components/common/CommonComponents';
import {
  Boxes,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getSummary()
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Đang tải dữ liệu tổng quan kho..." />;
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-slate-400">
        Không thể tải dữ liệu thống kê. Vui lòng thử lại.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Tổng Quan Hệ Thống Kho
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi trạng thái tồn kho, biến động nhập xuất và cảnh báo định mức
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/stock-out"
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-600/20 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Xuất Kho Nhanh</span>
          </Link>
          <Link
            to="/stock-in"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Nhập Kho</span>
          </Link>
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Tổng Loại Vật Tư"
          value={data.totalMaterials}
          subtitle="Vật tư đang hoạt động"
          icon={Boxes}
          color="blue"
        />

        <StatCard
          title="Tổng Lượng Tồn Kho"
          value={data.totalInventoryQuantity}
          subtitle={`Phân bổ trên ${data.occupiedLocationsCount}/${data.totalLocations} ô kệ`}
          icon={Package}
          color="emerald"
        />

        <StatCard
          title="Cảnh Báo Sắp Hết"
          value={data.totalLowStockCount}
          subtitle="Dưới định mức MinStock"
          icon={AlertTriangle}
          color={data.totalLowStockCount > 0 ? 'rose' : 'emerald'}
        />

        <StatCard
          title="Xuất Trong Ngày"
          value={data.todayStockOutQuantity}
          subtitle={`${data.todayTransactionsCount} lượt giao dịch hôm nay`}
          icon={ArrowUpRight}
          color="amber"
        />
      </div>

      {/* Grid: Low Stock Alert & 7 Days Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts (Takes 1 column) */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Vật Tư Sắp Hết Hàng</h3>
                  <p className="text-[11px] text-slate-400">Cần ưu tiên tạo đơn nhập hàng</p>
                </div>
              </div>
              <Badge variant={data.lowStockAlerts.length > 0 ? 'danger' : 'success'}>
                {data.lowStockAlerts.length} mục
              </Badge>
            </div>

            {data.lowStockAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
                <span>Tất cả vật tư đều đạt định mức an toàn.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.lowStockAlerts.map((item) => (
                  <div
                    key={item.materialId}
                    className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400">
                          {item.materialCode}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Định mức min: {item.minStock} {item.unit}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="text-xs text-rose-400 font-bold">
                          Còn {item.currentStock} {item.unit}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Thiếu {item.minStock - item.currentStock}
                        </div>
                      </div>
                      <Link
                        to={`/stock-in?code=${item.materialCode}`}
                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                        title="Nhập thêm"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800/80 text-right">
            <Link
              to="/materials?lowStockOnly=true"
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
            >
              Xem toàn bộ danh sách thiếu hàng <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 7 Days Movement Trend (Takes 2 columns) */}
        <div className="lg:col-span-2 glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Xu Hướng Xuất / Nhập 7 Ngày Qua</h3>
                  <p className="text-[11px] text-slate-400">Khối lượng vật tư luân chuyển theo ngày</p>
                </div>
              </div>
            </div>

            {/* 7 Days Bar Representation */}
            <div className="grid grid-cols-7 gap-2 pt-4 items-end h-44">
              {data.last7DaysActivity.map((day, idx) => {
                const maxVal = Math.max(
                  ...data.last7DaysActivity.map((d) => Math.max(d.inQuantity, d.outQuantity, 10))
                );
                const inHeight = Math.max(8, (day.inQuantity / maxVal) * 120);
                const outHeight = Math.max(8, (day.outQuantity / maxVal) * 120);

                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1 w-full justify-center">
                      {/* In bar */}
                      <div
                        style={{ height: `${inHeight}px` }}
                        className="w-3 sm:w-5 bg-gradient-to-t from-blue-700 to-blue-400 rounded-t-md relative group-hover:brightness-125 transition-all"
                        title={`Nhập: +${day.inQuantity}`}
                      />
                      {/* Out bar */}
                      <div
                        style={{ height: `${outHeight}px` }}
                        className="w-3 sm:w-5 bg-gradient-to-t from-amber-700 to-amber-400 rounded-t-md relative group-hover:brightness-125 transition-all"
                        title={`Xuất: -${day.outQuantity}`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">{day.date}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-slate-300">Nhập kho (+IN)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-slate-300">Xuất kho (-OUT)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Lịch Sử Biến Động Gần Nhất</h3>
              <p className="text-[11px] text-slate-400">Nhật ký kiểm toán thời gian thực</p>
            </div>
          </div>
          <Link
            to="/transactions"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Thời gian</th>
                <th className="pb-3 font-semibold">Loại</th>
                <th className="pb-3 font-semibold">Mã & Tên vật tư</th>
                <th className="pb-3 font-semibold">Vị trí</th>
                <th className="pb-3 font-semibold text-right">Số lượng</th>
                <th className="pb-3 font-semibold text-center">Trước → Sau</th>
                <th className="pb-3 font-semibold">Thực hiện</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.recentTransactions.map((tx) => {
                const isOut = tx.type === 'OUT';
                const isIn = tx.type === 'IN';
                const isAdj = tx.type === 'ADJUSTMENT';

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      <span className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          isOut ? 'warning' : isIn ? 'info' : isAdj ? 'neutral' : 'success'
                        }
                      >
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="font-mono font-bold text-slate-200">{tx.materialCode}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{tx.materialName}</div>
                    </td>
                    <td className="py-3 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{tx.locationDisplayName}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold">
                      <span className={isOut ? 'text-amber-400' : isIn ? 'text-emerald-400' : 'text-blue-400'}>
                        {isOut ? `-${tx.quantity}` : isIn ? `+${tx.quantity}` : `${tx.quantity}`}
                      </span>
                    </td>
                    <td className="py-3 text-center text-slate-400 font-mono text-[11px]">
                      {tx.beforeQuantity} → <strong className="text-white">{tx.afterQuantity}</strong>
                    </td>
                    <td className="py-3 text-slate-300 font-medium">{tx.userFullName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
