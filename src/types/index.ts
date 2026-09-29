export type UserRole =
  | 'owner'
  | 'super_admin'
  | 'manager'
  | 'supervisor'
  | 'cashier'
  | 'sales'
  | 'service_staff'
  | 'beauty_staff'
  | 'stock'
  | 'marketing'
  | 'accounting'
  | 'delivery'
  | 'view_only'
  | 'customer';

export interface UserProfile {
  id: string;
  organization_id: string;
  display_name: string;
  role: UserRole;
  active: boolean;
  email?: string;
  phone?: string;
}

export interface Organization {
  id: string;
  name: string;
  code?: string;
  settings?: Record<string, unknown>;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  active: boolean;
  address?: string;
}

export type StyleGuideTheme = 'minimal_luxury' | 'modern_glass' | 'soft_organic';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorder: number;
  barcode?: string;
  image_url?: string;
  active?: boolean;
  // Flash Sale Fields (Special Price & Live Urgency)
  is_flash_sale?: boolean;
  flash_sale_price?: number;
  flash_sale_end?: string;
  flash_sale_stock_limit?: number;
  flash_sale_sold_count?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  duration_minutes: number;
  price: number;
  active: boolean;
  image_url?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'refunded';

export type PaymentMethod = 'cash' | 'qr' | 'promptpay' | 'card' | 'transfer';

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
}

export interface Sale {
  id: string;
  created_at: string;
  branch_id?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  channel: 'pos' | 'delivery' | 'pickup' | 'app';
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  items?: SaleItem[];
  rider_name?: string;
  delivery_address?: string;
  receipt_number?: string;
}

export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled';

export interface Booking {
  id: string;
  created_at: string;
  service_id: string;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  starts_at: string;
  duration_minutes: number;
  technician_name?: string;
  technician_id?: string;
  status: BookingStatus;
  price: number;
  notes?: string;
}

export interface CashSession {
  id: string;
  branch_id?: string;
  user_id?: string;
  user_name?: string;
  opened_at: string;
  closed_at?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  variance?: number;
  status: 'open' | 'closed';
}

export interface InventoryMovement {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  before_stock: number;
  after_stock: number;
  reason: string;
  user_name?: string;
  reference_id?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  points: number;
  tier: 'EQUAL' | '1Mart VIP' | '1Service Elite';
  created_at?: string;
  password_hash?: string;
  delivery_address?: string;
}

export interface AuditLog {
  id: string;
  created_at: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown> | string;
}

export interface AiActionProposal {
  id: string;
  type: 'price_change' | 'reorder' | 'promotion' | 'staff_schedule' | 'service_update';
  title: string;
  explanation: string;
  recommendation: string;
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
  dataPayload?: Record<string, unknown>;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  title: string;
  subtitle: string;
  badge: 'HOT' | 'PROMO' | 'FLASH' | 'NEW' | 'EXCLUSIVE';
  type: 'banner' | 'flash_sale' | 'line_broadcast' | 'popup';
  image_url: string;
  target_link: string;
  discount_text: string;
  active: boolean;
  start_date: string;
  end_date: string;
  views_count?: number;
  clicks_count?: number;
}

export interface PromoVoucher {
  id: string;
  code: string;
  title: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_spend: number;
  max_discount?: number;
  expires_at: string;
  usage_limit: number;
  used_count: number;
  active: boolean;
}

export interface BankSlipRecord {
  id: string;
  sale_id?: string;
  order_id?: string;
  slip_image_url: string;
  bank_name: string;
  sender_name: string;
  sender_account?: string;
  receiver_account: string;
  amount: number;
  transaction_ref: string;
  transferred_at: string;
  verified_at: string;
  verification_status: 'verified' | 'amount_mismatch' | 'duplicate_fraud' | 'pending';
  verification_note?: string;
  verified_by?: string;
}

export interface HeldBill {
  id: string;
  created_at: string;
  customer_id?: string;
  customer_name?: string;
  cart: CartItem[];
  subtotal: number;
  note?: string;
}

