import React, { useState, useEffect } from 'react';
import { locationApi } from '../api/endpoints';
import type { WarehouseLocation } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal, LoadingSpinner } from '../components/common/CommonComponents';
import { MapPin, Plus, Layers, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);
  const [detailLocation, setDetailLocation] = useState<WarehouseLocation | null>(null);
  const [activeRack, setActiveRack] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Create / Edit
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    locationCode: '',
    rack: 'A',
    level: 1,
    slot: '01',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAdmin } = useAuth();

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const res = await locationApi.getAll();
      if (res.success && res.data) {
        setLocations(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleSelectSlot = async (loc: WarehouseLocation) => {
    setSelectedLocation(loc);
    try {
      const res = await locationApi.getById(loc.id);
      if (res.success && res.data) {
        setDetailLocation(res.data);
      }
    } catch {
      setDetailLocation(loc);
    }
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await locationApi.create(formData);
      if (res.success) {
        setIsCreateOpen(false);
        loadLocations();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Lỗi tạo vị trí.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group locations by Rack
  const racks = Array.from(new Set(locations.map((l) => l.rack))).sort();

  const filteredLocations =
    activeRack === 'ALL' ? locations : locations.filter((l) => l.rack === activeRack);

  // Group filtered locations by Rack then Level
  const groupedByRackAndLevel = filteredLocations.reduce((acc, loc) => {
    if (!acc[loc.rack]) acc[loc.rack] = {};
    if (!acc[loc.rack][loc.level]) acc[loc.rack][loc.level] = [];
    acc[loc.rack][loc.level].push(loc);
    return acc;
  }, {} as Record<string, Record<number, WarehouseLocation[]>>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <MapPin className="w-8 h-8 text-amber-500" />
            <span>Sơ Đồ Vị Trí Ô Kệ Kho</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Trực quan hóa cấu trúc Kệ (Rack) - Tầng (Level) - Ô chứa (Slot) và tình trạng lưu trữ
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setFormData({ locationCode: '', rack: 'A', level: 1, slot: '01', description: '' });
              setFormError(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Vị Trí Kho</span>
          </button>
        )}
      </div>

      {/* Rack Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveRack('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeRack === 'ALL'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
          }`}
        >
          Tất Cả Kệ ({locations.length} ô)
        </button>
        {racks.map((r) => (
          <button
            key={r}
            onClick={() => setActiveRack(r)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeRack === r
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Kệ {r} ({locations.filter((l) => l.rack === r).length} ô)
          </button>
        ))}
      </div>

      {/* Rack Visualization */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải sơ đồ kệ kho..." />
      ) : (
        <div className="space-y-6">
          {Object.keys(groupedByRackAndLevel).map((rackKey) => (
            <div
              key={rackKey}
              className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400 font-extrabold text-base">
                    KỆ {rackKey}
                  </div>
                  <span className="text-xs text-slate-400">
                    Khu vực lưu trữ tiêu chuẩn Kệ {rackKey}
                  </span>
                </div>
              </div>

              {/* Levels in this Rack */}
              <div className="space-y-3">
                {Object.keys(groupedByRackAndLevel[rackKey])
                  .sort((a, b) => parseInt(b) - parseInt(a)) // Top level to bottom level
                  .map((levelStr) => {
                    const lvl = parseInt(levelStr);
                    const slotsInLevel = groupedByRackAndLevel[rackKey][lvl].sort((a, b) =>
                      a.slot.localeCompare(b.slot)
                    );

                    return (
                      <div
                        key={lvl}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center gap-3"
                      >
                        <div className="md:w-28 shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-300">
                          <Layers className="w-4 h-4 text-blue-400" />
                          <span>TẦNG {lvl}</span>
                        </div>

                        {/* Slots in this Level */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 flex-1">
                          {slotsInLevel.map((slotLoc) => {
                            const isOccupied = slotLoc.totalQuantityStored > 0;
                            const isSelected = selectedLocation?.id === slotLoc.id;

                            return (
                              <button
                                key={slotLoc.id}
                                type="button"
                                onClick={() => handleSelectSlot(slotLoc)}
                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                  isSelected
                                    ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500'
                                    : isOccupied
                                    ? 'bg-slate-900/90 border-slate-700/80 hover:border-blue-500/50'
                                    : 'bg-slate-900/40 border-slate-800/60 hover:border-slate-700 opacity-60'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-bold text-xs text-slate-200">
                                    Ô {slotLoc.slot}
                                  </span>
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isOccupied ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-600'
                                    }`}
                                  />
                                </div>

                                <div className="mt-2">
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {slotLoc.locationCode}
                                  </div>
                                  <div className="text-xs font-bold text-slate-100 mt-0.5">
                                    {isOccupied ? (
                                      <span className="text-emerald-400">
                                        {slotLoc.totalQuantityStored.toLocaleString('vi-VN')} sp
                                      </span>
                                    ) : (
                                      <span className="text-slate-500 text-[11px]">Trống</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer / Modal: Location Shelf Contents Detail */}
      <Modal
        isOpen={!!detailLocation}
        onClose={() => {
          setDetailLocation(null);
          setSelectedLocation(null);
        }}
        title={`Chi Tiết Vị Trí: ${detailLocation?.displayName} (${detailLocation?.locationCode})`}
        maxWidth="lg"
      >
        {detailLocation && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Số loại vật tư lưu trữ
                </span>
                <div className="text-lg font-bold text-white">
                  {detailLocation.totalStoredItems || detailLocation.storedMaterials?.length || 0} loại
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Tổng số lượng vật tư
                </span>
                <div className="text-lg font-bold text-emerald-400">
                  {detailLocation.totalQuantityStored} cái / đơn vị
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Danh sách vật tư đang nằm tại ô này:
              </h4>

              {!detailLocation.storedMaterials || detailLocation.storedMaterials.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                  Ô kệ này hiện đang trống, chưa có vật tư nào.
                </div>
              ) : (
                <div className="space-y-2">
                  {detailLocation.storedMaterials.map((item) => (
                    <div
                      key={item.inventoryId}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {item.materialCode}
                          </span>
                          <span className="text-xs font-bold text-slate-100">{item.materialName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Đơn vị tính: {item.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-emerald-400">
                          {item.quantity} {item.unit}
                        </span>
                        <Link
                          to={`/stock-out?code=${item.materialCode}`}
                          className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all"
                          title="Xuất vật tư này"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Location */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm Vị Trí Kho Mới"
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mã vị trí (VD: A01-01, B02-03...)
            </label>
            <input
              type="text"
              value={formData.locationCode}
              onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
              placeholder="VD: A01-04"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kệ (Rack)</label>
              <input
                type="text"
                value={formData.rack}
                onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                placeholder="A, B, C..."
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tầng (Level)</label>
              <input
                type="number"
                min="1"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ô (Slot)</label>
              <input
                type="text"
                value={formData.slot}
                onChange={(e) => setFormData({ ...formData, slot: e.target.value })}
                placeholder="01, 02..."
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả khu vực</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Khu vực linh kiện điện, khay chống tĩnh điện..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu Vị Trí'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
