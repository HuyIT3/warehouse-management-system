import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { materialApi } from '../api/endpoints';
import type { Material, MaterialStockSummary } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge, Modal, LoadingSpinner } from '../components/common/CommonComponents';
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  MapPin,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

export const MaterialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lowStockParam = searchParams.get('lowStockOnly') === 'true';

  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(lowStockParam);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [summaryMaterial, setSummaryMaterial] = useState<MaterialStockSummary | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    materialCode: '',
    name: '',
    unit: 'Cái',
    minStock: 10,
    category: '',
    description: '',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isAdmin, isManager, isInboundStaff } = useAuth();
  const canManage = isAdmin || isManager || isInboundStaff;

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const res = await materialApi.getAll({
        search: search.trim() || undefined,
        lowStockOnly: lowStockOnly || undefined,
      });
      if (res.success && res.data) {
        setMaterials(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMaterials();
  };

  const handleOpenCreate = () => {
    setFormData({
      materialCode: '',
      name: '',
      unit: 'Cái',
      minStock: 10,
      category: '',
      description: '',
      isActive: true,
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (m: Material) => {
    setEditingMaterial(m);
    setFormData({
      materialCode: m.materialCode,
      name: m.name,
      unit: m.unit,
      minStock: m.minStock,
      category: m.category || '',
      description: m.description || '',
      isActive: m.isActive,
    });
    setFormError(null);
  };

  const handleViewSummary = async (code: string) => {
    try {
      const res = await materialApi.getStockSummary(code);
      if (res.success && res.data) {
        setSummaryMaterial(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tải phân bổ tồn kho.');
    }
  };

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await materialApi.create(formData);
      if (res.success) {
        setIsCreateOpen(false);
        loadMaterials();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Lỗi tạo vật tư.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await materialApi.update(editingMaterial.id, {
        materialCode: formData.materialCode.trim().toUpperCase(),
        name: formData.name,
        unit: formData.unit,
        minStock: formData.minStock,
        category: formData.category,
        description: formData.description,
        isActive: formData.isActive,
      });
      if (res.success) {
        setEditingMaterial(null);
        loadMaterials();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Lỗi cập nhật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (m: Material) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vật tư '${m.materialCode}' (${m.name})?`)) return;
    try {
      const res = await materialApi.delete(m.id);
      if (res.success) {
        loadMaterials();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa vật tư.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Boxes className="w-8 h-8 text-blue-500" />
            <span>Danh Mục Vật Tư</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản lý mã vật tư, quy cách đơn vị tính và định mức tồn kho tối thiểu (MinStock)
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Vật Tư Mới</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo Mã (VT001), Tên vật tư..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        </form>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLowStockOnly((prev) => !prev);
              setSearchParams(lowStockOnly ? {} : { lowStockOnly: 'true' });
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              lowStockOnly
                ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-md shadow-rose-950/50'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Chỉ xem sắp hết hàng</span>
          </button>
        </div>
      </div>

      {/* Materials Table */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải danh sách vật tư..." />
      ) : materials.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800 text-slate-400 text-sm">
          Không tìm thấy vật tư nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Mã Vật Tư</th>
                  <th className="py-3.5 px-4 font-semibold">Tên Vật Tư & Danh Mục</th>
                  <th className="py-3.5 px-4 font-semibold">ĐVT</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Min Stock</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Tổng Tồn Kho</th>
                  <th className="py-3.5 px-4 font-semibold text-center">Trạng Thái Tồn</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-sm text-blue-400">{m.materialCode}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 text-sm">{m.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        {m.category && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {m.category}
                          </span>
                        )}
                        {m.description && <span className="line-clamp-1">{m.description}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{m.unit}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">{m.minStock}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewSummary(m.materialCode)}
                        className="font-extrabold text-sm text-white hover:text-blue-400 underline decoration-dotted transition-colors"
                        title="Xem chi tiết các ô lưu trữ"
                      >
                        {m.totalStock.toLocaleString('vi-VN')} {m.unit}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {m.isLowStock ? (
                        <Badge variant="danger">Thiếu {m.minStock - m.totalStock}</Badge>
                      ) : (
                        <Badge variant="success">An toàn</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewSummary(m.materialCode)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Xem vị trí lưu kho"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/stock-out?code=${m.materialCode}`}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                          title="Xuất kho"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/stock-in?code=${m.materialCode}`}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                          title="Nhập kho"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        </Link>

                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Chỉnh sửa mã & thông tin vật tư"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(m)}
                            className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                            title="Xóa vật tư"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal: View Stock Summary Breakdown by Shelf */}
      <Modal
        isOpen={!!summaryMaterial}
        onClose={() => setSummaryMaterial(null)}
        title={`Vị Trí Lưu Kho: ${summaryMaterial?.materialCode} - ${summaryMaterial?.name}`}
        maxWidth="lg"
      >
        {summaryMaterial && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div>
                <span className="text-xs text-slate-400">Tổng tồn khả dụng</span>
                <div className="text-xl font-bold text-blue-400">
                  {summaryMaterial.totalStock} {summaryMaterial.unit}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Định mức MinStock</span>
                <div className="text-base font-semibold text-slate-200">
                  {summaryMaterial.minStock} {summaryMaterial.unit}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Phân bổ trên các ô kệ (Locations):
              </h4>
              {summaryMaterial.locations.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  Vật tư này hiện chưa được xếp vào ô kho nào.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {summaryMaterial.locations.map((loc) => (
                    <div
                      key={loc.inventoryId}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <div>
                          <span className="font-bold text-sm text-slate-100">
                            {loc.displayName}
                          </span>
                          <span className="text-xs text-slate-500 ml-2 font-mono">
                            [{loc.locationCode}]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-emerald-400">
                          {loc.quantity} {summaryMaterial.unit}
                        </span>
                        <Link
                          to={`/stock-out?code=${summaryMaterial.materialCode}`}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Xuất
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

      {/* Modal: Create Material */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm Mới Vật Tư Vào Danh Mục"
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {formError}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Mã vật tư (Nhập tay tự do)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Tùy biến 100%</span>
            </div>
            <input
              type="text"
              value={formData.materialCode}
              onChange={(e) => setFormData({ ...formData, materialCode: e.target.value.toUpperCase() })}
              placeholder="VD: SKF-6204-2RSH, SCH-LC1D25, BL-INOX-M8X30, VT009..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono font-bold tracking-wide focus:outline-none focus:border-blue-500 uppercase"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Nhập mã linh kiện thực tế, mã phụ tùng OEM hoặc quy ước mã số của công ty.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên vật tư (Bắt buộc)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Đai ốc tự hãm M10 Inox..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Đơn vị tính (ĐVT)</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="VD: Cái, Mét, Cuộn..."
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Định mức MinStock</label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nhóm / Danh mục</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="VD: Kim khí, Thiết bị điện, Tự động hóa..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả quy cách</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tiêu chuẩn kỹ thuật, xuất xứ..."
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu Vật Tư'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Material */}
      <Modal
        isOpen={!!editingMaterial}
        onClose={() => setEditingMaterial(null)}
        title={`Chỉnh Sửa Vật Tư: ${editingMaterial?.materialCode}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {formError}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Mã vật tư (Nhập tay / Tự do sửa đổi)
              </label>
              <span className="text-[10px] text-blue-400 font-mono">Nhập tay tự do</span>
            </div>
            <input
              type="text"
              value={formData.materialCode}
              onChange={(e) => setFormData({ ...formData, materialCode: e.target.value.toUpperCase() })}
              placeholder="VD: SKF-6204-2RSH, SCH-LC1D25, BULONG-M8X30..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono font-bold tracking-wide focus:outline-none focus:border-blue-500 uppercase"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Hệ thống cho phép tự nhập mã mới hoặc đổi mã theo quy ước mã hóa thực tế của doanh nghiệp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên vật tư</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Đơn vị tính</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Định mức MinStock</label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nhóm / Danh mục</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <label htmlFor="isActive" className="text-xs text-slate-300 font-medium">
              Vật tư đang hoạt động (Active)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingMaterial(null)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold"
            >
              {isSubmitting ? 'Đang lưu...' : 'Cập Nhật'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
