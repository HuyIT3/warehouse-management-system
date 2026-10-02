import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventoryApi, stockApi, materialApi } from '../api/endpoints';
import type { MaterialLookup, StockOperationResult, Material } from '../types';
import { Badge } from '../components/common/CommonComponents';
import confetti from 'canvas-confetti';
import {
  Search,
  ArrowUpRight,
  MapPin,
  Package,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const MobileStockOutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [searchCode, setSearchCode] = useState(initialCode);
  const [materialData, setMaterialData] = useState<MaterialLookup | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [note, setNote] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<StockOperationResult | null>(null);

  // Quick materials list for fast tap
  const [quickMaterials, setQuickMaterials] = useState<Material[]>([]);

  useEffect(() => {
    // Load quick list
    materialApi.getAll({ onlyActive: true }).then((res) => {
      if (res.success && res.data) {
        setQuickMaterials(res.data.slice(0, 8));
      }
    });

    if (initialCode) {
      handleLookup(initialCode);
    }
  }, [initialCode]);

  const handleLookup = async (codeToLookup: string) => {
    const code = codeToLookup.trim();
    if (!code) return;

    setIsLoading(true);
    setError(null);
    setSuccessResult(null);
    setMaterialData(null);

    try {
      const res = await inventoryApi.lookup(code);
      if (res.success && res.data) {
        setMaterialData(res.data);
        // Auto-select first available location
        if (res.data.locations.length > 0) {
          setSelectedLocation(res.data.locations[0].locationCode);
        } else {
          setSelectedLocation('');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Không tìm thấy vật tư có mã '${code}'.`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLocationObj = materialData?.locations.find(
    (l) => l.locationCode === selectedLocation
  );
  const availableInLocation = selectedLocationObj?.quantity || 0;
  const isOverStock = typeof quantity === 'number' && quantity > availableInLocation;

  const handleConfirmStockOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialData || !selectedLocation) return;

    const qty = typeof quantity === 'number' ? quantity : 0;
    if (qty <= 0) {
      setError('Vui lòng nhập số lượng cần xuất lớn hơn 0.');
      return;
    }

    if (qty > availableInLocation) {
      setError(`Không đủ tồn kho. Tồn tại ${selectedLocationObj?.locationDisplayName}: ${availableInLocation}, yêu cầu: ${qty}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await stockApi.stockOut({
        materialCode: materialData.materialCode,
        locationCode: selectedLocation,
        quantity: qty,
        note: note.trim() || undefined,
      });

      if (res.success && res.data) {
        setSuccessResult(res.data);
        // Fire celebration confetti
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        } catch {}

        // Reload current material data to update remaining stocks
        await handleLookup(materialData.materialCode);
        setQuantity('');
        setNote('');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          'Xuất kho thất bại. Vui lòng kiểm tra lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMaterialData(null);
    setSearchCode('');
    setSelectedLocation('');
    setQuantity('');
    setNote('');
    setError(null);
    setSuccessResult(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Top Header Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Xuất Vật Tư Khỏi Kho
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold uppercase">
                  Mobile First
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Lấy hàng tại ô kệ, kiểm tra tồn kho tức thì và ghi nhận giao dịch
              </p>
            </div>
          </div>
          {materialData && (
            <button
              onClick={resetForm}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              title="Tìm vật tư khác"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step 1: Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(searchCode);
          }}
          className="mt-4"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Nhập mã vật tư (VD: VT001, VT002...)"
              className="w-full pl-11 pr-28 py-3.5 bg-slate-900/90 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all uppercase"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchCode.trim()}
              className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? 'Đang tìm...' : 'Tra Cứu'}
            </button>
          </div>
        </form>

        {/* Quick tap tags if not looked up yet */}
        {!materialData && (
          <div className="mt-3">
            <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Chạm nhanh mã mẫu:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickMaterials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSearchCode(m.materialCode);
                    handleLookup(m.materialCode);
                  }}
                  className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-medium border border-slate-700 transition-all flex items-center gap-1"
                >
                  <span>{m.materialCode}</span>
                  <span className="text-[10px] text-slate-400">({m.name.split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-3 text-rose-200 text-sm animate-fadeIn">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-rose-300">Không thể thực hiện xuất kho</div>
            <p className="text-xs text-rose-200/90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {successResult && (
        <div className="p-5 rounded-3xl bg-emerald-950/70 border border-emerald-700/60 shadow-xl animate-fadeIn">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-emerald-200 text-base">Xuất kho thành công!</h4>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-emerald-300/90 mt-1">
                Đã xuất <span className="font-bold text-white">{successResult.quantityChanged}</span> vật tư{' '}
                <span className="font-semibold text-white">{successResult.materialName}</span> tại{' '}
                <span className="font-semibold text-white">{successResult.locationDisplayName}</span>.
              </p>

              <div className="mt-3 pt-3 border-t border-emerald-800/50 flex items-center justify-between text-xs">
                <span className="text-emerald-400">Tổng tồn còn lại trong kho:</span>
                <span className="font-bold text-white px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-700">
                  {successResult.remainingTotalStock} cái
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 & 3: Material Information & Location Selection & Quantity Form */}
      {materialData && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 animate-fadeIn">
          {/* Material Header Details */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {materialData.materialCode}
                </span>
                {materialData.isLowStock && (
                  <Badge variant="warning">Sắp hết hàng</Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-1.5">{materialData.name}</h3>
              <p className="text-xs text-slate-400">Đơn vị tính: {materialData.unit}</p>
            </div>

            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Tổng tồn toàn kho
              </span>
              <span className="text-2xl font-extrabold text-blue-400">
                {materialData.totalStock}{' '}
                <span className="text-sm font-normal text-slate-400">{materialData.unit}</span>
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConfirmStockOut} className="space-y-4">
            {/* Step 2: Location Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Chọn Vị Trí Lấy Hàng (Kệ - Tầng - Ô)</span>
              </label>

              {materialData.locations.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
                  Vật tư này hiện không còn tồn ở bất kỳ vị trí nào trong kho.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {materialData.locations.map((loc) => {
                    const isSelected = selectedLocation === loc.locationCode;
                    return (
                      <button
                        key={loc.inventoryId}
                        type="button"
                        onClick={() => setSelectedLocation(loc.locationCode)}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-600/10'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl border ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-100">
                              {loc.locationDisplayName}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              Mã ô: {loc.locationCode}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400">Tồn tại ô này</div>
                          <div className="text-base font-bold text-emerald-400">
                            {loc.quantity} <span className="text-xs">{materialData.unit}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 3: Quantity Input */}
            {selectedLocation && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-400" />
                    <span>Số Lượng Xuất ({materialData.unit})</span>
                  </label>
                  <span className="text-xs text-slate-400">
                    Khả dụng tại ô:{' '}
                    <strong className="text-emerald-400">{availableInLocation}</strong> {materialData.unit}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={availableInLocation}
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      setQuantity(isNaN(val as number) ? '' : val);
                    }}
                    placeholder={`Nhập số lượng (Tối đa ${availableInLocation})`}
                    className={`w-full px-4 py-3.5 bg-slate-900 border rounded-2xl text-xl font-bold text-white placeholder-slate-500 text-center focus:outline-none focus:ring-2 transition-all ${
                      isOverStock
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/30'
                    }`}
                    required
                  />

                  {/* Fast quantity selector chips */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {[1, 5, 10, availableInLocation].map((num, idx) => {
                      if (num <= 0 || num > availableInLocation) return null;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setQuantity(num)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-all"
                        >
                          {num === availableInLocation ? 'Tất cả' : `+${num}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isOverStock && (
                  <p className="text-xs text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Số lượng vượt quá tồn kho hiện tại ({availableInLocation} {materialData.unit}).
                  </p>
                )}
              </div>
            )}

            {/* Note */}
            {selectedLocation && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Ghi chú mục đích xuất (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Lắp ráp chuyền máy #3, thi công tủ điện..."
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Step 4: Confirm Button */}
            {selectedLocation && (
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !quantity ||
                  quantity <= 0 ||
                  isOverStock ||
                  availableInLocation <= 0
                }
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 active:scale-[0.99] text-white font-extrabold text-base rounded-2xl shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 disabled:pointer-events-none uppercase tracking-wide"
              >
                {isSubmitting ? (
                  <span>Đang xử lý xuất kho...</span>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5" />
                    <span>XÁC NHẬN XUẤT {quantity ? `${quantity} ${materialData.unit}` : 'KHO'}</span>
                  </>
                )}
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
