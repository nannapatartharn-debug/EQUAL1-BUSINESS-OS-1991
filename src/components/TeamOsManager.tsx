import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Briefcase,
  CheckSquare,
  Clock,
  ShieldAlert,
  Coins,
  GraduationCap,
  Activity,
  Plus,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  ChevronRight,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  LogOut,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Coffee,
  Store,
  Scissors,
  Package,
  Camera,
  QrCode,
  Barcode,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Minus,
  Receipt,
} from 'lucide-react';
import {
  UserRole,
  EmployeeProfile,
  TaskItem,
  TaskPriority,
  TaskStatus,
  ApprovalRequest,
  CommissionRecord,
  TrainingCourse,
  StaffActivityLog,
  StoreChecklistRecord,
  StaffPermissions,
  Booking,
  Sale,
  Product,
  CartItem,
  Customer,
  PaymentMethod,
} from '../types';
import {
  OPENING_CHECKLIST_TEMPLATE,
  CLOSING_CHECKLIST_TEMPLATE,
  getRoleDefaultPermissions,
} from '../lib/store';
import { playTactileHaptic } from '../lib/security';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

interface TeamOsManagerProps {
  currentRole: UserRole;
  currentStaffName: string;
  isOwnerAuthenticated?: boolean;
  onRequestOwnerLogin?: () => void;
  employees: EmployeeProfile[];
  onUpdateEmployees: (employees: EmployeeProfile[]) => void;
  tasks: TaskItem[];
  onUpdateTasks: (tasks: TaskItem[]) => void;
  approvals: ApprovalRequest[];
  onUpdateApprovals: (approvals: ApprovalRequest[]) => void;
  commissions: CommissionRecord[];
  onUpdateCommissions: (commissions: CommissionRecord[]) => void;
  trainingCourses: TrainingCourse[];
  activities: StaffActivityLog[];
  onAddActivity: (activity: Omit<StaffActivityLog, 'id' | 'timestamp'>) => void;
  bookings: Booking[];
  sales: Sale[];
  products: Product[];
  onNavigateToView: (view: string) => void;
  customers?: Customer[];
  onSendCartToPos?: (items: CartItem[]) => void;
  onQuickSaleCompleted?: (sale: Sale, updatedProducts: Product[]) => void;
}

