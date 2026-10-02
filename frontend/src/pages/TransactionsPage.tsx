import React, { useState, useEffect } from 'react';
import { transactionApi } from '../api/endpoints';
import type { StockTransaction, PagedResult } from '../types';
import { Badge, LoadingSpinner } from '../components/common/CommonComponents';
import {
  History,
  Download,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [result, setResult] = useState<PagedResult<StockTransaction> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [materialCode, setMaterialCode] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const [transactionType, setTransactionType] = useState<string>('');
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionApi.getTransactions({
        materialCode: materialCode.trim() || undefined,
        locationCode: locationCode.trim() || undefined,
        transactionType: transactionType || undefined,
        pageNumber,
        pageSize,
      });
      if (res.success && res.data) {
        setResult(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [pageNumber, transactionType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPageNumber(1);
    loadTransactions();
  };

  const handleExportCsv = () => {
    const params: Record<string, string> = {};
    if (materialCode.trim()) params.materialCode = materialCode.trim();
    if (locationCode.trim()) params.locationCode = locationCode.trim();
    if (transactionType) params.transactionType = transactionType;

    const url = transactionApi.exportCsvUrl(params);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-purple-400" />
            <span>Nhật Ký Biến Động Kho (Audit Trail)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ghi nhận toàn bộ vết nhập, xuất, kiểm kê điều chỉnh và luân chuyển vị trí
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 shadow-lg transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Xuất File CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <input
              type="text"
              value={materialCode}
              onChange={(e) => setMaterialCode(e.target.value)}
              placeholder="Mã / Tên vật tư..."
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <input
              type="text"
              value={locationCode}
              onChange={(e) => setLocationCode(e.target.value)}
              placeholder="Vị trí kho (VD: A01)..."
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value);
                setPageNumber(1);
              }}
              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Tất cả loại giao dịch --</option>
              <option value="IN">Nhập kho (IN)</option>
              <option value="OUT">Xuất kho (OUT)</option>
              <option value="ADJUSTMENT">Điều chỉnh kiểm kê (ADJUSTMENT)</option>
              <option value="TRANSFER">Chuyển vị trí (TRANSFER)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              Lọc Dữ Liệu
            </button>
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải lịch sử giao dịch..." />
      ) : !result || result.items.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 text-slate-400 text-sm">
          Không tìm thấy giao dịch nào.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Thời Gian</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Loại GD</th>
                    <th className="py-3.5 px-4 font-semibold">Vật Tư</th>
                    <th className="py-3.5 px-4 font-semibold">Vị Trí Kho</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Số Lượng</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Biến Động Tồn</th>
                    <th className="py-3.5 px-4 font-semibold">Người Thực Hiện</th>
                    <th className="py-3.5 px-4 font-semibold">Ghi Chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.items.map((tx) => {
                    const isOut = tx.transactionType === 'OUT';
                    const isIn = tx.transactionType === 'IN';
                    const isAdj = tx.transactionType === 'ADJUSTMENT';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          <div>
                            {new Date(tx.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={
                              isOut ? 'warning' : isIn ? 'success' : isAdj ? 'danger' : 'info'
                            }
                          >
                            {tx.transactionType}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-blue-400">{tx.materialCode}</div>
                          <div className="font-medium text-slate-200 text-xs line-clamp-1">
                            {tx.materialName}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{tx.locationDisplayName}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono ml-4.5">
                            {tx.locationCode}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-sm">
                          <span
                            className={
                              isOut
                                ? 'text-amber-400'
                                : isIn
                                ? 'text-emerald-400'
                                : isAdj
                                ? 'text-purple-400'
                                : 'text-blue-400'
                            }
                          >
                            {isOut
                              ? `-${tx.quantity}`
                              : isIn
                              ? `+${tx.quantity}`
                              : isAdj
                              ? `±${tx.quantity}`
                              : `${tx.quantity}`}{' '}
                            <span className="text-xs font-normal text-slate-400">{tx.unit}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                          {tx.beforeQuantity} → <strong className="text-white">{tx.afterQuantity}</strong>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-200">{tx.userFullName}</div>
                          <div className="text-[10px] text-slate-500">@{tx.userName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 text-xs italic max-w-xs truncate">
                          {tx.note || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs text-slate-400">
              Hiển thị trang <strong>{result.pageNumber}</strong> / <strong>{result.totalPages}</strong> (Tổng cộng {result.totalCount} giao dịch)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={!result.hasPreviousPage}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!result.hasNextPage}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