export interface StaffPinAccount {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  pin_hash?: string;
  avatar?: string;
  active: boolean;
  last_active_at?: string;
  failed_attempts?: number;
}

// ----------------------------------------------------
// EQUAL1 Team OS Architecture & Operational Interfaces
// ----------------------------------------------------

export interface StaffPermissions {
  pos: {
    create_order: boolean;
    edit_cart: boolean;
    apply_discount: boolean;
    void_order: boolean;
    refund: boolean;
  };
  stock: {
    view_stock: boolean;
    receive_stock: boolean;
    adjust_stock: boolean;
    delete_movement: boolean;
  };
  customer: {
    view_customer: boolean;
    create_customer: boolean;
    add_notes: boolean;
    export_data: boolean;
  };
  finance: {
    view_daily_sales: boolean;
    view_profit: boolean;
    manage_cash_shift: boolean;
  };
  team: {
    manage_tasks: boolean;
    approve_requests: boolean;
    view_other_salaries: boolean;
  };
}

export type EmployeeStatus = 'invite' | 'onboarding' | 'active' | 'suspended' | 'offboarded';
export type AttendanceStatus = 'clocked_in' | 'on_break' | 'clocked_out' | 'on_leave';

export interface EmployeeProfile {
  id: string;
  name: string;
  nickname: string;
  position: string;
  branch_id: string;
  branch_name: string;
  role: UserRole;
  status: EmployeeStatus;
  attendance_status: AttendanceStatus;
  phone: string;
  email: string;
  avatar: string;
  skills: string[];
  services_can_perform: string[];
  commission_rate_pct: number;
  base_salary?: number;
  joined_date: string;
  today_sales: number;
  today_services_count: number;
  today_commission: number;
  monthly_commission: number;
  last_clock_in?: string;
  last_clock_out?: string;
  permissions: StaffPermissions;
  completed_training_courses: string[];
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'completed' | 'verified';

export interface TaskChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  branch_id: string;
  created_by_name: string;
  assigned_to_id: string;
  assigned_to_name: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_time?: string;
  category: 'opening' | 'closing' | 'cleanliness' | 'inventory' | 'customer' | 'general';
  checklist: TaskChecklistItem[];
  created_at: string;
  completed_at?: string;
  verified_by?: string;
}

export interface StoreChecklistRecord {
  id: string;
  type: 'opening' | 'closing';
  branch_id: string;
  branch_name: string;
  staff_id: string;
  staff_name: string;
  completed_at: string;
  items_completed: number;
  total_items: number;
  notes?: string;
  cash_amount_checked?: number;
}

export interface CommissionRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  transaction_type: 'service' | 'product_sale';
  reference_id: string;
  description: string;
  amount_base: number;
  rate_pct: number;
  commission_earned: number;
  customer_name?: string;
  created_at: string;
  payout_status: 'pending' | 'approved' | 'paid';
}

export type ApprovalType =
  | 'refund'
  | 'large_discount'
  | 'stock_adjustment'
  | 'price_change'
  | 'void_transaction'
  | 'cash_withdrawal';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  requested_by_id: string;
  requested_by_name: string;
  branch_id: string;
  details: string;
  amount?: number;
  reference_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
}

export interface TrainingCourse {
  id: string;
  code: string;
  title: string;
  category: string;
  duration_minutes: number;
  description: string;
  modules_count: number;
  badge_name: string;
  required_for_roles: UserRole[];
}

export interface StaffActivityLog {
  id: string;
  timestamp: string;
  employee_id: string;
  employee_name: string;
  action_type:
    | 'login'
    | 'logout'
    | 'clock_in'
    | 'clock_out'
    | 'open_pos'
    | 'sale_order'
    | 'booking_service'
    | 'stock_change'
    | 'request_approval'
    | 'checklist'
    | 'training';
  title: string;
  detail?: string;
  branch_name?: string;
}