export const TeamOsManager: React.FC<TeamOsManagerProps> = ({
  currentRole,
  currentStaffName,
  isOwnerAuthenticated = true,
  onRequestOwnerLogin,
  employees,
  onUpdateEmployees,
  tasks,
  onUpdateTasks,
  approvals,
  onUpdateApprovals,
  commissions,
  onUpdateCommissions,
  trainingCourses,
  activities,
  onAddActivity,
  bookings,
  sales,
  products,
  onNavigateToView,
  customers = [],
  onSendCartToPos,
  onQuickSaleCompleted,
}) => {
  // Strict Owner Access: The 5 pillars (Approvals, Tasks, Commissions, Audit, Team Control)
  // are visible ONLY to the Owner! Others have zero access.
  const isOwner = currentRole === 'owner' && isOwnerAuthenticated !== false;
  const isManagement = isOwner;

  // Active Tab: Defaults to 'my-work' for staff; only owner defaults to 'team-directory'
  const [activeTab, setActiveTab] = useState<
    'my-work' | 'team-directory' | 'tasks' | 'checklists' | 'approvals' | 'commissions' | 'academy' | 'timeline'
  >(isOwner ? 'team-directory' : 'my-work');

  // Guard: if non-owner is somehow on an owner-only tab, revert immediately
  useEffect(() => {
    const ownerOnlyTabs = ['team-directory', 'tasks', 'approvals', 'commissions', 'timeline'];
    if (!isOwner && ownerOnlyTabs.includes(activeTab)) {
      setActiveTab('my-work');
    }
  }, [isOwner, activeTab]);

  // Camera Barcode Scanner & Floor Cart state
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [teamCart, setTeamCart] = useState<CartItem[]>([]);
  const [isTeamCartDrawerOpen, setIsTeamCartDrawerOpen] = useState(false);
  const [scannedToast, setScannedToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [quickPaymentModalOpen, setQuickPaymentModalOpen] = useState(false);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<PaymentMethod>('promptpay');

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setScannedToast({ message, type });
    setTimeout(() => setScannedToast(null), 3500);
  };

  const teamCartTotal = useMemo(() => {
    return teamCart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [teamCart]);

  const handleProductScanned = (product: Product) => {
    playTactileHaptic('success');
    setTeamCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'sale_order',
      title: `สแกนสินค้า ${product.name}`,
      detail: `สแกนบาร์โค้ดกล้อง: เพิ่ม ${product.name} (฿${product.price}) ลงตะกร้าด่วนของทีม SKU: ${product.sku}`,
      branch_name: currentEmployee.branch_name,
    });

    triggerToast(`สแกน "${product.name}" สำเร็จ! เพิ่มลงตะกร้าแล้ว (+฿${product.price})`, 'success');
  };

  const handleUpdateTeamCartQty = (productId: string, delta: number) => {
    setTeamCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveTeamCartItem = (productId: string) => {
    setTeamCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleTransferTeamCartToPos = () => {
    if (teamCart.length === 0) return;
    if (onSendCartToPos) {
      onSendCartToPos(teamCart);
    } else {
      onNavigateToView('pos');
    }
    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'sale_order',
      title: `ส่งบิลตะกร้าสินค้า ${teamCart.length} รายการไป POS`,
      detail: `ส่งบิลตะกร้าสินค้า ${teamCart.length} รายการ (รวม ฿${teamCartTotal.toLocaleString()}) ไปยังแคชเชียร์ POS`,
      branch_name: currentEmployee.branch_name,
    });
    setTeamCart([]);
    setIsTeamCartDrawerOpen(false);
    triggerToast(`ส่งบิล ${teamCart.length} รายการไปยังเคาน์เตอร์ POS เรียบร้อยแล้ว`, 'success');
  };

  const handleCompleteQuickSale = () => {
    if (teamCart.length === 0) return;
    const newSaleId = 'SALE-MOB-' + Date.now().toString().slice(-6);
    const updatedProducts = products.map((p) => {
      const found = teamCart.find((c) => c.product.id === p.id);
      if (found) {
        return { ...p, stock: Math.max(0, p.stock - found.quantity) };
      }
      return p;
    });

    const newSale: Sale = {
      id: newSaleId,
      created_at: new Date().toISOString(),
      channel: 'pos',
      status: 'ready',
      payment_status: 'paid',
      payment_method: quickPaymentMethod,
      subtotal: teamCartTotal,
      discount: 0,
      delivery_fee: 0,
      total: teamCartTotal,
      customer_id: 'cust-003',
      customer_name: 'ลูกค้าหน้าร้าน (Floor Walk-in)',
      items: teamCart.map((it, idx) => ({
        id: `${newSaleId}-item-${idx}`,
        sale_id: newSaleId,
        product_id: it.product.id,
        name: it.product.name,
        quantity: it.quantity,
        unit_price: it.product.price,
        unit_cost: it.product.cost || Math.round(it.product.price * 0.4),
        line_total: it.product.price * it.quantity,
        sku: it.product.sku,
      })),
    };

    if (onQuickSaleCompleted) {
      onQuickSaleCompleted(newSale, updatedProducts);
    }

    const earnedCommission = Math.round((teamCartTotal * (currentEmployee.commission_rate_pct / 100)));
    if (earnedCommission > 0) {
      const newComm: CommissionRecord = {
        id: 'comm-' + Date.now(),
        employee_id: currentEmployee.id,
        employee_name: currentEmployee.name,
        transaction_type: 'product_sale',
        reference_id: newSaleId,
        description: `ขายสินค้าเคลื่อนที่ (${teamCart.length} รายการ)`,
        amount_base: teamCartTotal,
        rate_pct: currentEmployee.commission_rate_pct,
        commission_earned: earnedCommission,
        customer_name: 'ลูกค้าหน้าร้าน (Floor Walk-in)',
        created_at: new Date().toISOString(),
        payout_status: 'approved',
      };
      onUpdateCommissions([newComm, ...commissions]);
    }

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'sale_order',
      title: `ปิดการขายเคลื่อนที่ ฿${teamCartTotal.toLocaleString()}`,
      detail: `ปิดการขายด่วนผ่าน TeamApp Floor Scanner ฿${teamCartTotal.toLocaleString()} (${quickPaymentMethod}) ได้รับคอมมิชชั่น ฿${earnedCommission}`,
      branch_name: currentEmployee.branch_name,
    });

    setTeamCart([]);
    setQuickPaymentModalOpen(false);
    setIsTeamCartDrawerOpen(false);
    triggerToast(`ชำระเงินสำเร็จ! บันทึกยอดขาย ฿${teamCartTotal.toLocaleString()} และคอมมิชชั่นเรียบร้อย`, 'success');
  };

  // Currently logged-in or inspected employee
  const currentEmployee = useMemo(() => {
    const found = employees.find(
      (e) =>
        e.name.toLowerCase().includes(currentStaffName.toLowerCase()) ||
        e.nickname.toLowerCase().includes(currentStaffName.toLowerCase()) ||
        currentStaffName.toLowerCase().includes(e.nickname.toLowerCase())
    );
    return found || employees[2]; // Default to ช่างเมย์ or first active
  }, [employees, currentStaffName]);

  // Selected employee for viewing details / permissions modal
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false);

  // New Employee Modal state
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpNickname, setNewEmpNickname] = useState('');
  const [newEmpPosition, setNewEmpPosition] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<UserRole>('beauty_staff');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpCommissionRate, setNewEmpCommissionRate] = useState(25);
  const [newEmpBaseSalary, setNewEmpBaseSalary] = useState(18000);

  // Task creation state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState(employees[0]?.id || '');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDueTime, setNewTaskDueTime] = useState('17:00');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskItem['category']>('general');

  // Checklist interactive state
  const [checklistMode, setChecklistMode] = useState<'opening' | 'closing'>('opening');
  const [openingChecked, setOpeningChecked] = useState<Record<string, boolean>>({});
  const [closingChecked, setClosingChecked] = useState<Record<string, boolean>>({});
  const [closingActualCash, setClosingActualCash] = useState<string>('8200');
  const [closingCashReason, setClosingCashReason] = useState<string>('');
  const [checklistSubmittedRecords, setChecklistSubmittedRecords] = useState<StoreChecklistRecord[]>([
    {
      id: 'rec-001',
      type: 'opening',
      branch_id: 'br-001',
      branch_name: 'สาขาเมืองเอก / รังสิต มินิมาร์ท',
      staff_id: 'emp-004',
      staff_name: 'สมศรี (Senior Cashier)',
      completed_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      items_completed: 8,
      total_items: 8,
      cash_amount_checked: 2000,
    },
  ]);

  // Approval filter and action note
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [approvalResolutionNote, setApprovalResolutionNote] = useState('');
  const [selectedApprovalForAction, setSelectedApprovalForAction] = useState<ApprovalRequest | null>(null);

  // New Request Submission Modal (For Staff to request refund, discount, stock adjustment)
  const [isSubmitRequestOpen, setIsSubmitRequestOpen] = useState(false);
  const [reqType, setReqType] = useState<ApprovalRequest['type']>('refund');
  const [reqTitle, setReqTitle] = useState('');
  const [reqDetails, setReqDetails] = useState('');
  const [reqAmount, setReqAmount] = useState<number>(100);

  // Academy course preview
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);

  // Search and directory filter
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState<string>('all');

  // Low stock alert items for Staff Workspace
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.reorder);
  }, [products]);

  // Today Bookings assigned to current employee
  const todayBookingsForCurrentStaff = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.technician_name?.toLowerCase().includes(currentEmployee.nickname.toLowerCase()) ||
        b.technician_name?.toLowerCase().includes(currentEmployee.name.toLowerCase()) ||
        currentEmployee.role === 'owner' ||
        currentEmployee.role === 'manager'
    );
  }, [bookings, currentEmployee]);

  // Clock In / Out Handler
  const handleToggleAttendance = (targetStatus: EmployeeProfile['attendance_status']) => {
    playTactileHaptic('keypad');
    const updatedEmployees = employees.map((emp) => {
      if (emp.id === currentEmployee.id) {
        return {
          ...emp,
          attendance_status: targetStatus,
          last_clock_in: targetStatus === 'clocked_in' ? new Date().toISOString() : emp.last_clock_in,
          last_clock_out: targetStatus === 'clocked_out' ? new Date().toISOString() : emp.last_clock_out,
        };
      }
      return emp;
    });
    onUpdateEmployees(updatedEmployees);

    const actionText =
      targetStatus === 'clocked_in'
        ? 'ลงเวลาเข้างาน (Clock In)'
        : targetStatus === 'on_break'
        ? 'ขอพักเบรกระหว่างวัน (On Break)'
        : 'ลงเวลาออกงาน (Clock Out)';

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: targetStatus === 'clocked_in' ? 'clock_in' : 'clock_out',
      title: actionText,
      detail: `พนักงาน ${currentEmployee.nickname} เปลี่ยนสถานะเป็น ${targetStatus}`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Toggle Task Checklist Item
  const handleToggleChecklist = (taskId: string, itemId: string) => {
    playTactileHaptic('keypad');
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextChecklist = t.checklist.map((c) => (c.id === itemId ? { ...c, completed: !c.completed } : c));
        const allCompleted = nextChecklist.every((c) => c.completed);
        const anyCompleted = nextChecklist.some((c) => c.completed);
        const nextStatus: TaskStatus = allCompleted ? 'completed' : anyCompleted ? 'in_progress' : 'todo';
        return {
          ...t,
          checklist: nextChecklist,
          status: nextStatus,
          completed_at: allCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  // Update Task Status directly
  const handleUpdateTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    playTactileHaptic('keypad');
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: nextStatus,
          completed_at: nextStatus === 'completed' || nextStatus === 'verified' ? new Date().toISOString() : undefined,
          verified_by: nextStatus === 'verified' ? currentStaffName : undefined,
        };
      }
      return t;
    });
    onUpdateTasks(updated);

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'checklist',
      title: `อัปเดตสถานะงาน: ${nextStatus.toUpperCase()}`,
      detail: `งานรหัส #${taskId} ได้รับการอัปเดตเป็น ${nextStatus}`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Create New Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const assignee = employees.find((e) => e.id === newTaskAssigneeId) || currentEmployee;
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      description: newTaskDesc,
      branch_id: assignee.branch_id,
      created_by_name: currentStaffName,
      assigned_to_id: assignee.id,
      assigned_to_name: assignee.nickname,
      priority: newTaskPriority,
      status: 'todo',
      due_time: newTaskDueTime,
      category: newTaskCategory,
      checklist: [
        { id: `c-${Date.now()}-1`, label: 'ขั้นตอนเริ่มต้น: จัดเตรียมเครื่องมือและพื้นที่', completed: false },
        { id: `c-${Date.now()}-2`, label: 'ขั้นตอนดำเนินการ: ปฏิบัติตามมาตรฐานการทำงาน', completed: false },
        { id: `c-${Date.now()}-3`, label: 'ขั้นตอนตรวจสอบ: ถ่ายรูปและตรวจความเรียบร้อย', completed: false },
      ],
      created_at: new Date().toISOString(),
    };

    onUpdateTasks([newTask, ...tasks]);
    setIsCreateTaskOpen(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    playTactileHaptic('success');

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'checklist',
      title: `มอบหมายงานใหม่: ${newTask.title}`,
      detail: `มอบหมายให้ ${assignee.nickname} กำหนดเสร็จ ${newTask.due_time} น.`,
      branch_name: assignee.branch_name,
    });
  };

  // Submit Opening Store Checklist
  const handleSubmitOpeningChecklist = () => {
    playTactileHaptic('success');
    const completedCount = Object.values(openingChecked).filter(Boolean).length;
    const record: StoreChecklistRecord = {
      id: `chk-op-${Date.now()}`,
      type: 'opening',
      branch_id: currentEmployee.branch_id,
      branch_name: currentEmployee.branch_name,
      staff_id: currentEmployee.id,
      staff_name: currentEmployee.name,
      completed_at: new Date().toISOString(),
      items_completed: completedCount,
      total_items: OPENING_CHECKLIST_TEMPLATE.length,
      cash_amount_checked: 2000,
      notes: 'เปิดร้านเรียบร้อย ระบบพร้อมให้บริการทั้งมินิมาร์ทและซาลอน',
    };
    setChecklistSubmittedRecords([record, ...checklistSubmittedRecords]);

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'checklist',
      title: 'OPEN STORE: บันทึกรายการตรวจเปิดร้าน',
      detail: `ตรวจสอบครบ ${completedCount}/${OPENING_CHECKLIST_TEMPLATE.length} ข้อ เงินทอนเปิดกะ ฿2,000`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Submit Closing Store Checklist with Cash Variance check
  const handleSubmitClosingChecklist = () => {
    playTactileHaptic('success');
    const completedCount = Object.values(closingChecked).filter(Boolean).length;
    const actual = parseFloat(closingActualCash) || 0;
    const expected = 8450; // Expected cash from POS sales
    const diff = actual - expected;

    const record: StoreChecklistRecord = {
      id: `chk-cl-${Date.now()}`,
      type: 'closing',
      branch_id: currentEmployee.branch_id,
      branch_name: currentEmployee.branch_name,
      staff_id: currentEmployee.id,
      staff_name: currentEmployee.name,
      completed_at: new Date().toISOString(),
      items_completed: completedCount,
      total_items: CLOSING_CHECKLIST_TEMPLATE.length,
      cash_amount_checked: actual,
      notes:
        diff !== 0
          ? `ยอดเงินสดไม่ตรงส่วนต่าง ฿${diff} | เหตุผล: ${closingCashReason || 'ไม่มีการระบุ'}`
          : 'ปิดร้านเรียบร้อย เงินสดครบถ้วน 100%',
    };
    setChecklistSubmittedRecords([record, ...checklistSubmittedRecords]);

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'checklist',
      title: 'CLOSE STORE: บันทึกรายการตรวจปิดร้าน',
      detail: `เงินสดนับได้ ฿${actual.toLocaleString()} (ส่วนต่าง ฿${diff.toLocaleString()}) ${
        closingCashReason ? `เหตุผล: ${closingCashReason}` : ''
      }`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Approve / Reject Request
  const handleResolveApproval = (approvalId: string, decision: 'approved' | 'rejected') => {
    playTactileHaptic(decision === 'approved' ? 'success' : 'error');
    const updated = approvals.map((appr) => {
      if (appr.id === approvalId) {
        return {
          ...appr,
          status: decision,
          resolved_at: new Date().toISOString(),
          resolved_by: currentStaffName,
          resolution_note: approvalResolutionNote || (decision === 'approved' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธคำขอ'),
        };
      }
      return appr;
    });
    onUpdateApprovals(updated);
    setSelectedApprovalForAction(null);
    setApprovalResolutionNote('');

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'request_approval',
      title: `${decision === 'approved' ? 'อนุมัติ (Approved)' : 'ปฏิเสธ (Rejected)'} คำขอ #${approvalId}`,
      detail: `ดำเนินการโดย ${currentStaffName}`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Staff Submits New Request
  const handleStaffSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle.trim()) return;

    const newReq: ApprovalRequest = {
      id: `appr-${Date.now()}`,
      type: reqType,
      title: reqTitle,
      requested_by_id: currentEmployee.id,
      requested_by_name: `${currentEmployee.nickname} (${currentEmployee.position})`,
      branch_id: currentEmployee.branch_id,
      details: reqDetails,
      amount: reqAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    onUpdateApprovals([newReq, ...approvals]);
    setIsSubmitRequestOpen(false);
    setReqTitle('');
    setReqDetails('');
    playTactileHaptic('success');

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'request_approval',
      title: `ยื่นคำขออนุมัติใหม่: ${newReq.title}`,
      detail: `จำนวนเงิน ฿${reqAmount.toLocaleString()} โดย ${currentEmployee.nickname}`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Save Permissions for Selected Employee
  const handleSavePermissions = (newPermissions: StaffPermissions) => {
    if (!selectedEmployee) return;
    const updated = employees.map((emp) => {
      if (emp.id === selectedEmployee.id) {
        return { ...emp, permissions: newPermissions };
      }
      return emp;
    });
    onUpdateEmployees(updated);
    setSelectedEmployee({ ...selectedEmployee, permissions: newPermissions });
    setIsEditPermissionsOpen(false);
    playTactileHaptic('success');

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'login',
      title: `อัปเดตสิทธิ์การใช้งาน (Permissions) ของ ${selectedEmployee.nickname}`,
      detail: 'ปรับแก้ค่า Role & Granular Permission Matrix สำเร็จ',
      branch_name: selectedEmployee.branch_name,
    });
  };

  // Employee Lifecycle transition (e.g. Active -> Offboarded / Suspended)
  const handleUpdateEmployeeStatus = (empId: string, nextStatus: EmployeeProfile['status']) => {
    playTactileHaptic('keypad');
    const updated = employees.map((emp) => {
      if (emp.id === empId) {
        return { ...emp, status: nextStatus };
      }
      return emp;
    });
    onUpdateEmployees(updated);

    onAddActivity({
      employee_id: currentEmployee.id,
      employee_name: currentEmployee.name,
      action_type: 'login',
      title: `ปรับสถานะพนักงาน (${nextStatus.toUpperCase()})`,
      detail: `พนักงานรหัส #${empId} เปลี่ยนสถานะเป็น ${nextStatus}`,
      branch_name: currentEmployee.branch_name,
    });
  };

  // Filtered employees for directory
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        emp.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
        emp.nickname.toLowerCase().includes(directorySearch.toLowerCase()) ||
        emp.position.toLowerCase().includes(directorySearch.toLowerCase()) ||
        emp.phone.includes(directorySearch);

      const matchRole = directoryRoleFilter === 'all' || emp.role === directoryRoleFilter;
      return matchSearch && matchRole;
    });
  }, [employees, directorySearch, directoryRoleFilter]);

  // Filtered approvals
  const filteredApprovals = useMemo(() => {
    if (approvalFilter === 'pending') return approvals.filter((a) => a.status === 'pending');
    if (approvalFilter === 'resolved') return approvals.filter((a) => a.status !== 'pending');
    return approvals;
  }, [approvals, approvalFilter]);

  // Overall Team Stats for Owner Header
  const totalEmployeesCount = employees.length;
  const activeWorkingCount = employees.filter((e) => e.attendance_status === 'clocked_in').length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;
  const todayTotalCommissions = commissions.reduce((sum, c) => sum + c.commission_earned, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 1. Header & Architecture Breadcrumb */}
      <div className="bg-[#171717] text-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden border border-[#2D2A26]">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold tracking-widest text-[#E6A055] uppercase block">
                EQUAL1 TEAM OS · PEOPLE &amp; OPERATING ENGINE
              </span>
              <span className="text-xs text-[#8E8B82]">·</span>
              <span className="text-xs text-[#C4BEB5]">สถาปัตยกรรมจัดการคน งาน สิทธิ์ เงิน และความรับผิดชอบ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {isManagement ? 'ศูนย์บัญชาการทีมงาน & ปฏิบัติการร้าน' : `พื้นที่ทำงานของฉัน (Staff Workspace)`}
            </h1>
            <p className="text-sm text-[#B0ACA0] mt-1 max-w-2xl">
              เชื่อมโยงตารางงาน คิวนัดหมาย งานที่ต้องทำ (Tasks) สิทธิ์ใช้งานแบบละเอียด รายการเปิด-ปิดร้าน และระบบคอมมิชชั่นแบบเรียลไทม์
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Scan QR / Barcode Button using device camera */}
            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center gap-2 border border-emerald-400/40 active:scale-95"
              title="เปิดกล้องสแกนบาร์โค้ดสินค้าหรือบัตรสมาชิกเพื่อเพิ่มลงตะกร้า"
            >
              <Camera className="w-4 h-4 text-emerald-200" />
              <span>Scan QR / ยิงบาร์โค้ด</span>
              {teamCart.length > 0 && (
                <span className="px-1.5 py-0.5 bg-white text-emerald-800 text-[10px] font-black rounded-full shadow">
                  {teamCart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>

            {teamCart.length > 0 && (
              <button
                onClick={() => setIsTeamCartDrawerOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-white text-[#171717] font-black text-xs shadow transition flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#E6A055]" />
                <span>ตะกร้าทีม ({teamCart.reduce((s, i) => s + i.quantity, 0)})</span>
              </button>
            )}

            {/* Quick Switch to My Work preview for Owner or Action */}
            {isOwner && (
              <button
                onClick={() => setActiveTab(activeTab === 'my-work' ? 'team-directory' : 'my-work')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 backdrop-blur transition flex items-center gap-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-[#E6A055]" />
                <span>{activeTab === 'my-work' ? 'สลับไปมุมมอง Owner (Team Control)' : 'ดูหน้างานของฉัน (My Work)'}</span>
              </button>
            )}

            <button
              onClick={() => setIsSubmitRequestOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#E6A055] hover:bg-amber-400 text-black font-bold text-xs shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ยื่นคำขออนุมัติ (Request)</span>
            </button>
          </div>
        </div>

        {/* Executive Pulse Strip (Commissions and Pending Approvals strictly for Owner) */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[11px] text-[#A8A499] block font-medium">พนักงานในระบบ</span>
            <strong className="text-xl font-bold text-white tabular-nums">
              {totalEmployeesCount} คน <span className="text-emerald-400 text-xs font-normal">(กำลังเข้ากะ {activeWorkingCount})</span>
            </strong>
          </div>
          {isOwner ? (
            <>
              <div>
                <span className="text-[11px] text-[#A8A499] block font-medium">คำขอรออนุมัติ (Approvals)</span>
                <strong className={`text-xl font-bold tabular-nums ${pendingApprovalsCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {pendingApprovalsCount} รายการ
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#A8A499] block font-medium">คอมมิชชั่นทีมสะสมวันนี้</span>
                <strong className="text-xl font-bold text-[#E6A055] tabular-nums">
                  ฿{todayTotalCommissions.toLocaleString()}
                </strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-[11px] text-[#A8A499] block font-medium">สถานะสาขา</span>
                <strong className="text-base font-bold text-emerald-400">
                  เปิดให้บริการตามปกติ
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-[#A8A499] block font-medium">เวลาทำการ</span>
                <strong className="text-base font-bold text-white">
                  10:00 - 20:00 น.
                </strong>
              </div>
            </>
          )}
          <div>
            <span className="text-[11px] text-[#A8A499] block font-medium">งานของฉันวันนี้</span>
            <strong className="text-xl font-bold text-white tabular-nums">
              {tasks.filter((t) => t.assigned_to_id === currentEmployee.id && t.status !== 'completed').length} งาน
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs (Strict Role-Based Separation) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-[#E6E4DD]">
        {/* COMMON TABS (Visible to all staff) */}
        <button
          onClick={() => setActiveTab('my-work')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'my-work'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-[#E6A055]" />
          <span>My Work (งานของฉัน)</span>
        </button>

        <button
          onClick={() => setActiveTab('checklists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'checklists'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5 text-purple-500" />
          <span>Opening / Closing Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('academy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            activeTab === 'academy'
              ? 'bg-[#171717] text-white shadow-sm'
              : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
          <span>EQUAL1 Academy ({trainingCourses.length})</span>
        </button>

        {/* 5 OWNER-ONLY PILLARS (Visible to Owner ONLY) */}
        {isOwner ? (
          <>
            <span className="text-[#CCC] px-1 hidden sm:inline">|</span>

            <button
              onClick={() => setActiveTab('team-directory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === 'team-directory'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>👑 Team Control (ผังพนักงาน &amp; สิทธิ์)</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>👑 Task Management ({tasks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === 'approvals'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>👑 ศูนย์อนุมัติ (Approvals)</span>
              {pendingApprovalsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === 'commissions'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>👑 ระบบคอมมิชชั่น &amp; เงินสด</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'text-[#666] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>👑 Staff Activity Audit</span>
            </button>
          </>
        ) : (
          <button
            onClick={onRequestOwnerLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer shrink-0 ml-auto"
            title="พื้นที่หวงห้ามเฉพาะเจ้าของกิจการ (Owner Only)"
          >
            <Lock className="w-3 h-3 text-amber-600" />
            <span>เข้าสู่ระบบเจ้าของเพื่อดู Approvals / Tasks / ค่าคอม / Audit</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MY WORK (STAFF WORKSPACE) - "วันนี้ฉันต้องทำอะไร?"                     */}
      {/* ========================================================================= */}
      {activeTab === 'my-work' && (
        <div className="space-y-6">
          {/* Staff Attendance & Daily Greeting Strip */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF9F5] border border-[#E6E4DD] flex items-center justify-center text-3xl shadow-inner">
                {currentEmployee.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-[#171717]">
                    สวัสดี, {currentEmployee.name}
                  </h2>
                  <span className="text-xs text-[#888]">·</span>
                  <span className="text-xs font-semibold text-[#E6A055]">{currentEmployee.position}</span>
                </div>
                <p className="text-xs text-[#666] mt-0.5 flex items-center gap-2">
                  <span>สาขา: {currentEmployee.branch_name}</span>
                  <span aria-hidden="true">·</span>
                  <span>สถานะเข้างาน:</span>
                  <span
                    className={`font-bold ${
                      currentEmployee.attendance_status === 'clocked_in'
                        ? 'text-emerald-600'
                        : currentEmployee.attendance_status === 'on_break'
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {currentEmployee.attendance_status === 'clocked_in'
                      ? '● ปฏิบัติหน้าที่อยู่ (Clocked In)'
                      : currentEmployee.attendance_status === 'on_break'
                      ? '☕ พักเบรก (On Break)'
                      : '○ ออกงานแล้ว (Clocked Out)'}
                  </span>
                </p>
              </div>
            </div>

            {/* Attendance Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAttendance('clocked_in')}
                disabled={currentEmployee.attendance_status === 'clocked_in'}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ลงเวลาเข้างาน</span>
              </button>

              <button
                onClick={() => handleToggleAttendance('on_break')}
                disabled={currentEmployee.attendance_status === 'on_break'}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>พักเบรก</span>
              </button>

              <button
                onClick={() => handleToggleAttendance('clocked_out')}
                disabled={currentEmployee.attendance_status === 'clocked_out'}
                className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#DDD9CE] text-[#444] font-bold text-xs rounded-xl transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ออกงาน</span>
              </button>
            </div>
          </div>

          {/* Today's 3-Pillar Performance Summary for Staff */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm">
              <span className="text-[11px] text-[#8C887B] font-medium block mb-1">ยอดขายที่ฉันทำได้วันนี้ (Today Sales)</span>
              <strong className="text-2xl font-black text-[#171717] tabular-nums">
                ฿{currentEmployee.today_sales.toLocaleString()}
              </strong>
              <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>นับรวมรายการ POS และคำสั่งซื้อที่รับผิดชอบ</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm">
              <span className="text-[11px] text-[#8C887B] font-medium block mb-1">บริการที่ดูแลสำเร็จวันนี้ (Services Done)</span>
              <strong className="text-2xl font-black text-indigo-600 tabular-nums">
                {currentEmployee.today_services_count} คิว
              </strong>
              <p className="text-[11px] text-[#666] mt-1">
                คิวนัดหมายซาลอน &amp; ทรีตเมนต์
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm bg-gradient-to-br from-amber-50/50 to-orange-50/30">
              <span className="text-[11px] text-[#8C887B] font-medium block mb-1">คอมมิชชั่นของฉันวันนี้ (Earned Commission)</span>
              <strong className="text-2xl font-black text-[#E6A055] tabular-nums">
                ฿{currentEmployee.today_commission.toLocaleString()}
              </strong>
              <p className="text-[11px] text-[#666] mt-1">
                อัตราคอมมิชชั่นประจำตำแหน่ง: {currentEmployee.commission_rate_pct}%
              </p>
            </div>
          </div>

          {/* Mobile Floor Scanner & Quick Selling Station */}
          <div className="bg-gradient-to-r from-[#1E1C1A] to-[#262420] text-white rounded-3xl p-6 border border-white/10 shadow-lg relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E6A055] text-black flex items-center justify-center font-black shadow-md">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      สแกนบาร์โค้ดสินค้าหน้าร้าน (Mobile Barcode Scanner &amp; Floor Cart)
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-xs text-[#B5B0A4] mt-0.5">
                    ใช้กล้องมือถือ/แท็บเล็ตสแกนบาร์โค้ดสินค้าหรือบัตรสมาชิกเพื่อเพิ่มลงตะกร้าทันที พร้อมระบบคิดคอมมิชชั่นช่างอัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>เปิดกล้องสแกนทันที (Scan Barcode)</span>
                </button>

                {teamCart.length > 0 && (
                  <button
                    onClick={() => setIsTeamCartDrawerOpen(true)}
                    className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 border border-white/15"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#E6A055]" />
                    <span>ดูตะกร้า ({teamCart.reduce((s, i) => s + i.quantity, 0)})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Demo Barcodes & Active Cart Preview */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 space-y-2">
                <span className="text-[11px] text-[#A8A499] block font-mono">
                  ทดสอบยิงบาร์โค้ดตัวอย่างสินค้า (Quick Test Barcodes):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {products.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleProductScanned(p)}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/10 rounded-xl text-xs text-[#FAF8F5] transition flex items-center gap-1.5"
                    >
                      <Barcode className="w-3.5 h-3.5 text-[#E6A055]" />
                      <span className="truncate max-w-[120px]">{p.name.split(' ')[0]}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">฿{p.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-5 bg-black/40 rounded-2xl p-3 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8C887B] block">สินค้าในตะกร้าทีม</span>
                  <strong className="text-sm font-black text-white tabular-nums">
                    {teamCart.length === 0 ? 'ยังไม่มีสินค้า' : `${teamCart.reduce((s, i) => s + i.quantity, 0)} ชิ้น · ฿${teamCartTotal.toLocaleString()}`}
                  </strong>
                </div>

                {teamCart.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleTransferTeamCartToPos}
                      className="px-3 py-1.5 bg-[#E6A055] hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition flex items-center gap-1"
                    >
                      <span>ส่งเข้า POS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setQuickPaymentModalOpen(true)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                    >
                      ชำระด่วน
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#A8A499] italic">
                    ส่องกล้องหรือคลิกตัวอย่างเพื่อเพิ่ม
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Low Stock Urgent Alert Banner */}
          {lowStockProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-950 block">แจ้งเตือนสินค้าและอุปกรณ์สต๊อกต่ำในสาขา</strong>
                  <p className="text-amber-800 mt-0.5">
                    {lowStockProducts.map((p) => `${p.name} (เหลือ ${p.stock} ชิ้น)`).slice(0, 3).join(' · ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateToView('inventory')}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shrink-0"
              >
                ดูคลังสินค้า
              </button>
            </div>
          )}

          {/* Today's Schedule & Tasks 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column A: Today's Timeline Schedule */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#171717] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#E6A055]" />
                    <span>ตารางนัดหมายและบริการวันนี้</span>
                  </h3>
                  <span className="text-xs text-[#888]">คิวที่มอบหมายให้ {currentEmployee.nickname}</span>
                </div>
                <button
                  onClick={() => onNavigateToView('salon-queue')}
                  className="text-xs font-bold text-[#E6A055] hover:underline"
                >
                  เปิดคิวเต็ม →
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {todayBookingsForCurrentStaff.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#888] bg-[#FAF8F5] rounded-2xl border border-dashed border-[#DDD]">
                    ไม่มีคิวนัดหมายที่ต้องให้บริการในวันนี้
                  </div>
                ) : (
                  todayBookingsForCurrentStaff.map((bk, idx) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFECE6] flex items-start justify-between gap-3 hover:border-[#D6D2C4] transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E0DCD3] flex flex-col items-center justify-center text-xs font-bold text-[#171717] shadow-sm shrink-0">
                          <span>{bk.starts_at ? new Date(bk.starts_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '10:00'}</span>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#171717] block">{bk.service_name}</span>
                          <span className="text-[11px] text-[#666]">
                            ลูกค้า: <strong>{bk.customer_name}</strong> · {bk.duration_minutes} นาที
                          </span>
                          <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">
                            ราคา ฿{bk.price.toLocaleString()} (คอมมิชชั่นประมาณ ฿{(bk.price * (currentEmployee.commission_rate_pct / 100)).toFixed(0)})
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#DDD] text-[10px] font-bold text-[#444]">
                        {bk.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column B: Today's Tasks & Checklists */}
            <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#171717] flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>รายการงานประจำวัน (Daily Tasks)</span>
                  </h3>
                  <span className="text-xs text-[#888]">งานที่ได้รับมอบหมาย</span>
                </div>
                <button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="px-2.5 py-1 bg-[#FAF9F5] hover:bg-[#F2EFE9] border border-[#DDD9CE] text-[#171717] rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-[#E6A055]" />
                  <span>เพิ่มงาน</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {tasks
                  .filter((t) => t.assigned_to_id === currentEmployee.id || isManagement)
                  .slice(0, 4)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EFECE6] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#171717]">{task.title}</h4>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-100 text-rose-800'
                                  : task.priority === 'high'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {task.priority.toUpperCase()}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-[#666] mt-0.5">{task.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-[#888] font-mono shrink-0">
                          ครบกำหนด: {task.due_time || '17:00'}
                        </span>
                      </div>

                      {/* Checklist Items */}
                      <div className="space-y-1.5 pt-1 border-t border-[#EAE6DF]">
                        {task.checklist.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 text-xs text-[#444] cursor-pointer hover:text-black select-none"
                          >
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => handleToggleChecklist(task.id, item.id)}
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                            />
                            <span className={item.completed ? 'line-through text-[#999]' : ''}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>

                      {/* Task Status Action Pill */}
                      <div className="flex items-center justify-between text-[11px] pt-1 text-[#888]">
                        <span>ผู้มอบหมาย: {task.created_by_name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.status === 'in_progress' ? 'bg-amber-500 text-black' : 'bg-white border text-[#666]'
                            }`}
                          >
                            ทำอยู่
                          </button>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              task.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-white border text-[#666]'
                            }`}
                          >
                            เสร็จสิ้น
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEAM CONTROL (DIRECTORY & GRANULAR PERMISSIONS MATRIX)             */}
      {/* ========================================================================= */}
      {isOwner && activeTab === 'team-directory' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#E6E4DD] shadow-sm">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888]" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, ตำแหน่ง, เบอร์โทร..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl text-xs outline-none focus:border-[#E6A055]"
                />
              </div>

              <select
                value={directoryRoleFilter}
                onChange={(e) => setDirectoryRoleFilter(e.target.value)}
                className="py-2 px-3 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl text-xs outline-none font-medium cursor-pointer"
              >
                <option value="all">ทุกบทบาท (All Roles)</option>
                <option value="owner">Owner / ผู้บริหาร</option>
                <option value="manager">Manager / ผู้จัดการ</option>
                <option value="beauty_staff">Beauty Staff / ซาลอน</option>
                <option value="cashier">Cashier / แคชเชียร์</option>
                <option value="stock">Stock / คลังสินค้า</option>
                <option value="delivery">Delivery / ไรเดอร์</option>
              </select>
            </div>

            <button
              onClick={() => setIsAddEmployeeOpen(true)}
              className="px-4 py-2 bg-[#171717] hover:bg-[#333] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#E6A055]" />
              <span>เพิ่มพนักงานใหม่ (Onboarding)</span>
            </button>
          </div>

          {/* Employees Table Grid */}
          <div className="bg-white rounded-3xl border border-[#E6E4DD] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F5] text-[#8C887B] border-b border-[#E6E4DD] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">พนักงาน (Profile)</th>
                    <th className="py-3 px-4">ตำแหน่ง &amp; สาขา</th>
                    <th className="py-3 px-4">บทบาท (Role)</th>
                    <th className="py-3 px-4">สถานะกะ (Attendance)</th>
                    <th className="py-3 px-4">คอมมิชชั่น (%)</th>
                    <th className="py-3 px-4">ยอดขายวันนี้</th>
                    <th className="py-3 px-4 text-right">สิทธิ์ &amp; การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFECE6]">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#FAF9F5]/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#DDD] flex items-center justify-center">
                            {emp.avatar}
                          </span>
                          <div>
                            <strong className="text-xs font-bold text-[#171717] block">{emp.name}</strong>
                            <span className="text-[11px] text-[#666]">{emp.nickname} · {emp.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#171717] block">{emp.position}</span>
                        <span className="text-[11px] text-[#888]">{emp.branch_name}</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px] font-bold">
                          {emp.role.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold flex items-center gap-1.5 ${
                            emp.attendance_status === 'clocked_in'
                              ? 'text-emerald-600'
                              : emp.attendance_status === 'on_break'
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>
                            {emp.attendance_status === 'clocked_in'
                              ? 'กำลังทำงาน'
                              : emp.attendance_status === 'on_break'
                              ? 'พักเบรก'
                              : 'ออกกะ'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-[#E6A055]">
                        {emp.commission_rate_pct}%
                      </td>

                      <td className="py-3 px-4 font-bold text-[#171717]">
                        ฿{emp.today_sales.toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsEditPermissionsOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-[#F2EFE9] border border-[#DDD9CE] rounded-lg text-[#171717] font-semibold text-[11px] transition"
                        >
                          สิทธิ์ใช้งาน (Permissions)
                        </button>

                        <button
                          onClick={() => {
                            const next = emp.status === 'active' ? 'suspended' : 'active';
                            handleUpdateEmployeeStatus(emp.id, next);
                          }}
                          className="px-2 py-1 text-[11px] text-[#777] hover:text-rose-600 transition"
                          title="เปลี่ยนสถานะพนักงาน"
                        >
                          {emp.status === 'active' ? 'ระงับ' : 'เปิดใช้งาน'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TASKS MANAGEMENT (KANBAN / WORKFLOW TODO -> VERIFIED)              */}
      {/* ========================================================================= */}
      {isOwner && activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">ผังการจัดการงานส่วนกลาง (Task Workflow)</h2>
              <p className="text-xs text-[#666]">
                ติดตามความคืบหน้าระหว่าง TODO → IN PROGRESS → WAITING → COMPLETED → VERIFIED
              </p>
            </div>

            <button
              onClick={() => setIsCreateTaskOpen(true)}
              className="px-3.5 py-2 bg-[#E6A055] hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>สร้างงานใหม่ (New Task)</span>
            </button>
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['todo', 'in_progress', 'completed', 'verified'] as TaskStatus[]).map((colStatus) => {
              const colTasks = tasks.filter((t) => t.status === colStatus);
              const colTitles: Record<TaskStatus, { label: string; color: string }> = {
                todo: { label: 'รอดำเนินการ (TODO)', color: 'text-slate-700 bg-slate-100' },
                in_progress: { label: 'กำลังทำ (IN PROGRESS)', color: 'text-amber-800 bg-amber-100' },
                waiting: { label: 'รอตรวจ (WAITING)', color: 'text-blue-800 bg-blue-100' },
                completed: { label: 'เสร็จแล้ว (COMPLETED)', color: 'text-emerald-800 bg-emerald-100' },
                verified: { label: 'ตรวจยืนยันแล้ว (VERIFIED)', color: 'text-purple-800 bg-purple-100' },
              };

              return (
                <div key={colStatus} className="bg-[#FAF9F5] rounded-3xl p-4 border border-[#E6E4DD] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${colTitles[colStatus].color}`}>
                      {colTitles[colStatus].label}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#888]">{colTasks.length}</span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#AAA] border border-dashed border-[#DDD] rounded-2xl">
                        ไม่มีงานในขั้นตอนนี้
                      </div>
                    ) : (
                      colTasks.map((t) => (
                        <div
                          key={t.id}
                          className="bg-white p-4 rounded-2xl border border-[#E6E4DD] shadow-sm space-y-2 hover:border-[#CCC] transition"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-xs font-bold text-[#171717]">{t.title}</h4>
                            <span
                              className={`text-[9px] font-bold px-1 rounded uppercase ${
                                t.priority === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>

                          {t.description && <p className="text-[11px] text-[#666] line-clamp-2">{t.description}</p>}

                          <div className="text-[10px] text-[#888] flex items-center justify-between pt-1 border-t border-[#EEE]">
                            <span>ผู้รับผิดชอบ: <strong className="text-[#333]">{t.assigned_to_name}</strong></span>
                            <span>{t.due_time} น.</span>
                          </div>

                          {/* Quick Advance Button */}
                          <div className="pt-2 flex justify-end gap-1">
                            {colStatus === 'todo' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(t.id, 'in_progress')}
                                className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-bold"
                              >
                                เริ่มทำ →
                              </button>
                            )}
                            {colStatus === 'in_progress' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold"
                              >
                                ส่งงาน (Complete) →
                              </button>
                            )}
                            {colStatus === 'completed' && isManagement && (
                              <button
                                onClick={() => handleUpdateTaskStatus(t.id, 'verified')}
                                className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded text-[10px] font-bold"
                              >
                                ตรวจรับ (Verify) 🏆
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OPENING / CLOSING CHECKLISTS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'checklists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">รายการตรวจสอบมาตรฐานการเปิด-ปิดร้าน</h2>
              <p className="text-xs text-[#666]">
                ป้องกันความเสียหายเรื่องเงิน สินค้าสูญหาย และเตรียมความพร้อมให้สาขา 100%
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-xl border border-[#DDD9CE]">
              <button
                onClick={() => setChecklistMode('opening')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  checklistMode === 'opening' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#666]'
                }`}
              >
                🌅 Opening (เปิดร้าน 8 ข้อ)
              </button>
              <button
                onClick={() => setChecklistMode('closing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  checklistMode === 'closing' ? 'bg-[#171717] text-white shadow-sm' : 'text-[#666]'
                }`}
              >
                🌙 Closing (ปิดร้าน 7 ข้อ)
              </button>
            </div>
          </div>

          {/* Checklist Interactive Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E6E4DD] shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-[#171717]">
                {checklistMode === 'opening'
                  ? 'รายการตรวจสอบตอนเปิดร้าน (Store Opening Protocol)'
                  : 'รายการตรวจสอบตอนปิดร้าน & กระทบยอดเงินสด (Store Closing & Cash Balance)'}
              </h3>
              <p className="text-xs text-[#777] mt-0.5">
                พนักงานผู้ดำเนินการ: <strong>{currentStaffName}</strong> · บันทึกอัตโนมัติเข้าระบบ Audit Log
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {(checklistMode === 'opening' ? OPENING_CHECKLIST_TEMPLATE : CLOSING_CHECKLIST_TEMPLATE).map((item, idx) => {
                const checked = checklistMode === 'opening' ? !!openingChecked[item.id] : !!closingChecked[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (checklistMode === 'opening') {
                        setOpeningChecked({ ...openingChecked, [item.id]: !checked });
                      } else {
                        setClosingChecked({ ...closingChecked, [item.id]: !checked });
                      }
                    }}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-4 cursor-pointer ${
                      checked
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-[#FAF9F5] border-[#EAE6DF] hover:border-[#D0CCC2] text-[#333]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white border border-[#DDD] flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        checked ? 'bg-emerald-600 text-white shadow-sm' : 'border border-[#CCC] bg-white'
                      }`}
                    >
                      {checked && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Closing Cash Reconciliation Section */}
            {checklistMode === 'closing' && (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-4 text-xs">
                <h4 className="font-bold text-amber-950 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>การตรวจสอบเงินสดในลิ้นชัก (Cash Count &amp; Reconciliation)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="text-[11px] text-[#777] block">ยอดเงินสดที่ระบบคาดหวัง (Expected Cash):</span>
                    <strong className="text-base font-bold text-[#171717]">฿8,450</strong>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="text-[11px] text-[#777] block">เงินสดที่นับได้จริงในลิ้นชัก (Actual Count):</span>
                    <input
                      type="number"
                      value={closingActualCash}
                      onChange={(e) => setClosingActualCash(e.target.value)}
                      className="w-full text-base font-bold text-[#171717] bg-transparent outline-none border-b border-[#DDD] focus:border-[#E6A055] py-0.5"
                    />
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-amber-200">
                    <span className="text-[11px] text-[#777] block">ส่วนต่าง (Variance):</span>
                    <strong
                      className={`text-base font-bold ${
                        (parseFloat(closingActualCash) || 0) - 8450 < 0
                          ? 'text-rose-600'
                          : (parseFloat(closingActualCash) || 0) - 8450 > 0
                          ? 'text-emerald-600'
                          : 'text-slate-800'
                      }`}
                    >
                      ฿{((parseFloat(closingActualCash) || 0) - 8450).toLocaleString()}
                    </strong>
                  </div>
                </div>

                {(parseFloat(closingActualCash) || 0) - 8450 !== 0 && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-900 block">
                      ⚠️ เงินขาด/เกิน ฿{((parseFloat(closingActualCash) || 0) - 8450).toLocaleString()} กรุณาระบุเหตุผลเพื่อบันทึก Audit:
                    </label>
                    <input
                      type="text"
                      placeholder="ระบุเหตุผล เช่น ทอนเงินผิดออเดอร์มินิมาร์ทช่วงเวลาเร่งด่วน..."
                      value={closingCashReason}
                      onChange={(e) => setClosingCashReason(e.target.value)}
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl text-xs outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-[#EAE6DF] flex justify-end">
              <button
                onClick={checklistMode === 'opening' ? handleSubmitOpeningChecklist : handleSubmitClosingChecklist}
                className="px-6 py-3 bg-[#171717] hover:bg-[#333] text-white font-black text-xs rounded-xl shadow transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#E6A055]" />
                <span>
                  {checklistMode === 'opening' ? 'ยืนยันและเปิดร้าน (OPEN STORE)' : 'ยืนยันและปิดร้าน (CLOSE STORE)'}
                </span>
              </button>
            </div>
          </div>

          {/* Past Checklist History */}
          <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-[#171717]">ประวัติการบันทึก Checklist ประจำวัน</h4>
            <div className="space-y-2 text-xs">
              {checklistSubmittedRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#EEE] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rec.type === 'opening' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {rec.type}
                    </span>
                    <div>
                      <strong className="text-xs text-[#171717] block">{rec.staff_name}</strong>
                      <span className="text-[11px] text-[#777]">{rec.branch_name} · ตรวจเสร็จ {rec.items_completed}/{rec.total_items} ข้อ</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#888] font-mono">
                    {new Date(rec.completed_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: APPROVAL HUB                                                       */}
      {/* ========================================================================= */}
      {isOwner && activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">ศูนย์อนุมัติคำขอพิเศษ (Approval System)</h2>
              <p className="text-xs text-[#666]">
                ควบคุมการคืนเงิน (Refund), ส่วนลดเกินเพดาน, การตัดสต๊อกชำรุด, และการแก้ไขราคา
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSubmitRequestOpen(true)}
                className="px-3.5 py-1.5 bg-[#E6A055] hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition"
              >
                + ยื่นคำขอใหม่
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'resolved'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setApprovalFilter(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  approvalFilter === mode ? 'bg-[#171717] text-white' : 'bg-white border text-[#666]'
                }`}
              >
                {mode === 'all' ? 'ทั้งหมด' : mode === 'pending' ? 'รออนุมัติ (Pending)' : 'ตัดสินแล้ว (Resolved)'}
              </button>
            ))}
          </div>

          {/* Requests List */}
          <div className="space-y-3">
            {filteredApprovals.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#E6E4DD] text-center text-xs text-[#888]">
                ไม่มีคำขอในหมวดนี้
              </div>
            ) : (
              filteredApprovals.map((req) => (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          req.type === 'refund'
                            ? 'bg-rose-100 text-rose-800'
                            : req.type === 'large_discount'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {req.type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-[#171717]">{req.title}</h4>
                    </div>
                    <p className="text-xs text-[#555] max-w-xl">{req.details}</p>
                    <div className="text-[11px] text-[#888] flex items-center gap-2 pt-1">
                      <span>ผู้ยื่นคำขอ: <strong>{req.requested_by_name}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>จำนวนเงิน: <strong className="text-rose-600 font-bold">฿{req.amount?.toLocaleString()}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>เมื่อ: {new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                    </div>
                  </div>

                  {/* Action or Status */}
                  <div className="flex items-center gap-2">
                    {req.status === 'pending' ? (
                      isManagement ? (
                        <>
                          <button
                            onClick={() => handleResolveApproval(req.id, 'approved')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition"
                          >
                            อนุมัติ (Approve)
                          </button>
                          <button
                            onClick={() => handleResolveApproval(req.id, 'rejected')}
                            className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition"
                          >
                            ปฏิเสธ (Reject)
                          </button>
                        </>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                          รอดำเนินการ (Pending)
                        </span>
                      )
                    ) : (
                      <div className="text-right">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold block mb-0.5 ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.status === 'approved' ? '✓ อนุมัติแล้ว' : '✗ ปฏิเสธแล้ว'}
                        </span>
                        <span className="text-[10px] text-[#888]">โดย {req.resolved_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: COMMISSIONS & MONEY                                                */}
      {/* ========================================================================= */}
      {isOwner && activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">ระบบคำนวณคอมมิชชั่น &amp; การเชื่อมโยงธุรกรรม</h2>
              <p className="text-xs text-[#666]">
                ทุกยอดคอมมิชชั่นผูกตรงกับเลขที่นัดหมาย (Booking ID) หรือคำสั่งซื้อ (Sale ID) เพื่อความโปร่งใส
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E6E4DD] shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#8C887B] border-b border-[#E6E4DD] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">พนักงาน</th>
                  <th className="py-3 px-4">รายการบริการ / ธุรกรรม</th>
                  <th className="py-3 px-4">เลขที่อ้างอิง</th>
                  <th className="py-3 px-4">ฐานคิดเงิน</th>
                  <th className="py-3 px-4">อัตรา (%)</th>
                  <th className="py-3 px-4">คอมมิชชั่นที่ได้รับ</th>
                  <th className="py-3 px-4 text-right">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {commissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-[#FAF9F5]">
                    <td className="py-3 px-4 font-bold text-[#171717]">{comm.employee_name}</td>
                    <td className="py-3 px-4">
                      <span className="block font-semibold">{comm.description}</span>
                      {comm.customer_name && <span className="text-[11px] text-[#777]">ลูกค้า: {comm.customer_name}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#666]">{comm.reference_id}</td>
                    <td className="py-3 px-4 font-mono">฿{comm.amount_base.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#E6A055]">{comm.rate_pct}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">฿{comm.commission_earned.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {comm.payout_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: EQUAL1 ACADEMY (STAFF TRAINING & CERTIFICATIONS)                   */}
      {/* ========================================================================= */}
      {activeTab === 'academy' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">EQUAL1 Academy · ศูนย์ฝึกอบรมและรับรองมาตรฐาน</h2>
              <p className="text-xs text-[#666]">
                หลักสูตรมาตรฐานช่วยให้ขยายสาขาและพนักงานใหม่เรียนรู้ระบบได้เองโดยไม่ต้องอธิบายซ้ำ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainingCourses.map((course) => {
              const isCompletedByCurrent = currentEmployee.completed_training_courses.includes(course.id);
              return (
                <div
                  key={course.id}
                  className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#CCC] transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#E6A055] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {course.code}
                      </span>
                      <span className="text-[11px] text-[#888] font-mono">{course.duration_minutes} นาที</span>
                    </div>
                    <h3 className="text-base font-bold text-[#171717]">{course.title}</h3>
                    <p className="text-xs text-[#666] leading-relaxed">{course.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#EEE] flex items-center justify-between text-xs">
                    <span className="text-indigo-600 font-semibold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      <span>{course.badge_name}</span>
                    </span>

                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        playTactileHaptic('keypad');
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                        isCompletedByCurrent
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-[#171717] text-white hover:bg-[#333]'
                      }`}
                    >
                      {isCompletedByCurrent ? '✓ ผ่านการรับรองแล้ว' : 'เข้าเรียนหลักสูตร →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: STAFF ACTIVITY TIMELINE                                            */}
      {/* ========================================================================= */}
      {isOwner && activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#171717]">ไทม์ไลน์กิจกรรมพนักงาน (Staff Activity Timeline)</h2>
              <p className="text-xs text-[#666]">
                ระบบบันทึกความรับผิดชอบ (Traceability &amp; Accountability) ตรวจสอบย้อนหลังได้ทุกจุดสัมผัส
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm space-y-4">
            <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE6DF]">
              {activities.map((act) => (
                <div key={act.id} className="relative pl-8 space-y-0.5 text-xs">
                  <div className="w-3 h-3 rounded-full bg-[#E6A055] border-2 border-white absolute left-1.5 top-1 shadow-sm" />
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-[#171717]">{act.title}</strong>
                    <span className="text-[#888]">·</span>
                    <span className="text-[#666] font-medium">{act.employee_name}</span>
                    <span className="text-[#888]">·</span>
                    <span className="text-[10px] text-[#999] font-mono">
                      {new Date(act.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                    </span>
                  </div>
                  {act.detail && <p className="text-[#666] text-[11px]">{act.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GRANULAR PERMISSIONS MATRIX                                        */}
      {/* ========================================================================= */}
      {isEditPermissionsOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDD] w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#EEE] pb-4">
              <div>
                <h3 className="text-lg font-black text-[#171717]">
                  สิทธิ์การใช้งานแบบละเอียด (Granular Permissions)
                </h3>
                <p className="text-xs text-[#666]">
                  {selectedEmployee.name} ({selectedEmployee.nickname}) · บทบาท: {selectedEmployee.role.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setIsEditPermissionsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-[#888]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Permission Matrix Controls */}
            <div className="space-y-5 text-xs">
              {/* POS Permissions */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EEE] space-y-2">
                <h4 className="font-bold text-[#171717] text-xs">1. POS &amp; จุดขาย (Point of Sale)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.pos.create_order}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            pos: { ...selectedEmployee.permissions.pos, create_order: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>เปิดบิลขาย (Create Order)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.pos.edit_cart}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            pos: { ...selectedEmployee.permissions.pos, edit_cart: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>แก้ไขตะกร้า (Edit Cart)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.pos.apply_discount}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            pos: { ...selectedEmployee.permissions.pos, apply_discount: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>ใส่ส่วนลดปกติ (Apply Discount)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.pos.refund}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            pos: { ...selectedEmployee.permissions.pos, refund: e.target.checked },
                          },
                        })
                      }
                    />
                    <span className="text-rose-700 font-semibold">คืนเงินโดยตรง (Direct Refund)</span>
                  </label>
                </div>
              </div>

              {/* Stock Permissions */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EEE] space-y-2">
                <h4 className="font-bold text-[#171717] text-xs">2. สต๊อกและคลังสินค้า (Inventory)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.stock.view_stock}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            stock: { ...selectedEmployee.permissions.stock, view_stock: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>ดูยอดสต๊อก (View Stock)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.stock.receive_stock}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            stock: { ...selectedEmployee.permissions.stock, receive_stock: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>รับสินค้าเข้า (Receive Stock)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.stock.adjust_stock}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            stock: { ...selectedEmployee.permissions.stock, adjust_stock: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>ปรับลดยอดสต๊อก (Adjust Stock)</span>
                  </label>
                </div>
              </div>

              {/* Finance & Confidentiality */}
              <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-[#EEE] space-y-2">
                <h4 className="font-bold text-[#171717] text-xs">3. การเงินและความลับองค์กร (Finance &amp; Privacy)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.finance.view_daily_sales}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            finance: { ...selectedEmployee.permissions.finance, view_daily_sales: e.target.checked },
                          },
                        })
                      }
                    />
                    <span>ดูยอดขายประจำวัน (View Daily Sales)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.finance.view_profit}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            finance: { ...selectedEmployee.permissions.finance, view_profit: e.target.checked },
                          },
                        })
                      }
                    />
                    <span className="text-amber-700 font-semibold">ดูกำไรสุทธิ &amp; ต้นทุนบริษัท (Company Profit)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployee.permissions.customer.export_data}
                      onChange={(e) =>
                        setSelectedEmployee({
                          ...selectedEmployee,
                          permissions: {
                            ...selectedEmployee.permissions,
                            customer: { ...selectedEmployee.permissions.customer, export_data: e.target.checked },
                          },
                        })
                      }
                    />
                    <span className="text-rose-700 font-semibold">ส่งออกฐานข้อมูลลูกค้า (Export Customer DB)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EEE] flex justify-end gap-2">
              <button
                onClick={() => setIsEditPermissionsOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSavePermissions(selectedEmployee.permissions)}
                className="px-5 py-2 bg-[#171717] hover:bg-[#333] text-white font-bold text-xs rounded-xl"
              >
                บันทึกสิทธิ์ใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE TASK                                                        */}
      {/* ========================================================================= */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTask}
            className="bg-white border border-[#DDD] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-[#171717]">สร้างงานใหม่ให้ทีม (Assign Task)</h3>
              <button type="button" onClick={() => setIsCreateTaskOpen(false)}>
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">ชื่องาน</label>
                <input
                  type="text"
                  placeholder="เช่น เติมสินค้าเครื่องดื่มตู้แช่, เช็ดเตียงต่อขนตา"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">รายละเอียดงาน</label>
                <textarea
                  rows={2}
                  placeholder="รายละเอียดขั้นตอนที่ต้องทำ..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">มอบหมายให้</label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full p-2 border rounded-xl outline-none"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nickname} ({e.position.split(' ')[0]})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">ความสำคัญ</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 border rounded-xl outline-none"
                  >
                    <option value="low">ต่ำ (Low)</option>
                    <option value="medium">ปกติ (Medium)</option>
                    <option value="high">ด่วน (High)</option>
                    <option value="urgent">เร่งด่วนที่สุด (Urgent)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateTaskOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#E6A055] text-black font-bold text-xs rounded-xl"
              >
                สร้างและมอบหมายงาน
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STAFF SUBMIT APPROVAL REQUEST                                      */}
      {/* ========================================================================= */}
      {isSubmitRequestOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleStaffSubmitRequest}
            className="bg-white border border-[#DDD] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-[#171717]">ยื่นคำขออนุมัติพิเศษ (Submit Request)</h3>
              <button type="button" onClick={() => setIsSubmitRequestOpen(false)}>
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">ประเภทคำขอ</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as ApprovalRequest['type'])}
                  className="w-full p-2.5 border rounded-xl outline-none"
                >
                  <option value="refund">ขอคืนเงินลูกค้า (Refund Request)</option>
                  <option value="large_discount">ขอส่วนลดพิเศษเกินเพดาน (Large Discount)</option>
                  <option value="stock_adjustment">ขอตัดสต๊อกชำรุด / เสียหาย (Stock Adjustment)</option>
                  <option value="void_transaction">ขอยกเลิกบิลหลังพิมพ์ (Void Transaction)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">หัวข้อคำขอ</label>
                <input
                  type="text"
                  placeholder="เช่น ขอคืนเงินออเดอร์มินิมาร์ท #1042 สินค้าชำรุด"
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">จำนวนเงินที่เกี่ยวข้อง (บาท)</label>
                <input
                  type="number"
                  value={reqAmount}
                  onChange={(e) => setReqAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border rounded-xl outline-none font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">เหตุผลและรายละเอียดแนบ</label>
                <textarea
                  rows={3}
                  placeholder="อธิบายเหตุผลให้ชัดเจน เพื่อให้ Owner / ผู้จัดการตรวจสอบก่อนอนุมัติ..."
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitRequestOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#E6A055] text-black font-bold text-xs rounded-xl"
              >
                ส่งคำขอไปยังผู้จัดการ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ONBOARD NEW EMPLOYEE                                               */}
      {/* ========================================================================= */}
      {isAddEmployeeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newEmpName.trim()) return;

              const newEmp: EmployeeProfile = {
                id: `emp-${Date.now()}`,
                name: newEmpName,
                nickname: newEmpNickname || newEmpName.split(' ')[0],
                position: newEmpPosition || 'Junior Staff',
                branch_id: 'br-001',
                branch_name: 'สาขาเมืองเอก / รังสิต มินิมาร์ท',
                role: newEmpRole,
                status: 'active',
                attendance_status: 'clocked_out',
                phone: newEmpPhone || '080-000-0000',
                email: `${newEmpNickname.toLowerCase() || 'staff'}@equal1.com`,
                avatar: newEmpRole === 'beauty_staff' ? '✂️' : newEmpRole === 'cashier' ? '🛒' : '👤',
                skills: ['General Operations', 'POS Usage'],
                services_can_perform: [],
                commission_rate_pct: newEmpCommissionRate,
                base_salary: newEmpBaseSalary,
                joined_date: new Date().toISOString().split('T')[0],
                today_sales: 0,
                today_services_count: 0,
                today_commission: 0,
                monthly_commission: 0,
                permissions: getRoleDefaultPermissions(newEmpRole),
                completed_training_courses: [],
              };

              onUpdateEmployees([...employees, newEmp]);
              setIsAddEmployeeOpen(false);
              setNewEmpName('');
              setNewEmpNickname('');
              setNewEmpPosition('');
              playTactileHaptic('success');
            }}
            className="bg-white border border-[#DDD] w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-[#171717]">เพิ่มพนักงานใหม่ (Employee Onboarding)</h3>
              <button type="button" onClick={() => setIsAddEmployeeOpen(false)}>
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">ชื่อ-นามสกุลจริง</label>
                <input
                  type="text"
                  placeholder="เช่น คุณอนันต์ สุขใจ"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">ชื่อเล่น (Nickname)</label>
                  <input
                    type="text"
                    placeholder="เช่น นนท์"
                    value={newEmpNickname}
                    onChange={(e) => setNewEmpNickname(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    placeholder="081-xxx-xxxx"
                    value={newEmpPhone}
                    onChange={(e) => setNewEmpPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">ตำแหน่งงาน (Position)</label>
                <input
                  type="text"
                  placeholder="เช่น Junior Lash Stylist, Assistant Cashier"
                  value={newEmpPosition}
                  onChange={(e) => setNewEmpPosition(e.target.value)}
                  className="w-full p-2.5 border rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">บทบาท (Role)</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as UserRole)}
                    className="w-full p-2.5 border rounded-xl outline-none"
                  >
                    <option value="beauty_staff">Beauty Staff (ซาลอน)</option>
                    <option value="cashier">Cashier (แคชเชียร์)</option>
                    <option value="stock">Stock (คลังสินค้า)</option>
                    <option value="delivery">Delivery (จัดส่ง)</option>
                    <option value="manager">Manager (ผู้จัดการ)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">อัตราคอมมิชชั่น (%)</label>
                  <input
                    type="number"
                    value={newEmpCommissionRate}
                    onChange={(e) => setNewEmpCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 border rounded-xl outline-none font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddEmployeeOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#171717] text-white font-bold text-xs rounded-xl"
              >
                บันทึกเข้าสู่ระบบ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ACADEMY COURSE DETAILS & PASS CONFIRMATION                         */}
      {/* ========================================================================= */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#DDD] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#E6A055]">{selectedCourse.code}</span>
                <h3 className="text-lg font-black text-[#171717]">{selectedCourse.title}</h3>
              </div>
              <button onClick={() => setSelectedCourse(null)}>
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#555] leading-relaxed">
              <p>{selectedCourse.description}</p>
              <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#EEE] space-y-2">
                <strong className="text-xs font-bold text-[#171717] block">เนื้อหาการเรียนรู้ {selectedCourse.modules_count} โมดูล:</strong>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#666]">
                  <li>ความเข้าใจบทบาทหน้าที่และมาตรฐานการบริการระดับพรีเมียม</li>
                  <li>การใช้งานระบบ EQUAL1 ในส่วนงานที่เกี่ยวข้องอย่างคล่องแคล่ว</li>
                  <li>มาตรฐานความปลอดภัย การคุ้มครองรหัสผ่าน และนโยบายไม่เปิดเผยข้อมูล</li>
                  <li>กรณีศึกษาข้อผิดพลาดที่พบบ่อยและการแก้ไขสถานการณ์เฉพาะหน้า</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end gap-2">
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
              <button
                onClick={() => {
                  if (!currentEmployee.completed_training_courses.includes(selectedCourse.id)) {
                    const updated = employees.map((e) =>
                      e.id === currentEmployee.id
                        ? { ...e, completed_training_courses: [...e.completed_training_courses, selectedCourse.id] }
                        : e
                    );
                    onUpdateEmployees(updated);
                  }
                  setSelectedCourse(null);
                  playTactileHaptic('success');
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>ยืนยันการเรียนจบ &amp; รับตรารับรอง ({selectedCourse.badge_name})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMERA SCANNER MODAL (FOR SCANNING PRODUCT BARCODES ON FLOORS)            */}
      {/* ========================================================================= */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        products={products}
        customers={customers}
        cartCount={teamCart.reduce((s, i) => s + i.quantity, 0)}
        onProductScanned={handleProductScanned}
        onCustomerScanned={(c) => {
          playTactileHaptic('success');
          triggerToast(`สแกนพบบัตรสมาชิก: ${c.name} (${c.tier || 'VIP'})`, 'info');
        }}
        onGoToCheckout={() => {
          setIsCameraScannerOpen(false);
          setIsTeamCartDrawerOpen(true);
        }}
      />

      {/* ========================================================================= */}
      {/* FLOATING TEAM CART PILL                                                   */}
      {/* ========================================================================= */}
      {teamCart.length > 0 && !isTeamCartDrawerOpen && !isCameraScannerOpen && (
        <div className="fixed bottom-6 inset-x-4 max-w-lg mx-auto z-40 animate-fade-in">
          <div className="bg-[#171717]/95 backdrop-blur-md text-white p-3.5 px-5 rounded-3xl border border-white/20 shadow-2xl flex items-center justify-between gap-4">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setIsTeamCartDrawerOpen(true)}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E6A055] text-black flex items-center justify-center font-black relative shadow">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#171717]">
                  {teamCart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div>
                <span className="text-xs text-[#A8A499] block font-medium">ตะกร้าเคลื่อนที่ของทีม</span>
                <strong className="text-sm font-black text-white">
                  ฿{teamCartTotal.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTeamCartDrawerOpen(true)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition"
              >
                ดูตะกร้า
              </button>
              <button
                onClick={handleTransferTeamCartToPos}
                className="px-4 py-2 bg-[#E6A055] hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition flex items-center gap-1.5"
              >
                <span>ส่งไป POS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TEAM CART DRAWER & INSTANT FLOOR CHECKOUT                          */}
      {/* ========================================================================= */}
      {isTeamCartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#1C1B19] border border-white/15 text-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#23211D]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E6A055] text-black flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    ตะกร้าสินค้าเคลื่อนที่ (Team Floor Basket)
                  </h3>
                  <span className="text-[11px] text-[#A8A499]">
                    ผู้ดูแลบิล: {currentEmployee.name} ({currentEmployee.position})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsTeamCartDrawerOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#CCC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 max-h-[50vh]">
              {teamCart.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#888] space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto text-[#555]" />
                  <p>ไม่มีสินค้าในตะกร้าทีม</p>
                  <button
                    onClick={() => {
                      setIsTeamCartDrawerOpen(false);
                      setIsCameraScannerOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs"
                  >
                    เปิดกล้องสแกนสินค้า
                  </button>
                </div>
              ) : (
                teamCart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-mono text-xs">
                          {item.product.sku.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <strong className="text-xs font-bold text-white block">
                          {item.product.name}
                        </strong>
                        <span className="text-[11px] text-[#A8A499]">
                          ฿{item.product.price} · สต๊อกคงเหลือ {item.product.stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-black/50 border border-white/15 rounded-xl p-0.5">
                        <button
                          onClick={() => handleUpdateTeamCartQty(item.product.id, -1)}
                          className="p-1 hover:bg-white/10 rounded-lg text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateTeamCartQty(item.product.id, 1)}
                          className="p-1 hover:bg-white/10 rounded-lg text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <strong className="text-xs font-mono font-black text-[#E6A055] min-w-[50px] text-right">
                        ฿{item.product.price * item.quantity}
                      </strong>

                      <button
                        onClick={() => handleRemoveTeamCartItem(item.product.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Actions */}
            {teamCart.length > 0 && (
              <div className="p-4 bg-[#23211D] border-t border-white/10 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[#A8A499]">
                    <span>จำนวนสินค้ารวม</span>
                    <span>{teamCart.reduce((s, i) => s + i.quantity, 0)} ชิ้น</span>
                  </div>
                  <div className="flex items-center justify-between text-[#A8A499]">
                    <span>ค่าคอมมิชชั่นพนักงาน ({currentEmployee.commission_rate_pct}%)</span>
                    <span className="text-emerald-400 font-bold">
                      +฿{Math.round(teamCartTotal * (currentEmployee.commission_rate_pct / 100))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-sm font-black text-white">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="text-base text-[#E6A055] font-mono">
                      ฿{teamCartTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleTransferTeamCartToPos}
                    className="py-2.5 px-3 bg-[#E6A055] hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                  >
                    <span>ส่งไปคิดเงินที่ POS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setIsTeamCartDrawerOpen(false);
                      setQuickPaymentModalOpen(true);
                    }}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>ชำระเงินด่วน</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#888] pt-1">
                  <button
                    onClick={() => {
                      setIsTeamCartDrawerOpen(false);
                      setIsCameraScannerOpen(true);
                    }}
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3" />
                    <span>สแกนสินค้าเพิ่ม</span>
                  </button>

                  <button
                    onClick={() => {
                      setTeamCart([]);
                      triggerToast('ล้างตะกร้าเรียบร้อยแล้ว', 'info');
                    }}
                    className="text-rose-400 hover:underline"
                  >
                    ล้างตะกร้าทั้งหมด
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK FLOOR CHECKOUT (PROMPTPAY / CASH)                            */}
      {/* ========================================================================= */}
      {quickPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B19] border border-white/15 text-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#E6A055]" />
                <h3 className="text-base font-black text-white">
                  ชำระเงินด่วนหน้าร้าน (Team Quick Pay)
                </h3>
              </div>
              <button onClick={() => setQuickPaymentModalOpen(false)}>
                <X className="w-5 h-5 text-[#888]" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQuickPaymentMethod('promptpay')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  quickPaymentMethod === 'promptpay'
                    ? 'bg-[#E6A055] text-black border-[#E6A055]'
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>PromptPay QR</span>
              </button>

              <button
                onClick={() => setQuickPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  quickPaymentMethod === 'cash'
                    ? 'bg-[#E6A055] text-black border-[#E6A055]'
                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <Coins className="w-5 h-5" />
                <span>เงินสด (Cash)</span>
              </button>
            </div>

            {/* Summary Details */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-[#A8A499]">
                <span>รายการสินค้า</span>
                <span>{teamCart.reduce((s, i) => s + i.quantity, 0)} ชิ้น</span>
              </div>
              <div className="flex justify-between text-[#A8A499]">
                <span>ผู้รับผิดชอบการขาย</span>
                <span className="text-white">{currentEmployee.name}</span>
              </div>
              <div className="flex justify-between text-[#A8A499]">
                <span>คอมมิชชั่นที่จะได้รับ</span>
                <span className="text-emerald-400 font-bold">
                  +฿{Math.round(teamCartTotal * (currentEmployee.commission_rate_pct / 100))}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-base font-black text-white">
                <span>ยอดเงินที่ต้องชำระ</span>
                <span className="text-[#E6A055]">฿{teamCartTotal.toLocaleString()}</span>
              </div>
            </div>

            {quickPaymentMethod === 'promptpay' && (
              <div className="text-center p-3 bg-white rounded-2xl text-black space-y-2">
                <span className="text-[10px] font-bold text-[#888] uppercase block">
                  Scan QR PromptPay
                </span>
                <div className="w-36 h-36 mx-auto bg-gray-100 rounded-xl flex items-center justify-center p-2 border">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PROMPTPAY-EQUAL1-0819999999-AMOUNT-${teamCartTotal}`}
                    alt="PromptPay QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono text-[#555] block">
                  EQUAL1 MART &amp; SALON · ฿{teamCartTotal.toLocaleString()}
                </span>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setQuickPaymentModalOpen(false)}
                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-[#CCC] font-bold text-xs rounded-xl"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleCompleteQuickSale}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันรับชำระเงิน</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING TOAST NOTIFICATION                                               */}
      {/* ========================================================================= */}
      {scannedToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 transition-all backdrop-blur-md animate-fade-in ${
            scannedToast.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/40'
              : scannedToast.type === 'info'
              ? 'bg-amber-950/95 text-amber-100 border-amber-500/50 shadow-amber-950/40'
              : 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
          }`}
        >
          {scannedToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{scannedToast.message}</span>
        </div>
      )}
    </div>
  );
};
