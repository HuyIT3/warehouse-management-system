import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi, stockApi } from '../api/endpoints';
import type { InventoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal, LoadingSpinner } from '../components/common/CommonComponents';
import {
  ClipboardList,
  Search,
  ArrowUpRight,
  ArrowRightLeft,
  Sliders,
  MapPin,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals for quick stock operations
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);

  // Adjust Form
  const [adjustQty, setAdjustQty] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isAdjustSubmitting, setIsAdjustSubmitting] = useState(false);

  // Transfer Form
  const [transferDestCode, setTransferDestCode] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number | ''>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isTransferSubmitting, setIsTransferSubmitting] = useState(false);

  const { isAdmin } = useAuth();

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const res = await inventoryApi.getAll({ search: search.trim() || undefined });
      if (res.success && res.data) {
        setItems(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadInventory();
  };

  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustQty(item.quantity);
    setAdjustReason('Kiểm kê thực tế ngày ' + new Date().toLocaleDateString('vi-VN'));
    setAdjustError(null);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;

    const qty = typeof adjustQty === 'number' ? adjustQty : 0;
    if (qty < 0) {
      setAdjustError('Số lượng sau điều chỉnh không thể là số âm.');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('Bắt buộc phải nhập lý do điều chỉnh để lưu vết kiểm toán.');
      return;
    }

    setIsAdjustSubmitting(true);
    setAdjustError(null);

    try {
      const res = await stockApi.stockAdjust({
        materialCode: adjustItem.materialCode,
        locationCode: adjustItem.locationCode,
        actualQuantity: qty,
        reason: adjustReason.trim(),
      });

      if (res.success) {
        setAdjustItem(null);
        loadInventory();
      }
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Lỗi điều chỉnh tồn kho.');
    } finally {
      setIsAdjustSubmitting(false);
    }
  };

  const handleOpenTransfer = (item: InventoryItem) => {
    setTransferItem(item);
    setTransferDestCode('');
    setTransferQty(item.quantity > 0 ? Math.min(10, item.quantity) : 1);
    setTransferNote('');
    setTransferError(null);
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItem) return;

    const qty = typeof transferQty === 'number' ? transferQty : 0;
    if (qty <= 0 || qty > transferItem.quantity) {
      setTransferError(`Số lượng chuyển phải từ 1 đến ${transferItem.quantity}.`);
      return;
    }
    if (!transferDestCode.trim()) {
      setTransferError('Vui lòng nhập mã vị trí đích (VD: B01-01).');
      return;
    }

    setIsTransferSubmitting(true);
    setTransferError(null);

    try {
      const res = await stockApi.stockTransfer({
        materialCode: transferItem.materialCode,
        sourceLocationCode: transferItem.locationCode,
        destinationLocationCode: transferDestCode.trim(),
        quantity: qty,
        note: transferNote.trim() || undefined,
      });

      if (res.success) {
        setTransferItem(null);
        loadInventory();
      }
    } catch (err: any) {
      setTransferError(err.response?.data?.message || 'Lỗi chuyển vị trí.');
    } finally {
      setIsTransferSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            <span>Tra Cứu Tồn Kho Chi Tiết</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bảng theo dõi quan hệ Vật tư (Material) 1 — N Tồn kho (Inventory) N — 1 Vị trí (Location)
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã VT, Tên vật tư hoặc Vị trí (A01)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        </form>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải dữ liệu tồn kho..." />
      ) : items.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 text-slate-400 text-sm">
          Không có dữ liệu tồn kho nào.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Mã Vật Tư</th>
                  <th className="py-3.5 px-4 font-semibold">Tên Vật Tư</th>
                  <th className="py-3.5 px-4 font-semibold">Vị Trí Ô Kệ</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Số Lượng Tồn Tại Ô</th>
                  <th className="py-3.5 px-4 font-semibold">Cập Nhật Lần Cuối</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      {item.materialCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{item.materialName}</div>
                      <div className="text-[11px] text-slate-400">ĐVT: {item.unit}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{item.locationDisplayName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono ml-5">
                        Mã ô: {item.locationCode}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-extrabold text-sm text-emerald-400">
                        {item.quantity.toLocaleString('vi-VN')} {item.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/stock-out?code=${item.materialCode}`}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center gap-1"
                          title="Xuất từ ô này"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Xuất
                        </Link>
                        <button
                          onClick={() => handleOpenTransfer(item)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Chuyển vị trí"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="p-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors"
                            title="Điều chỉnh kiểm kê"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Adjust Stock (Audit Trail) */}
      <Modal
        isOpen={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        title={`Điều Chỉnh Kiểm Kê: ${adjustItem?.materialCode}`}
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4">
          {adjustError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {adjustError}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="text-xs text-slate-400">Vật tư:</div>
            <div className="font-bold text-white text-sm">
              [{adjustItem?.materialCode}] {adjustItem?.materialName}
            </div>
            <div className="text-xs text-amber-400 mt-1">Vị trí: {adjustItem?.locationDisplayName}</div>
            <div className="text-xs text-slate-300 mt-1">
              Số lượng trên hệ thống hiện tại:{' '}
              <strong className="text-white">{adjustItem?.quantity}</strong> {adjustItem?.unit}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Số Lượng Kiểm Kê Thực Tế ({adjustItem?.unit})
            </label>
            <input
              type="number"
              min="0"
              value={adjustQty}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                setAdjustQty(isNaN(val as number) ? '' : val);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-lg font-bold text-white text-center"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Lý do điều chỉnh (Bắt buộc kiểm toán)
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="VD: Kiểm kê kho định kỳ tháng 10/2026..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setAdjustItem(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isAdjustSubmitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl font-bold"
            >
              {isAdjustSubmitting ? 'Đang lưu...' : 'Xác Nhận Điều Chỉnh'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Transfer Stock */}
      <Modal
        isOpen={!!transferItem}
        onClose={() => setTransferItem(null)}
        title={`Chuyển Vị Trí Vật Tư: ${transferItem?.materialCode}`}
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4">
          {transferError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {transferError}
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700">
            <div className="text-xs text-slate-400">Vị trí nguồn hiện tại:</div>
            <div className="font-bold text-amber-400 text-sm">{transferItem?.locationDisplayName}</div>
            <div className="text-xs text-slate-300 mt-1">
              Tồn tại nguồn: <strong className="text-white">{transferItem?.quantity}</strong>{' '}
              {transferItem?.unit}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Mã vị trí đích cần chuyển đến (VD: B01-01, A02-02...)
            </label>
            <input
              type="text"
              value={transferDestCode}
              onChange={(e) => setTransferDestCode(e.target.value)}
              placeholder="VD: B01-01"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Số lượng chuyển (Tối đa {transferItem?.quantity})
            </label>
            <input
              type="number"
              min="1"
              max={transferItem?.quantity}
              value={transferQty}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                setTransferQty(isNaN(val as number) ? '' : val);
              }}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-base font-bold text-white text-center"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi chú điều chuyển</label>
            <input
              type="text"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="VD: Sắp xếp lại kho..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setTransferItem(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isTransferSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold"
            >
              {isTransferSubmitting ? 'Đang chuyển...' : 'Xác Nhận Chuyển'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
