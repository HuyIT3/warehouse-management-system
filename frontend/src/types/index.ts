export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'INBOUND_STAFF'
  | 'OUTBOUND_STAFF'
  | 'AUDITOR'
  | 'WAREHOUSE_STAFF';

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

export type GoodsReceiptStatus = 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserProfile;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface Material {
  id: number;
  materialCode: string;
  name: string;
  unit: string;
  minStock: number;
  description?: string;
  category?: string;
  isActive: boolean;
  totalStock: number;
  isLowStock: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface LocationStock {
  inventoryId: number;
  locationId: number;
  locationCode: string;
  displayName: string;
  rack: string;
  level: number;
  slot: string;
  quantity: number;
  lastUpdated?: string;
}

export interface MaterialStockSummary {
  materialId: number;
  materialCode: string;
  name: string;
  unit: string;
  totalStock: number;
  minStock: number;
  isLowStock: boolean;
  locations: LocationStock[];
}

export interface WarehouseLocation {
  id: number;
  locationCode: string;
  rack: string;
  level: number;
  slot: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  totalStoredItems: number;
  totalQuantityStored: number;
  createdAt: string;
  storedMaterials?: {
    inventoryId: number;
    materialId: number;
    materialCode: string;
    materialName: string;
    unit: string;
    quantity: number;
    updatedAt?: string;
  }[];
}

export interface InventoryItem {
  id: number;
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  minStock: number;
  locationId: number;
  locationCode: string;
  locationDisplayName: string;
  rack: string;
  level: number;
  slot: string;
  quantity: number;
  updatedAt?: string;
}

export interface MaterialLookup {
  materialId: number;
  materialCode: string;
  name: string;
  unit: string;
  minStock: number;
  totalStock: number;
  isActive: boolean;
  isLowStock: boolean;
  locations: {
    inventoryId: number;
    locationId: number;
    locationCode: string;
    locationDisplayName: string;
    rack: string;
    level: number;
    slot: string;
    quantity: number;
  }[];
}

export interface StockOperationResult {
  success: boolean;
  message: string;
  materialCode: string;
  materialName: string;
  locationCode: string;
  locationDisplayName: string;
  operationType: TransactionType;
  quantityChanged: number;
  beforeQuantity: number;
  afterQuantity: number;
  remainingTotalStock: number;
  transactionId: number;
  timestamp: string;
}

export interface StockTransaction {
  id: number;
  inventoryId: number;
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  locationId: number;
  locationCode: string;
  locationDisplayName: string;
  transactionType: TransactionType;
  transactionTypeName: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  userId: number;
  userName: string;
  userFullName: string;
  note?: string;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: number;
  materialId: number;
  materialCode: string;
  materialName: string;
  unit: string;
  locationId: number;
  locationCode: string;
  locationDisplayName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface GoodsReceipt {
  id: number;
  receiptCode: string;
  supplierName: string;
  poNumber?: string;
  status: GoodsReceiptStatus;
  statusName: string;
  totalQuantity: number;
  totalAmount: number;
  note?: string;
  createdByUserId: number;
  createdByUserName: string;
  createdByUserFullName: string;
  createdAt: string;
  completedAt?: string;
  items: GoodsReceiptItem[];
}

export interface CreateGoodsReceiptItemRequest {
  materialId: number;
  locationId: number;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface CreateGoodsReceiptRequest {
  receiptCode?: string;
  supplierName: string;
  poNumber?: string;
  note?: string;
  autoStockIn: boolean;
  items: CreateGoodsReceiptItemRequest[];
}

export interface GoodsReceiptFilter {
  search?: string;
  status?: GoodsReceiptStatus;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DashboardSummary {
  totalMaterials: number;
  totalInventoryQuantity: number;
  totalLowStockCount: number;
  totalLocations: number;
  occupiedLocationsCount: number;
  todayStockInQuantity: number;
  todayStockOutQuantity: number;
  todayTransactionsCount: number;
  lowStockAlerts: {
    materialId: number;
    materialCode: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    deficit: number;
  }[];
  recentTransactions: {
    id: number;
    createdAt: string;
    type: TransactionType;
    materialCode: string;
    materialName: string;
    locationCode: string;
    locationDisplayName: string;
    quantity: number;
    beforeQuantity: number;
    afterQuantity: number;
    userFullName: string;
    note?: string;
  }[];
  last7DaysActivity: {
    date: string;
    inQuantity: number;
    outQuantity: number;
  }[];
}
