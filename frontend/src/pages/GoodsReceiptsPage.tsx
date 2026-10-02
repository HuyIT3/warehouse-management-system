import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptsApi, materialApi, locationApi } from '../api/endpoints';
import type {
  GoodsReceipt,
  GoodsReceiptStatus,
  CreateGoodsReceiptRequest,
  CreateGoodsReceiptItemRequest,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Printer,
  Trash2,
  DollarSign,
  Boxes,
  PlusCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { Modal, LoadingSpinner } from '../components/common/CommonComponents';

export const GoodsReceiptsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isInboundStaff } = useAuth();

  // Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoodsReceiptStatus | ''>('');
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceipt | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Quick Material / Location Creation State
  const [isQuickMaterialOpen, setIsQuickMaterialOpen] = useState(false);
  const [quickMaterialRowIndex, setQuickMaterialRowIndex] = useState<number | null>(null);
  const [quickMaterialData, setQuickMaterialData] = useState({
    materialCode: '',
    name: '',
    unit: 'Cái',
    minStock: 10,
    category: 'Kim khí',
    description: '',
  });
  const [isCreatingQuickMat, setIsCreatingQuickMat] = useState(false);

  const [isQuickLocationOpen, setIsQuickLocationOpen] = useState(false);
  const [quickLocationRowIndex, setQuickLocationRowIndex] = useState<number | null>(null);
  const [quickLocationData, setQuickLocationData] = useState({
    locationCode: 'D01-01',
    rack: 'D',
    level: 1,
    slot: '01',
    description: '',
  });
  const [isCreatingQuickLoc, setIsCreatingQuickLoc] = useState(false);

  // Queries
  const { data: receiptsData, isLoading } = useQuery({
    queryKey: ['goods-receipts', search, statusFilter],
    queryFn: () =>
      goodsReceiptsApi.getAll({
        search: search || undefined,
        status: (statusFilter as GoodsReceiptStatus) || undefined,
        pageNumber: 1,
        pageSize: 50,
      }),
  });

  const { data: materialsData, refetch: refetchMaterials } = useQuery({
    queryKey: ['materials-list'],
    queryFn: () => materialApi.getAll({ onlyActive: true }),
    staleTime: 60000,
  });

  const { data: locationsData, refetch: refetchLocations } = useQuery({
    queryKey: ['locations-list'],
    queryFn: () => locationApi.getAll({ onlyActive: true }),
    staleTime: 60000,
  });

  // Create Form State
  const [formData, setFormData] = useState<CreateGoodsReceiptRequest>({
    receiptCode: '',
    supplierName: '',
    poNumber: '',
    note: '',
    autoStockIn: true,
    items: [
      {
        materialId: 0,
        locationId: 0,
        quantity: 10,
        unitPrice: 0,
        note: '',
      },
    ],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateGoodsReceiptRequest) => goodsReceiptsApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setIsCreateModalOpen(false);
      resetForm();
      setNotification({
        type: 'success',
        message: res.message || 'Tạo phiếu nhập kho thành công!',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.response?.data?.errors?.[0] || 'Lỗi tạo phiếu nhập kho.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => goodsReceiptsApi.complete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (selectedReceipt && res.data) {
        setSelectedReceipt(res.data);
      }
      setNotification({
        type: 'success',
        message: res.message || 'Hoàn tất nhập kho thành công! Tồn kho đã được cập nhật.',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Lỗi hoàn tất nhập kho.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => goodsReceiptsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      setIsViewModalOpen(false);
      setNotification({
        type: 'success',
        message: 'Hủy phiếu nhập kho thành công.',
      });
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Lỗi khi hủy phiếu.',
      });
      setTimeout(() => setNotification(null), 5000);
    },
  });

  const resetForm = () => {
    const firstMatId = materialsData?.data?.[0]?.id || 0;
    const firstLocId = locationsData?.data?.[0]?.id || 0;
    setFormData({
      receiptCode: '',
      supplierName: '',
      poNumber: '',
      note: '',
      autoStockIn: true,
      items: [
        {
          materialId: firstMatId,
          locationId: firstLocId,
          quantity: 10,
          unitPrice: 0,
          note: '',
        },
      ],
    });
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const firstMatId = materialsData?.data?.[0]?.id || 0;
    const firstLocId = locationsData?.data?.[0]?.id || 0;
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          materialId: firstMatId,
          locationId: firstLocId,
          quantity: 1,
          unitPrice: 0,
          note: '',
        },
      ],
    });
  };

  const handleRemoveItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    const updated = [...formData.items];
    updated.splice(index, 1);
    setFormData({ ...formData, items: updated });
  };

  const handleItemChange = (index: number, field: keyof CreateGoodsReceiptItemRequest, value: any) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, items: updated });
  };

  const calculateTotalQuantity = (items: CreateGoodsReceiptItemRequest[]) => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const calculateTotalAmount = (items: CreateGoodsReceiptItemRequest[]) => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierName.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp.');
      return;
    }

    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.materialId || item.materialId <= 0) {
        alert(`Dòng ${i + 1}: Vui lòng chọn mặt hàng vật tư.`);
        return;
      }
      if (!item.locationId || item.locationId <= 0) {
        alert(`Dòng ${i + 1}: Vui lòng chọn vị trí ô kệ lưu kho.`);
        return;
      }
      if (!item.quantity || item.quantity <= 0) {
        alert(`Dòng ${i + 1}: Số lượng nhập phải lớn hơn 0.`);
        return;
      }
    }

    createMutation.mutate(formData);
  };

  // Quick Create Handlers
  const handleOpenQuickMaterial = (rowIndex: number) => {
    setQuickMaterialRowIndex(rowIndex);
    const count = (materialsData?.data?.length || 0) + 1;
    const nextCode = `VT${count.toString().padStart(3, '0')}`;
    setQuickMaterialData({
      materialCode: nextCode,
      name: '',
      unit: 'Cái',
      minStock: 10,
      category: 'Kim khí',
      description: '',
    });
    setIsQuickMaterialOpen(true);
  };

  const handleSaveQuickMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMaterialData.materialCode.trim() || !quickMaterialData.name.trim()) {
      alert('Vui lòng nhập mã và tên vật tư.');
      return;
    }

    setIsCreatingQuickMat(true);
    try {
      const res = await materialApi.create(quickMaterialData);
      if (res.success && res.data) {
        await refetchMaterials();
        if (quickMaterialRowIndex !== null) {
          handleItemChange(quickMaterialRowIndex, 'materialId', res.data.id);
        }
        setIsQuickMaterialOpen(false);
        setNotification({
          type: 'success',
          message: `Đã tạo nhanh mã vật tư '${res.data.materialCode}' (${res.data.name})!`,
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo vật tư mới.');
    } finally {
      setIsCreatingQuickMat(false);
    }
  };

  const handleOpenQuickLocation = (rowIndex: number) => {
    setQuickLocationRowIndex(rowIndex);
    setQuickLocationData({
      locationCode: 'D01-01',
      rack: 'D',
      level: 1,
      slot: '01',
      description: 'Khu vực kệ mới tạo',
    });
    setIsQuickLocationOpen(true);
  };

  const handleSaveQuickLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLocationData.locationCode.trim()) {
      alert('Vui lòng nhập mã vị trí kệ.');
      return;
    }

    setIsCreatingQuickLoc(true);
    try {
      const res = await locationApi.create(quickLocationData);
      if (res.success && res.data) {
        await refetchLocations();
        if (quickLocationRowIndex !== null) {
          handleItemChange(quickLocationRowIndex, 'locationId', res.data.id);
        }
        setIsQuickLocationOpen(false);
        setNotification({
          type: 'success',
          message: `Đã tạo nhanh vị trí kệ '${res.data.locationCode}'!`,
        });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo vị trí kệ mới.');
    } finally {
      setIsCreatingQuickLoc(false);
    }
  };

  const receiptsList = receiptsData?.data?.items || [];
  const totalCount = receiptsData?.data?.totalCount || receiptsList.length;
  const completedCount = receiptsList.filter((r) => r.status === 'COMPLETED').length;
  const draftCount = receiptsList.filter((r) => r.status === 'DRAFT').length;
  const totalValue = receiptsList
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const materials = materialsData?.data || [];
  const locations = locationsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Quản Lý Nhập Kho (Goods Receipt)</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
              Inbound Orders
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Lập phiếu nhập đa mặt hàng, tạo nhanh mã vật tư/kệ mới ngay khi nhập hàng, và in phiếu nhập kho chuẩn.
          </p>
        </div>

        {isInboundStaff && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Nhập Kho Mới</span>
          </button>
        )}
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{totalCount}</div>
            <div className="text-xs text-slate-400">Tổng số phiếu</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400">{completedCount}</div>
            <div className="text-xs text-slate-400">Đã nhập kho</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-amber-400">{draftCount}</div>
            <div className="text-xs text-slate-400">Bản nháp / Chờ duyệt</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-indigo-300">
              {totalValue > 1000000 ? `${(totalValue / 1000000).toFixed(1)} tr` : `${totalValue.toLocaleString('vi-VN')} đ`}
            </div>
            <div className="text-xs text-slate-400">Giá trị đã nhập</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiếu, NCC, PO..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === ''
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã nhập kho
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Bản nháp
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Đã hủy
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12">
            <LoadingSpinner message="Đang tải danh sách phiếu nhập kho..." />
          </div>
        ) : receiptsList.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Chưa có phiếu nhập kho nào</p>
            <p className="text-slate-500 text-xs mt-1">
              {search || statusFilter ? 'Không tìm thấy phiếu phù hợp với bộ lọc.' : 'Hãy tạo phiếu nhập kho đầu tiên.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Mã Phiếu</th>
                  <th className="px-4 py-3.5">Nhà Cung Cấp & PO</th>
                  <th className="px-4 py-3.5">Mặt Hàng & Số Lượng</th>
                  <th className="px-4 py-3.5">Tổng Giá Trị</th>
                  <th className="px-4 py-3.5">Trạng Thái</th>
                  <th className="px-4 py-3.5">Người Lập & Ngày Tạo</th>
                  <th className="px-4 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {receiptsList.map((receipt) => {
                  const isCompleted = receipt.status === 'COMPLETED';
                  const isDraft = receipt.status === 'DRAFT';
                  const isCancelled = receipt.status === 'CANCELLED';

                  return (
                    <tr key={receipt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{receipt.receiptCode}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">ID #{receipt.id}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-200 truncate max-w-xs">{receipt.supplierName}</div>
                        {receipt.poNumber && (
                          <div className="text-xs text-blue-400 font-mono mt-0.5">PO: {receipt.poNumber}</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{receipt.totalQuantity}</span>
                          <span className="text-xs text-slate-400">
                            ({receipt.items?.length || 0} mã hàng)
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                          {receipt.items?.map((i) => i.materialName).join(', ')}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-indigo-300">
                          {receipt.totalAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã nhập kho</span>
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                            <Clock className="w-3 h-3" />
                            <span>Bản nháp</span>
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/60">
                            <XCircle className="w-3 h-3" />
                            <span>Đã hủy</span>
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        <div className="text-slate-200">{receipt.createdByUserFullName || receipt.createdByUserName}</div>
                        <div className="text-slate-500 mt-0.5">
                          {new Date(receipt.createdAt).toLocaleString('vi-VN', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedReceipt(receipt);
                              setIsViewModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Xem & In Phiếu"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {isDraft && isInboundStaff && (
                            <button
                              onClick={() => completeMutation.mutate(receipt.id)}
                              disabled={completeMutation.isPending}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                              title="Hoàn tất nhập kho"
                            >
                              Nhập kho
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Tạo Phiếu Nhập Kho (Multi-Item Inbound Generator) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lập Phiếu Nhập Kho Mới (Goods Receipt)"
        size="3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mã Phiếu (Để trống để tự tạo)
              </label>
              <input
                type="text"
                value={formData.receiptCode}
                onChange={(e) => setFormData({ ...formData, receiptCode: e.target.value })}
                placeholder="NK-202610-004..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nhà Cung Cấp <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="Tên công ty / Đơn vị cung cấp..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Số Đơn Hàng / PO
              </label>
              <input
                type="text"
                value={formData.poNumber || ''}
                onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                placeholder="PO-2026-..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ghi Chú Phiếu Nhập</label>
            <input
              type="text"
              value={formData.note || ''}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Ghi chú thêm về lô hàng, người giao, tình trạng kiện hàng..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Items Section */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-blue-400" />
                <span>Danh Sách Mặt Hàng Nhập Kho ({formData.items.length})</span>
              </span>

              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm mặt hàng</span>
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {formData.items.map((item, index) => {
                const selectedMat = materials.find((m) => m.id === Number(item.materialId));
                const itemTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row gap-3 items-center shadow-md"
                  >
                    {/* Material Select & Quick Add Button */}
                    <div className="w-full md:w-5/12">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400 font-medium">Vật tư / Mặt hàng</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickMaterial(index)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/40 cursor-pointer"
                          title="Tạo nhanh mã vật tư mới nếu chưa có trong kho"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Mã mới</span>
                        </button>
                      </div>
                      <select
                        value={item.materialId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            handleOpenQuickMaterial(index);
                          } else {
                            handleItemChange(index, 'materialId', Number(e.target.value));
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.materialCode}] {m.name} ({m.unit})
                          </option>
                        ))}
                        <option value="__NEW__" className="text-blue-400 font-bold">
                          ✨ + Tạo mã vật tư mới ngay tại đây...
                        </option>
                      </select>
                    </div>

                    {/* Location Select & Quick Add Button */}
                    <div className="w-full md:w-4/12">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-slate-400 font-medium">Vị trí ô kệ</label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickLocation(index)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 cursor-pointer"
                          title="Tạo nhanh vị trí kệ mới nếu chưa có"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Kệ mới</span>
                        </button>
                      </div>
                      <select
                        value={item.locationId}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            handleOpenQuickLocation(index);
                          } else {
                            handleItemChange(index, 'locationId', Number(e.target.value));
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.locationCode} - Kệ {l.rack} T{l.level}
                          </option>
                        ))}
                        <option value="__NEW__" className="text-emerald-400 font-bold">
                          ✨ + Tạo vị trí ô kệ mới ngay tại đây...
                        </option>
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-1/2 md:w-24">
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                        SL ({selectedMat?.unit || 'Cái'})
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-bold text-center"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="w-1/2 md:w-32">
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">Đơn giá (đ)</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 text-right font-mono"
                      />
                    </div>

                    {/* Total Price */}
                    <div className="w-full md:w-28 text-right shrink-0">
                      <div className="text-[10px] text-slate-400">Thành tiền</div>
                      <div className="text-xs font-bold text-indigo-300">
                        {itemTotal.toLocaleString('vi-VN')} đ
                      </div>
                    </div>

                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Xóa dòng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Footer Totals & Action */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoStockIn"
                checked={formData.autoStockIn}
                onChange={(e) => setFormData({ ...formData, autoStockIn: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <label htmlFor="autoStockIn" className="text-xs text-slate-200 cursor-pointer font-medium">
                Cộng dồn tồn kho ngay lập tức (Direct Stock-In)
              </label>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">
                Tổng SL: <strong className="text-white">{calculateTotalQuantity(formData.items)}</strong>
              </div>
              <div className="text-sm font-extrabold text-blue-400">
                Tổng tiền: {calculateTotalAmount(formData.items).toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {createMutation.isPending ? 'Đang tạo phiếu...' : 'Tạo Phiếu Nhập Kho'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUB-MODAL: Tạo Nhanh Mã Vật Tư Mới (Quick Create Material) */}
      <Modal
        isOpen={isQuickMaterialOpen}
        onClose={() => setIsQuickMaterialOpen(false)}
        title="✨ Tạo Nhanh Mã Vật Tư Mới"
        size="md"
      >
        <form onSubmit={handleSaveQuickMaterial} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center gap-2.5 text-xs text-blue-300">
            <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />
            <span>Mã vật tư mới sau khi tạo sẽ tự động được chọn vào dòng hàng hiện tại.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mã Vật Tư <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={quickMaterialData.materialCode}
                onChange={(e) => setQuickMaterialData({ ...quickMaterialData, materialCode: e.target.value.toUpperCase() })}
                placeholder="VT009, PK001..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Đơn Vị Tính <span className="text-rose-400">*</span>
              </label>
              <select
                value={quickMaterialData.unit}
                onChange={(e) => setQuickMaterialData({ ...quickMaterialData, unit: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
              >
                <option value="Cái">Cái</option>
                <option value="Bộ">Bộ</option>
                <option value="Mét">Mét</option>
                <option value="Cây">Cây</option>
                <option value="Cuộn">Cuộn</option>
                <option value="Kg">Kg</option>
                <option value="Hộp">Hộp</option>
                <option value="Thùng">Thùng</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tên Vật Tư <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={quickMaterialData.name}
              onChange={(e) => setQuickMaterialData({ ...quickMaterialData, name: e.target.value })}
              placeholder="VD: Bạc đạn SKF 6204, Cáp điện 4.0..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nhóm / Danh Mục</label>
              <select
                value={quickMaterialData.category}
                onChange={(e) => setQuickMaterialData({ ...quickMaterialData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
              >
                <option value="Kim khí">Kim khí</option>
                <option value="Thiết bị điện">Thiết bị điện</option>
                <option value="Kim loại">Kim loại</option>
                <option value="Tự động hóa">Tự động hóa</option>
                <option value="Vật tư phụ">Vật tư phụ</option>
                <option value="Vật liệu xây dựng">Vật liệu xây dựng</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tồn Kho Tối Thiểu (Min)</label>
              <input
                type="number"
                min="0"
                value={quickMaterialData.minStock}
                onChange={(e) => setQuickMaterialData({ ...quickMaterialData, minStock: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickMaterialOpen(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreatingQuickMat}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              {isCreatingQuickMat ? 'Đang lưu...' : 'Lưu & Chọn Vật Tư'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SUB-MODAL: Tạo Nhanh Vị Trí Kệ Mới (Quick Create Location) */}
      <Modal
        isOpen={isQuickLocationOpen}
        onClose={() => setIsQuickLocationOpen(false)}
        title="📍 Tạo Nhanh Vị Trí Ô Kệ Mới"
        size="md"
      >
        <form onSubmit={handleSaveQuickLocation} className="space-y-3.5">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-300">
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Vị trí ô kệ mới sau khi tạo sẽ lập tức được áp dụng cho mặt hàng này.</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dãy / Kệ (Rack)</label>
              <input
                type="text"
                value={quickLocationData.rack}
                onChange={(e) => {
                  const r = e.target.value.toUpperCase();
                  const locCode = `${r}${quickLocationData.level.toString().padStart(2, '0')}-${quickLocationData.slot}`;
                  setQuickLocationData({ ...quickLocationData, rack: r, locationCode: locCode });
                }}
                placeholder="D, E, F..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 uppercase font-bold text-center"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tầng (Level)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={quickLocationData.level}
                onChange={(e) => {
                  const lvl = Number(e.target.value);
                  const locCode = `${quickLocationData.rack}${lvl.toString().padStart(2, '0')}-${quickLocationData.slot}`;
                  setQuickLocationData({ ...quickLocationData, level: lvl, locationCode: locCode });
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold text-center"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ô / Slot</label>
              <input
                type="text"
                value={quickLocationData.slot}
                onChange={(e) => {
                  const sl = e.target.value;
                  const locCode = `${quickLocationData.rack}${quickLocationData.level.toString().padStart(2, '0')}-${sl}`;
                  setQuickLocationData({ ...quickLocationData, slot: sl, locationCode: locCode });
                }}
                placeholder="01, 02..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-bold text-center"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mã Vị Trí (Tự Động Tạo) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={quickLocationData.locationCode}
              onChange={(e) => setQuickLocationData({ ...quickLocationData, locationCode: e.target.value.toUpperCase() })}
              placeholder="VD: D01-01"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mô Tả Khu Vực</label>
            <input
              type="text"
              value={quickLocationData.description}
              onChange={(e) => setQuickLocationData({ ...quickLocationData, description: e.target.value })}
              placeholder="Khu vực kệ chứa linh kiện mới nhập..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickLocationOpen(false)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreatingQuickLoc}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              {isCreatingQuickLoc ? 'Đang lưu...' : 'Lưu & Chọn Vị Trí'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Xem & In Phiếu Nhập Kho (Printable Goods Receipt Slip) */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Chi Tiết & In Phiếu Nhập Kho"
        size="3xl"
      >
        {selectedReceipt && (
          <div className="space-y-4">
            {/* Printable Area */}
            <div
              id="printable-slip"
              className="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-inner space-y-4 font-sans"
            >
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b pb-3 border-slate-300">
                <div>
                  <div className="text-lg font-extrabold text-slate-900 uppercase tracking-tight">
                    TỔNG KHO VẬT TƯ WMS PRO
                  </div>
                  <div className="text-xs text-slate-600">Lô B2, KCN Cao Hòa Lạc, Hà Nội • Hotline: 1900-8899</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-blue-900 font-mono">{selectedReceipt.receiptCode}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {new Date(selectedReceipt.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h2 className="text-xl font-black text-slate-900 tracking-wide uppercase">
                  PHIẾU NHẬP KHO VẬT TƯ
                </h2>
                <div className="text-xs text-slate-500 font-medium italic mt-0.5">
                  (Goods Receipt Note / Inbound Slip)
                </div>
              </div>

              {/* General Info Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-y py-2 border-slate-200">
                <div>
                  <span className="text-slate-500">Nhà cung cấp:</span>{' '}
                  <strong className="text-slate-900">{selectedReceipt.supplierName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Số đơn hàng (PO):</span>{' '}
                  <strong className="text-slate-900">{selectedReceipt.poNumber || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Người lập phiếu:</span>{' '}
                  <strong className="text-slate-900">
                    {selectedReceipt.createdByUserFullName || selectedReceipt.createdByUserName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500">Trạng thái:</span>{' '}
                  <strong
                    className={
                      selectedReceipt.status === 'COMPLETED'
                        ? 'text-emerald-700 font-bold'
                        : selectedReceipt.status === 'DRAFT'
                        ? 'text-amber-700 font-bold'
                        : 'text-rose-700 font-bold'
                    }
                  >
                    {selectedReceipt.statusName}
                  </strong>
                </div>
                {selectedReceipt.note && (
                  <div className="col-span-2">
                    <span className="text-slate-500">Ghi chú:</span>{' '}
                    <span className="text-slate-700 italic">{selectedReceipt.note}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border border-slate-300 text-center w-10">STT</th>
                      <th className="p-2 border border-slate-300">Mã & Tên Vật Tư</th>
                      <th className="p-2 border border-slate-300">Vị Trí Kệ</th>
                      <th className="p-2 border border-slate-300 text-center">ĐVT</th>
                      <th className="p-2 border border-slate-300 text-right">Số Lượng</th>
                      <th className="p-2 border border-slate-300 text-right">Đơn Giá</th>
                      <th className="p-2 border border-slate-300 text-right">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedReceipt.items?.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border border-slate-300">
                          <div className="font-bold text-slate-900">{item.materialName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{item.materialCode}</div>
                        </td>
                        <td className="p-2 border border-slate-300">
                          <span className="font-mono font-semibold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
                            {item.locationCode}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 text-center">{item.unit}</td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="p-2 border border-slate-300 text-right">
                          {item.unitPrice.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">
                          {item.totalPrice.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={4} className="p-2 border border-slate-300 text-right uppercase text-[11px]">
                        Tổng cộng:
                      </td>
                      <td className="p-2 border border-slate-300 text-right text-slate-900">
                        {selectedReceipt.totalQuantity}
                      </td>
                      <td className="p-2 border border-slate-300"></td>
                      <td className="p-2 border border-slate-300 text-right text-blue-900 font-black">
                        {selectedReceipt.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-800 uppercase">Người Giao Hàng</div>
                  <div className="text-[10px] text-slate-500">(Ký, họ tên)</div>
                  <div className="h-14"></div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 uppercase">Thủ Kho Nhận Hàng</div>
                  <div className="text-[10px] text-slate-500">(Ký, họ tên)</div>
                  <div className="h-14"></div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 uppercase">Kế Toán / Quản Lý Kho</div>
                  <div className="text-[10px] text-slate-500">(Ký, đóng dấu)</div>
                  <div className="h-14"></div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {selectedReceipt.status === 'DRAFT' && isInboundStaff && (
                  <button
                    type="button"
                    onClick={() => cancelMutation.mutate(selectedReceipt.id)}
                    className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold border border-rose-800/50 cursor-pointer"
                  >
                    Hủy Phiếu Nháp
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {selectedReceipt.status === 'DRAFT' && isInboundStaff && (
                  <button
                    type="button"
                    onClick={() => completeMutation.mutate(selectedReceipt.id)}
                    disabled={completeMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 cursor-pointer"
                  >
                    {completeMutation.isPending ? 'Đang xử lý...' : 'Xác Nhận Nhập Kho Ngay'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Phiếu Nhập Kho</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
