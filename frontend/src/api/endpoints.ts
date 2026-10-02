import { apiClient, API_BASE_URL } from './client';
import type {
  ApiResponse,
  CreateGoodsReceiptRequest,
  DashboardSummary,
  GoodsReceipt,
  GoodsReceiptFilter,
  InventoryItem,
  LoginResponse,
  Material,
  MaterialLookup,
  MaterialStockSummary,
  PagedResult,
  StockOperationResult,
  StockTransaction,
  UserProfile,
  WarehouseLocation,
} from '../types';

// Auth API
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', credentials);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/api/auth/me');
    return res.data;
  },
  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const res = await apiClient.post<ApiResponse>('/api/auth/change-password', data);
    return res.data;
  },
};

// Materials API
export const materialApi = {
  getAll: async (params?: { search?: string; onlyActive?: boolean; lowStockOnly?: boolean }) => {
    const res = await apiClient.get<ApiResponse<Material[]>>('/api/materials', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Material>>(`/api/materials/${id}`);
    return res.data;
  },
  getByCode: async (code: string) => {
    const res = await apiClient.get<ApiResponse<Material>>(`/api/materials/code/${code}`);
    return res.data;
  },
  getStockSummary: async (code: string) => {
    const res = await apiClient.get<ApiResponse<MaterialStockSummary>>(`/api/materials/code/${code}/summary`);
    return res.data;
  },
  create: async (data: {
    materialCode: string;
    name: string;
    unit: string;
    minStock: number;
    description?: string;
    category?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Material>>('/api/materials', data);
    return res.data;
  },
  update: async (id: number, data: {
    name: string;
    unit: string;
    minStock: number;
    description?: string;
    category?: string;
    isActive: boolean;
  }) => {
    const res = await apiClient.put<ApiResponse<Material>>(`/api/materials/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete<ApiResponse>(`/api/materials/${id}`);
    return res.data;
  },
};

// Locations API
export const locationApi = {
  getAll: async (params?: { rack?: string; onlyActive?: boolean }) => {
    const res = await apiClient.get<ApiResponse<WarehouseLocation[]>>('/api/locations', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<WarehouseLocation>>(`/api/locations/${id}`);
    return res.data;
  },
  getByCode: async (code: string) => {
    const res = await apiClient.get<ApiResponse<WarehouseLocation>>(`/api/locations/code/${code}`);
    return res.data;
  },
  create: async (data: {
    locationCode: string;
    rack: string;
    level: number;
    slot: string;
    description?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<WarehouseLocation>>('/api/locations', data);
    return res.data;
  },
  update: async (id: number, data: {
    rack: string;
    level: number;
    slot: string;
    description?: string;
    isActive: boolean;
  }) => {
    const res = await apiClient.put<ApiResponse<WarehouseLocation>>(`/api/locations/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete<ApiResponse>(`/api/locations/${id}`);
    return res.data;
  },
};

// Inventory API
export const inventoryApi = {
  getAll: async (params?: { search?: string; rack?: string }) => {
    const res = await apiClient.get<ApiResponse<InventoryItem[]>>('/api/inventory', { params });
    return res.data;
  },
  lookup: async (materialCode: string) => {
    const res = await apiClient.get<ApiResponse<MaterialLookup>>(`/api/inventory/lookup/${materialCode}`);
    return res.data;
  },
};

// Stock API
export const stockApi = {
  stockOut: async (data: {
    materialCode: string;
    locationCode: string;
    quantity: number;
    note?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<StockOperationResult>>('/api/stock/out', data);
    return res.data;
  },
  stockIn: async (data: {
    materialCode: string;
    locationCode: string;
    quantity: number;
    note?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<StockOperationResult>>('/api/stock/in', data);
    return res.data;
  },
  stockAdjust: async (data: {
    materialCode: string;
    locationCode: string;
    actualQuantity: number;
    reason: string;
  }) => {
    const res = await apiClient.post<ApiResponse<StockOperationResult>>('/api/stock/adjust', data);
    return res.data;
  },
  stockTransfer: async (data: {
    materialCode: string;
    sourceLocationCode: string;
    destinationLocationCode: string;
    quantity: number;
    note?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<StockOperationResult>>('/api/stock/transfer', data);
    return res.data;
  },
};

// Transactions API
export const transactionApi = {
  getTransactions: async (params?: {
    materialCode?: string;
    locationCode?: string;
    transactionType?: string;
    userId?: number;
    fromDate?: string;
    toDate?: string;
    pageNumber?: number;
    pageSize?: number;
  }) => {
    const res = await apiClient.get<ApiResponse<PagedResult<StockTransaction>>>('/api/transactions', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<StockTransaction>>(`/api/transactions/${id}`);
    return res.data;
  },
  exportCsvUrl: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    return `${API_BASE_URL}/api/transactions/export-csv?${query}`;
  },
};

// Dashboard API
export const dashboardApi = {
  getSummary: async () => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/api/dashboard');
    return res.data;
  },
};

// Users API
export const userApi = {
  getAll: async () => {
    const res = await apiClient.get<ApiResponse<UserProfile[]>>('/api/users');
    return res.data;
  },
  create: async (data: {
    username: string;
    password: string;
    fullName: string;
    role: string;
  }) => {
    const res = await apiClient.post<ApiResponse<UserProfile>>('/api/users', data);
    return res.data;
  },
  update: async (id: number, data: {
    fullName: string;
    role: string;
    isActive: boolean;
    newPassword?: string;
  }) => {
    const res = await apiClient.put<ApiResponse<UserProfile>>(`/api/users/${id}`, data);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await apiClient.delete<ApiResponse>(`/api/users/${id}`);
    return res.data;
  },
};

// Goods Receipts (Inbound) API
export const goodsReceiptsApi = {
  getAll: async (params?: GoodsReceiptFilter) => {
    const res = await apiClient.get<ApiResponse<PagedResult<GoodsReceipt>>>('/api/goodsreceipts', { params });
    return res.data;
  },
  getById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<GoodsReceipt>>(`/api/goodsreceipts/${id}`);
    return res.data;
  },
  create: async (data: CreateGoodsReceiptRequest) => {
    const res = await apiClient.post<ApiResponse<GoodsReceipt>>('/api/goodsreceipts', data);
    return res.data;
  },
  complete: async (id: number) => {
    const res = await apiClient.post<ApiResponse<GoodsReceipt>>(`/api/goodsreceipts/${id}/complete`);
    return res.data;
  },
  cancel: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<boolean>>(`/api/goodsreceipts/${id}`);
    return res.data;
  },
};

