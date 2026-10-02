import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { materialApi, locationApi, stockApi } from '../api/endpoints';
import type { Material, WarehouseLocation, StockOperationResult } from '../types';
import confetti from 'canvas-confetti';
import {
  ArrowDownLeft,
  MapPin,
  PackagePlus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  PlusCircle,
} from 'lucide-react';
import { Modal } from '../components/common/CommonComponents';

export const MobileStockInPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);

  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>(initialCode);
  const [selectedLocationCode, setSelectedLocationCode] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<StockOperationResult | null>(null);

  // Quick Material & Location Creation Modals
  const [isQuickMatOpen, setIsQuickMatOpen] = useState(false);
  const [quickMatData, setQuickMatData] = useState({
    materialCode: '',
    name: '',
    unit: 'Cái',
    minStock: 10,
    category: 'Kim khí',
    description: '',
  });
  const [isCreatingMat, setIsCreatingMat] = useState(false);

  const [isQuickLocOpen, setIsQuickLocOpen] = useState(false);
  const [quickLocData, setQuickLocData] = useState({
    locationCode: 'D01-01',
    rack: 'D',
    level: 1,
    slot: '01',
    description: '',
  });
  const [isCreatingLoc, setIsCreatingLoc] = useState(false);

  const loadData = async () => {
    try {
      const [matRes, locRes] = await Promise.all([
        materialApi.getAll({ onlyActive: true }),
        locationApi.getAll({ onlyActive: true }),
      ]);
      if (matRes.success && matRes.data) setMaterials(matRes.data);
      if (locRes.success && locRes.data) setLocations(locRes.data);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedMaterial = materials.find(
    (m) => m.materialCode.toLowerCase() === selectedMaterialCode.toLowerCase()
  );

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialCode || !selectedLocationCode) {
      setError('Vui lòng chọn vật tư và vị trí kho nhập.');
      return;
    }

    const qty = typeof quantity === 'number' ? quantity : 0;
    if (qty <= 0) {
      setError('Số lượng nhập kho phải lớn hơn 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await stockApi.stockIn({
        materialCode: selectedMaterialCode,
        locationCode: selectedLocationCode,
        quantity: qty,
        note: note.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessResult(res.data);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}

        setQuantity('');
        setNote('');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          'Nhập kho thất bại. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenQuickMat = () => {
    const nextCode = `VT${(materials.length + 1).toString().padStart(3, '0')}`;
    setQuickMatData({
      materialCode: nextCode,
      name: '',
      unit: 'Cái',
      minStock: 10,
      category: 'Kim khí',
      description: '',
    });
    setIsQuickMatOpen(true);
  };

  const handleSaveQuickMat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMatData.materialCode.trim() || !quickMatData.name.trim()) {
      alert('Vui lòng nhập mã và tên vật tư.');
      return;
    }

    setIsCreatingMat(true);
    try {
      const res = await materialApi.create(quickMatData);
      if (res.success && res.data) {
        await loadData();
        setSelectedMaterialCode(res.data.materialCode);
        setIsQuickMatOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo vật tư mới.');
    } finally {
      setIsCreatingMat(false);
    }
  };

  const handleOpenQuickLoc = () => {
    setQuickLocData({
      locationCode: 'D01-01',
      rack: 'D',
      level: 1,
      slot: '01',
      description: 'Khu vực kệ mới tạo',
    });
    setIsQuickLocOpen(true);
  };

  const handleSaveQuickLoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLocData.locationCode.trim()) {
      alert('Vui lòng nhập mã vị trí kệ.');
      return;
    }

    setIsCreatingLoc(true);
    try {
      const res = await locationApi.create(quickLocData);
      if (res.success && res.data) {
        await loadData();
        setSelectedLocationCode(res.data.locationCode);
        setIsQuickLocOpen(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo vị trí kệ mới.');
    } finally {
      setIsCreatingLoc(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Nhập Hàng Vào Kho</h2>
            <p className="text-xs text-slate-400">
              Cập nhật số lượng vật tư mới về hoặc tạo nhanh mã vật tư/kệ mới khi nhập hàng
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-3 text-rose-200 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-300">Lỗi nhập kho</div>
            <p className="text-xs text-rose-200/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successResult && (
        <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-700/60 shadow-xl">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-emerald-200 text-base">Nhập kho thành công!</h4>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-300/90 mt-1">
                Đã nhập thêm +<span className="font-bold text-white">{successResult.quantityChanged}</span> vật tư{' '}
                <span className="font-semibold text-white">{successResult.materialName}</span> vào ô{' '}
                <span className="font-semibold text-white">{successResult.locationDisplayName}</span>.
              </p>
              <div className="mt-3 pt-3 border-t border-emerald-800/50 flex items-center justify-between text-xs">
                <span className="text-emerald-400">Tổng tồn sau khi nhập:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-700">
                  {successResult.remainingTotalStock}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleStockIn} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        {/* Material Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Chọn Vật Tư Nhập Kho
            </label>
            <button
              type="button"
              onClick={handleOpenQuickMat}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-800/40 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tạo mã mới</span>
            </button>
          </div>
          <select
            value={selectedMaterialCode}
            onChange={(e) => {
              if (e.target.value === '__NEW__') {
                handleOpenQuickMat();
              } else {
                setSelectedMaterialCode(e.target.value);
              }
            }}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">-- Chọn vật tư cần nhập --</option>
            {materials.map((m) => (
              <option key={m.id} value={m.materialCode}>
                [{m.materialCode}] {m.name} ({m.unit})
              </option>
            ))}
            <option value="__NEW__" className="text-blue-400 font-bold">
              ✨ + Tạo mã vật tư mới ngay...
            </option>
          </select>
        </div>

        {/* Location Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              2. Vị Trí Ô Kệ Lưu Trữ
            </label>
            <button
              type="button"
              onClick={handleOpenQuickLoc}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/40 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Tạo kệ mới</span>
            </button>
          </div>
          <select
            value={selectedLocationCode}
            onChange={(e) => {
              if (e.target.value === '__NEW__') {
                handleOpenQuickLoc();
              } else {
                setSelectedLocationCode(e.target.value);
              }
            }}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">-- Chọn ô kệ nhập hàng --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.locationCode}>
                {loc.displayName} ({loc.locationCode})
              </option>
            ))}
            <option value="__NEW__" className="text-emerald-400 font-bold">
              ✨ + Tạo vị trí ô kệ mới ngay...
            </option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            3. Số Lượng Nhập {selectedMaterial && `(${selectedMaterial.unit})`}
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Nhập số lượng..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm font-bold focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            4. Ghi Chú / Nguồn Gốc Lô Hàng
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="VD: Nhập thêm từ nhà cung cấp, thu hồi công trình..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <PackagePlus className="w-5 h-5" />
          <span>{isSubmitting ? 'Đang cập nhật tồn kho...' : 'Xác Nhận Nhập Hàng Vào Kho'}</span>
        </button>
      </form>

      {/* SUB-MODAL: Tạo Nhanh Vật Tư */}
      <Modal
        isOpen={isQuickMatOpen}
        onClose={() => setIsQuickMatOpen(false)}
        title="✨ Tạo Nhanh Mã Vật Tư Mới"
        size="md"
      >
        <form onSubmit={handleSaveQuickMat} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Vật Tư *</label>
              <input
                type="text"
                value={quickMatData.materialCode}
                onChange={(e) => setQuickMatData({ ...quickMatData, materialCode: e.target.value.toUpperCase() })}
                placeholder="VT009..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Đơn Vị Tính *</label>
              <select
                value={quickMatData.unit}
                onChange={(e) => setQuickMatData({ ...quickMatData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
              >
                <option value="Cái">Cái</option>
                <option value="Bộ">Bộ</option>
                <option value="Mét">Mét</option>
                <option value="Cây">Cây</option>
                <option value="Cuộn">Cuộn</option>
                <option value="Kg">Kg</option>
                <option value="Hộp">Hộp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên Vật Tư *</label>
            <input
              type="text"
              value={quickMatData.name}
              onChange={(e) => setQuickMatData({ ...quickMatData, name: e.target.value })}
              placeholder="Tên vật tư, linh kiện..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickMatOpen(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreatingMat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              {isCreatingMat ? 'Đang tạo...' : 'Lưu & Chọn Ngay'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUB-MODAL: Tạo Nhanh Vị Trí Kệ */}
      <Modal
        isOpen={isQuickLocOpen}
        onClose={() => setIsQuickLocOpen(false)}
        title="📍 Tạo Nhanh Vị Trí Kệ Mới"
        size="md"
      >
        <form onSubmit={handleSaveQuickLoc} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dãy / Kệ</label>
              <input
                type="text"
                value={quickLocData.rack}
                onChange={(e) => {
                  const r = e.target.value.toUpperCase();
                  const locCode = `${r}${quickLocData.level.toString().padStart(2, '0')}-${quickLocData.slot}`;
                  setQuickLocData({ ...quickLocData, rack: r, locationCode: locCode });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase font-bold text-center"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tầng</label>
              <input
                type="number"
                min="1"
                max="10"
                value={quickLocData.level}
                onChange={(e) => {
                  const lvl = Number(e.target.value);
                  const locCode = `${quickLocData.rack}${lvl.toString().padStart(2, '0')}-${quickLocData.slot}`;
                  setQuickLocData({ ...quickLocData, level: lvl, locationCode: locCode });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold text-center"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ô / Slot</label>
              <input
                type="text"
                value={quickLocData.slot}
                onChange={(e) => {
                  const sl = e.target.value;
                  const locCode = `${quickLocData.rack}${quickLocData.level.toString().padStart(2, '0')}-${sl}`;
                  setQuickLocData({ ...quickLocData, slot: sl, locationCode: locCode });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold text-center"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mã Vị Trí Kệ *</label>
            <input
              type="text"
              value={quickLocData.locationCode}
              onChange={(e) => setQuickLocData({ ...quickLocData, locationCode: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickLocOpen(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreatingLoc}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {isCreatingLoc ? 'Đang tạo...' : 'Lưu & Chọn Ngay'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
