import React, { useState, useEffect } from 'react';
import { userApi } from '../api/endpoints';
import type { UserProfile } from '../types';
import { Badge, Modal, LoadingSpinner } from '../components/common/CommonComponents';
import { Users, Plus, Shield, User, Edit2, Trash2 } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'WAREHOUSE_STAFF',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getAll();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await userApi.create(formData);
      if (res.success) {
        setIsCreateOpen(false);
        loadUsers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Lỗi tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await userApi.update(editingUser.id, {
        fullName: formData.fullName,
        role: formData.role,
        isActive: formData.isActive,
        newPassword: formData.password.trim() || undefined,
      });
      if (res.success) {
        setEditingUser(null);
        loadUsers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Lỗi cập nhật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (u: UserProfile) => {
    if (!window.confirm(`Bạn có chắc chắn muốn vô hiệu hóa tài khoản '${u.username}' (${u.fullName})?`)) return;
    try {
      const res = await userApi.delete(u.id);
      if (res.success) {
        loadUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể vô hiệu hóa người dùng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <span>Quản Lý Người Dùng & Phân Quyền</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Quản trị tài khoản Quản trị viên (ADMIN) và Nhân viên kho (WAREHOUSE_STAFF)
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              username: '',
              password: '',
              fullName: '',
              role: 'WAREHOUSE_STAFF',
              isActive: true,
            });
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Tài Khoản Mới</span>
        </button>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải danh sách người dùng..." />
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Tài Khoản</th>
                  <th className="py-3.5 px-4 font-semibold">Họ Và Tên</th>
                  <th className="py-3.5 px-4 font-semibold">Vai Trò (Role)</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                  <th className="py-3.5 px-4 font-semibold">Ngày Tạo</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                      @{u.username}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 text-sm">
                      {u.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                          <Shield className="w-3 h-3" /> Quản Trị Viên (ADMIN)
                        </span>
                      )}
                      {u.role === 'MANAGER' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          Quản Lý Kho (MANAGER)
                        </span>
                      )}
                      {u.role === 'INBOUND_STAFF' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                          NV Nhập Kho (INBOUND)
                        </span>
                      )}
                      {u.role === 'OUTBOUND_STAFF' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950 text-orange-300 border border-orange-800">
                          NV Xuất Kho (OUTBOUND)
                        </span>
                      )}
                      {u.role === 'AUDITOR' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                          NV Kiểm Kê (AUDITOR)
                        </span>
                      )}
                      {u.role === 'WAREHOUSE_STAFF' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          <User className="w-3 h-3" /> NV Kho Tổng Hợp
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <Badge variant="success">Hoạt động</Badge>
                      ) : (
                        <Badge variant="danger">Đã khóa</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setFormData({
                              username: u.username,
                              password: '',
                              fullName: u.fullName,
                              role: u.role,
                              isActive: u.isActive,
                            });
                            setFormError(null);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Sửa tài khoản"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                          title="Khóa tài khoản"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Tài Khoản Người Dùng Mới"
      >
        <form onSubmit={handleSaveCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Tên đăng nhập (Username)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="VD: staff3"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="VD: Nguyễn Văn C"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phân quyền (Role)</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            >
              <option value="ADMIN">Quản Trị Viên (ADMIN)</option>
              <option value="MANAGER">Quản Lý Kho (MANAGER)</option>
              <option value="INBOUND_STAFF">Nhân Viên Nhập Kho (INBOUND_STAFF)</option>
              <option value="OUTBOUND_STAFF">Nhân Viên Xuất Kho (OUTBOUND_STAFF)</option>
              <option value="AUDITOR">Nhân Viên Kiểm Kê (AUDITOR)</option>
              <option value="WAREHOUSE_STAFF">Nhân Viên Kho Tổng Hợp (WAREHOUSE_STAFF)</option>
            </select>
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
              {isSubmitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Cập Nhật Tài Khoản: @${editingUser?.username}`}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-950 text-rose-300 text-xs border border-rose-800">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Họ và tên</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Đổi mật khẩu mới (Bỏ trống nếu giữ nguyên)
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Phân quyền</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100"
            >
              <option value="ADMIN">Quản Trị Viên (ADMIN)</option>
              <option value="MANAGER">Quản Lý Kho (MANAGER)</option>
              <option value="INBOUND_STAFF">Nhân Viên Nhập Kho (INBOUND_STAFF)</option>
              <option value="OUTBOUND_STAFF">Nhân Viên Xuất Kho (OUTBOUND_STAFF)</option>
              <option value="AUDITOR">Nhân Viên Kiểm Kê (AUDITOR)</option>
              <option value="WAREHOUSE_STAFF">Nhân Viên Kho Tổng Hợp (WAREHOUSE_STAFF)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="userIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <label htmlFor="userIsActive" className="text-xs text-slate-300 font-medium">
              Tài khoản đang hoạt động (Active)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
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
