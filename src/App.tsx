import React, { useState, useEffect } from 'react';
import {
  INITIAL_PRODUCTS,
  INITIAL_SERVICES,
  INITIAL_CUSTOMERS,
  INITIAL_BOOKINGS,
  INITIAL_SALES,
  INITIAL_CASH_SESSIONS,
  INITIAL_MOVEMENTS,
  INITIAL_AUDIT,
  INITIAL_AI_ACTIONS,
  INITIAL_PROFILES,
  INITIAL_CAMPAIGNS,
  INITIAL_VOUCHERS,
  INITIAL_SLIP_RECORDS,
  INITIAL_STAFF_PINS,
  INITIAL_EMPLOYEES,
  INITIAL_TASKS,
  INITIAL_APPROVALS,
  INITIAL_COMMISSIONS,
  INITIAL_TRAINING_COURSES,
  INITIAL_STAFF_ACTIVITIES,
} from './lib/store';
import {
  Product,
  ServiceItem,
  Sale,
  Booking,
  CashSession,
  InventoryMovement,
  Customer,
  AuditLog,
  UserRole,
  CartItem,
  OrderStatus,
  BookingStatus,
  AiActionProposal,
  MarketingCampaign,
  PromoVoucher,
  BankSlipRecord,
  StaffPinAccount,
  EmployeeProfile,
  TaskItem,
  ApprovalRequest,
  CommissionRecord,
  TrainingCourse,
  StaffActivityLog,
  StyleGuideTheme,
} from './types';
import { THEMES } from './lib/theme';
import { Language, getTranslation } from './lib/i18n';
import { Navigation } from './components/Navigation';
import { PosTerminal } from './components/PosTerminal';
import { CustomerApp } from './components/CustomerApp';
import { OrderCenterKanban } from './components/OrderCenterKanban';
import { SalonBookingView } from './components/SalonBookingView';
import { InventoryManager } from './components/InventoryManager';
import { FinanceDashboard } from './components/FinanceDashboard';
import { SystemHealthMonitor } from './components/SystemHealthMonitor';
import { CashDrawerModal } from './components/CashDrawerModal';
import { AiBusinessBrainModal } from './components/AiBusinessBrainModal';
import { PaymentHistorySlipVerification } from './components/PaymentHistorySlipVerification';
import { MarketingCampaignManager } from './components/MarketingCampaignManager';
import { AuthSecurityModal } from './components/AuthSecurityModal';
import { TeamOsManager } from './components/TeamOsManager';
import { Equal1LoginModal } from './components/Equal1LoginModal';
import { OwnerAuthChallengeModal } from './components/OwnerAuthChallengeModal';
import { CustomerSupportWorkspace } from './components/CustomerSupportWorkspace';
import { StaffLearningWorkspace } from './components/StaffLearningWorkspace';
import { OwnerControlWorkspace } from './components/OwnerControlWorkspace';
import { OwnerMyAppControl } from './components/OwnerMyAppControl';
import { supabase } from './lib/supabase';
import { authService, businessService, runtimeManager, TENANT_CONFIG } from './lib/backendEngine';
import { SupportThread, SupportMessage, TrainingAssignment } from './types';
import {
  TrendingUp,
  Store,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Coins,
  ArrowRight,
  FileCheck2,
  Megaphone,
  Lock,
  Shield,
  Users,
} from 'lucide-react';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [currentLang, setCurrentLang] = useState<Language>('th');

  // Security & Owner Separation states
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(true);
  const [currentTheme, setCurrentTheme] = useState<StyleGuideTheme>('minimal_luxury');
  const [isEqual1LoginOpen, setIsEqual1LoginOpen] = useState<boolean>(false);
  const [isOwnerChallengeOpen, setIsOwnerChallengeOpen] = useState<boolean>(false);
  const [targetProtectedView, setTargetProtectedView] = useState<string>('dashboard');

  // Application Data States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [cashSessions, setCashSessions] = useState<CashSession[]>(INITIAL_CASH_SESSIONS);
  const [movements, setMovements] = useState<InventoryMovement[]>(INITIAL_MOVEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT);
  const [aiProposals, setAiProposals] = useState<AiActionProposal[]>(INITIAL_AI_ACTIONS);
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);

  // Five Pillar additions: Campaigns, Vouchers, Bank Slips, Staff PIN accounts
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);
  const [vouchers, setVouchers] = useState<PromoVoucher[]>(INITIAL_VOUCHERS);
  const [slipRecords, setSlipRecords] = useState<BankSlipRecord[]>(INITIAL_SLIP_RECORDS);
  const [staffAccounts, setStaffAccounts] = useState<StaffPinAccount[]>(INITIAL_STAFF_PINS);
  const [currentStaffName, setCurrentStaffName] = useState<string>('คุณนันท์นภัส (Mild - Owner)');
  const [activeCustomerId, setActiveCustomerId] = useState<string>('cust-001');
  const [posInitialCart, setPosInitialCart] = useState<CartItem[]>([]);

  // Team OS Pillars: Employees, Tasks, Approvals, Commissions, Training, Staff Activities
  const [employees, setEmployees] = useState<EmployeeProfile[]>(INITIAL_EMPLOYEES);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(INITIAL_APPROVALS);
  const [commissions, setCommissions] = useState<CommissionRecord[]>(INITIAL_COMMISSIONS);
  const [trainingCourses, setTrainingCourses] = useState<TrainingCourse[]>(INITIAL_TRAINING_COURSES);
  const [staffActivities, setStaffActivities] = useState<StaffActivityLog[]>(INITIAL_STAFF_ACTIVITIES);

  // Customer Support & Staff Learning States
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([
    {
      id: 'th-001',
      organization_id: TENANT_CONFIG.DEFAULT_ORG_ID,
      customer_id: 'cust-001',
      customer_name: 'คุณแพรว (VIP Member)',
      customer_phone: '081-999-8888',
      subject: 'สอบถามบริการทำสีผมออร์แกนิค และจองคิวช่างเมย์',
      status: 'waiting_agent',
      mode: 'human',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'th-002',
      organization_id: TENANT_CONFIG.DEFAULT_ORG_ID,
      customer_id: 'cust-002',
      customer_name: 'คุณบอย (Regular)',
      customer_phone: '089-123-4567',
      subject: 'ติดตามสถานะออเดอร์เดลิเวอรี่ มินิมาร์ท #ORD-9921',
      status: 'in_progress',
      mode: 'human',
      assigned_to: 'สมศรี (Cashier)',
      assigned_to_name: 'สมศรี (Senior Cashier & POS)',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 600000).toISOString(),
    },
  ]);

  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([
    {
      id: 'msg-001',
      thread_id: 'th-001',
      sender_type: 'customer',
      sender_name: 'คุณแพรว',
      body: 'สวัสดีค่ะ ช่างเมย์มีคิวว่างช่วงเสาร์นี้ 14:00 น. ไหมคะ?',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'msg-002',
      thread_id: 'th-001',
      sender_type: 'ai',
      sender_name: 'AI Support Assistant',
      body: 'สวัสดีค่ะคุณแพรว ช่างเมย์มีคิว 14:30 น. ว่างค่ะ สนใจให้ประสานงานแอดมินคนจริงเพื่อล็อคคิวให้ทันทีเลยไหมคะ?',
      created_at: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: 'msg-003',
      thread_id: 'th-001',
      sender_type: 'customer',
      sender_name: 'คุณแพรว',
      body: 'รบกวนขอคุยกับเจ้าหน้าที่คนจริงหน่อยค่ะ ขอบคุณค่ะ',
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ]);

  const [trainingAssignments, setTrainingAssignments] = useState<TrainingAssignment[]>([
    {
      id: 'asg-01',
      course_id: 'course-salon-01',
      course_title: 'SOP บริการทำสีผมออร์แกนิค & การวิเคราะห์สภาพหนังศีรษะ',
      staff_id: 'emp-002',
      staff_name: 'ช่างเมย์ (Master Stylist)',
      status: 'in_progress',
      progress: 75,
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
  ]);

  const handleSendSupportMessage = async (
    threadId: string,
    text: string,
    senderType: 'agent' | 'ai' | 'customer',
    senderName: string
  ) => {
    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      thread_id: threadId,
      sender_type: senderType,
      sender_name: senderName,
      body: text,
      created_at: new Date().toISOString(),
    };
    setSupportMessages((prev) => [...prev, newMsg]);

    try {
      await supabase.from('customer_support_messages').insert({
        id: newMsg.id,
        thread_id: newMsg.thread_id,
        body: newMsg.body,
        sender_type: newMsg.sender_type,
        created_at: newMsg.created_at,
      });
    } catch (err) {
      console.warn('Support message cloud persistence notice:', err);
    }
  };

  const handleTakeoverSupportThread = async (threadId: string, agentName: string) => {
    setSupportThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? { ...t, status: 'in_progress', mode: 'human', assigned_to_name: agentName }
          : t
      )
    );

    try {
      await supabase
        .from('customer_support_threads')
        .update({
          status: 'in_progress',
          assigned_to: agentName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);
    } catch (err) {
      console.warn('Support thread takeover cloud update notice:', err);
    }
  };

  const handleResolveSupportThread = async (threadId: string, agentName: string) => {
    setSupportThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, status: 'resolved' } : t))
    );

    try {
      await supabase
        .from('customer_support_threads')
        .update({
          status: 'resolved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', threadId);
    } catch (err) {
      console.warn('Support thread resolve cloud update notice:', err);
    }
  };

  const handleCompleteAssignment = async (assignmentId: string, score: number) => {
    setTrainingAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, status: 'completed', progress: 100, completed_date: new Date().toISOString() }
          : a
      )
    );

    try {
      await supabase
        .from('staff_training_assignments')
        .update({
          status: 'completed',
          progress: score,
          completed_at: new Date().toISOString(),
        })
        .eq('id', assignmentId);
    } catch (err) {
      console.warn('Training assignment complete cloud update notice:', err);
    }
  };

  const handleApproveRequest = (id: string, reviewerName: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'approved', reviewer_name: reviewerName, reviewed_at: new Date().toISOString() }
          : a
      )
    );
    handleSecurityAudit('APPROVAL_REQUEST_APPROVED', { requestId: id, reviewer: reviewerName });
  };

  const handleRejectRequest = (id: string, reviewerName: string, reason?: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'rejected', reviewer_name: reviewerName, rejection_reason: reason, reviewed_at: new Date().toISOString() }
          : a
      )
    );
    handleSecurityAudit('APPROVAL_REQUEST_REJECTED', { requestId: id, reviewer: reviewerName, reason });
  };

  const handleAddStaffActivity = (act: Omit<StaffActivityLog, 'id' | 'timestamp'>) => {
    const newAct: StaffActivityLog = {
      ...act,
      id: 'act-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setStaffActivities((prev) => [newAct, ...prev]);
  };

  const activeCustomer = customers.find((c) => c.id === activeCustomerId) || customers[0];

  // Modals & Security state
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isAiBrainOpen, setIsAiBrainOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Active cashier session
  const activeCashShift = cashSessions.find((s) => s.status === 'open') || null;

  // Security Audit Logger
  const handleSecurityAudit = (action: string, details: Record<string, unknown>) => {
    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      created_at: new Date().toISOString(),
      actor_name: currentStaffName,
      action,
      entity_type: 'security_access',
      entity_id: 'auth-session',
      details,
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  // Customer Authentication & Account Handlers
  const handleCustomerLogin = (customer: Customer) => {
    setActiveCustomerId(customer.id);
    handleSecurityAudit('CUSTOMER_LOGIN_SUCCESS', {
      customerId: customer.id,
      customerName: customer.name,
      tier: customer.tier,
    });
  };

  const handleCustomerRegister = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
    setActiveCustomerId(newCust.id);
    handleSecurityAudit('CUSTOMER_REGISTERED', {
      customerId: newCust.id,
      customerName: newCust.name,
      tier: newCust.tier,
    });
  };

  const handleCustomerUpdate = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleCustomerLogout = () => {
    const walkIn = customers.find((c) => c.id === 'cust-003') || customers[0];
    setActiveCustomerId(walkIn.id);
    handleSecurityAudit('CUSTOMER_LOGOUT', { previousCustomerId: activeCustomer.id });
  };

  // Owner Logout & Session Lock
  const handleOwnerLogout = () => {
    setIsOwnerAuthenticated(false);
    setCurrentRole('cashier');
    setCurrentView('pos');
    handleSecurityAudit('OWNER_LOCK_SESSION', { message: 'เจ้าของร้านล็อคหน้าจอ ซ่อนระบบการเงินและ Dashboard' });
  };

  const handleOwnerLoginSuccess = (ownerName: string, email: string) => {
    setIsOwnerAuthenticated(true);
    setCurrentRole('owner');
    setCurrentStaffName(ownerName);
    setCurrentView(targetProtectedView || 'dashboard');
    setIsEqual1LoginOpen(false);
    setIsOwnerChallengeOpen(false);
    handleSecurityAudit('OWNER_LOGIN_SUCCESS', { ownerName, email });
  };

  const handleStaffLoginSuccess = (role: UserRole, staffName: string) => {
    setIsOwnerAuthenticated(false);
    setCurrentRole(role);
    setCurrentStaffName(staffName);
    setIsEqual1LoginOpen(false);
    if (role === 'cashier') setCurrentView('pos');
    else if (role === 'beauty_staff') setCurrentView('salon-queue');
    else if (role === 'delivery') setCurrentView('orders-kanban');
    else if (role === 'stock') setCurrentView('inventory');
    else setCurrentView('team-os');
    handleSecurityAudit('STAFF_PIN_LOGIN_SUCCESS', { role, staffName });
  };

  const handleOwnerVerifySuccess = () => {
    setIsOwnerAuthenticated(true);
    setCurrentRole('owner');
    setCurrentView(targetProtectedView || 'dashboard');
    setIsOwnerChallengeOpen(false);
    handleSecurityAudit('OWNER_CHALLENGE_VERIFIED', { targetView: targetProtectedView });
  };

  // Staff Account & Role selection from PIN/Auth modal
  const handleSelectStaffRole = (role: UserRole, staffName: string) => {
    if (role === 'owner') {
      setIsOwnerAuthenticated(true);
    } else {
      setIsOwnerAuthenticated(false);
    }
    setCurrentRole(role);
    setCurrentStaffName(staffName);
    if (role === 'customer') {
      setCurrentView('customer-shop');
    } else if (role === 'cashier') {
      setCurrentView('pos');
    } else if (role === 'beauty_staff') {
      setCurrentView('salon-queue');
    } else if (role === 'delivery') {
      setCurrentView('orders-kanban');
    } else if (role === 'stock') {
      setCurrentView('inventory');
    } else {
      setCurrentView('dashboard');
    }
  };

  // Slip verification & approval handler
  const handleVerifyAndApproveSlip = (record: BankSlipRecord, targetSaleId?: string) => {
    setSlipRecords((prev) => [record, ...prev]);

    if (targetSaleId) {
      setSales((prev) =>
        prev.map((s) =>
          s.id === targetSaleId
            ? { ...s, payment_status: 'paid', status: s.status === 'pending' ? 'confirmed' : s.status }
            : s
        )
      );

      const auditItem: AuditLog = {
        id: 'aud-' + Date.now(),
        created_at: new Date().toISOString(),
        actor_name: currentStaffName,
        action: 'BANK_SLIP_VERIFIED_AND_APPROVED',
        entity_type: 'sales',
        entity_id: targetSaleId,
        details: {
          bank: record.bank_name,
          ref: record.transaction_ref,
          amount: record.amount,
          status: record.verification_status,
        },
      };
      setAuditLogs((prev) => [auditItem, ...prev]);
    }
  };

  // Campaign management handlers
  const handleAddCampaign = (newCamp: MarketingCampaign) => {
    setCampaigns((prev) => [newCamp, ...prev]);
    handleSecurityAudit('CAMPAIGN_CREATED', { title: newCamp.title, badge: newCamp.badge });
  };

  const handleToggleCampaign = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  // Voucher management handlers
  const handleAddVoucher = (newVouch: PromoVoucher) => {
    setVouchers((prev) => [newVouch, ...prev]);
    handleSecurityAudit('VOUCHER_CREATED', { code: newVouch.code, discount: newVouch.discount_value });
  };

  const handleToggleVoucher = (id: string) => {
    setVouchers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, active: !v.active } : v))
    );
  };

  const handleDeleteVoucher = (id: string) => {
    setVouchers((prev) => prev.filter((v) => v.id !== id));
  };

  // Send Salon Booking to POS Checkout
  const handleSendBookingToPos = (booking: Booking) => {
    setCurrentView('pos');
    handleSecurityAudit('BOOKING_SENT_TO_POS', {
      bookingId: booking.id,
      customer: booking.customer_name,
      amount: booking.price,
    });
  };

  // Customer Slip Upload Handler
  const handleCustomerUploadSlip = (orderId: string, record: BankSlipRecord) => {
    setSlipRecords((prev) => [record, ...prev]);
    setSales((prev) =>
      prev.map((s) => (s.id === orderId ? { ...s, payment_status: 'paid' } : s))
    );
    const auditItem: AuditLog = {
      id: 'aud-' + Date.now(),
      created_at: new Date().toISOString(),
      actor_name: 'Customer App',
      action: 'CUSTOMER_SLIP_ATTACHED',
      entity_type: 'sales',
      entity_id: orderId,
      details: { ref: record.transaction_ref, amount: record.amount },
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
  };

  // Protected View Navigation
  const handleSelectView = (view: string) => {
    const ownerOnlyViews = ['dashboard', 'finance', 'system-health', 'marketing'];
    if (ownerOnlyViews.includes(view) && !isOwnerAuthenticated) {
      setTargetProtectedView(view);
      setIsOwnerChallengeOpen(true);
      return;
    }
    setCurrentView(view);
  };

  // Sync role change with Owner Protection
  const handleRoleChange = (role: UserRole) => {
    if (role === 'owner' && !isOwnerAuthenticated) {
      setTargetProtectedView('dashboard');
      setIsOwnerChallengeOpen(true);
      return;
    }
    setCurrentRole(role);
    if (role === 'customer') {
      setCurrentView('customer-shop');
    } else if (role === 'cashier') {
      setCurrentView('pos');
    } else if (role === 'beauty_staff') {
      setCurrentView('salon-queue');
    } else if (role === 'delivery') {
      setCurrentView('orders-kanban');
    } else if (role === 'stock') {
      setCurrentView('inventory');
    } else {
      setCurrentView('dashboard');
    }
  };

  // Attempt live hydration from Supabase and restore persistent session if connected
  useEffect(() => {
    // 1. Session Persistence & Auto-Refresh check
    const checkSession = async () => {
      try {
        const { session } = await authService.getSession();
        if (session?.user) {
          setIsOwnerAuthenticated(true);
          setCurrentStaffName(`เจ้าของร้าน (${session.user.email})`);
        }
      } catch (err) {
        console.warn('Session restoration note:', err);
      }
    };
    checkSession();

    // 2. Real Auth state transition listener
    const { data: authListener } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsOwnerAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsOwnerAuthenticated(false);
      }
    });

    const hydrateData = async () => {
      try {
        const { data: dbProducts, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .limit(50);

        if (!prodErr && dbProducts && dbProducts.length > 0) {
          setProducts(
            dbProducts.map((p) => ({
              id: p.id,
              sku: p.sku || p.barcode || 'SKU',
              name: p.name,
              category: p.category || 'General',
              price: Number(p.price || 0),
              cost: Number(p.cost || 0),
              stock: Number(p.stock || 0),
              reorder: Number(p.reorder || 5),
              active: p.active !== false,
            }))
          );
        }

        const { data: dbServices, error: srvErr } = await supabase
          .from('services')
          .select('*')
          .limit(50);

        if (!srvErr && dbServices && dbServices.length > 0) {
          setServices(
            dbServices.map((s) => ({
              id: s.id,
              name: s.name,
              category: s.category || 'Beauty',
              description: s.description,
              duration_minutes: s.duration_minutes || 60,
              price: Number(s.price || 0),
              active: s.active !== false,
            }))
          );
        }

        // Hydrate Support Threads from Supabase
        const { data: dbThreads } = await supabase
          .from('customer_support_threads')
          .select('*')
          .limit(20);
        if (dbThreads && dbThreads.length > 0) {
          setSupportThreads(
            dbThreads.map((t: Record<string, unknown>) => ({
              id: String(t.id),
              organization_id: String(t.organization_id || TENANT_CONFIG.DEFAULT_ORG_ID),
              customer_id: String(t.customer_id || 'cust-001'),
              customer_name: 'ลูกค้า (Supabase)',
              subject: 'ข้อความดูแลลูกค้า',
              status: (t.status as SupportThread['status']) || 'open',
              mode: 'human',
              assigned_to: t.assigned_to ? String(t.assigned_to) : undefined,
              created_at: String(t.created_at || new Date().toISOString()),
              updated_at: String(t.updated_at || new Date().toISOString()),
            }))
          );
        }

        // Hydrate Support Messages from Supabase
        const { data: dbMessages } = await supabase
          .from('customer_support_messages')
          .select('*')
          .limit(50);
        if (dbMessages && dbMessages.length > 0) {
          setSupportMessages(
            dbMessages.map((m: Record<string, unknown>) => ({
              id: String(m.id),
              thread_id: String(m.thread_id),
              sender_type: (m.sender_type as SupportMessage['sender_type']) || 'customer',
              body: String(m.body || ''),
              created_at: String(m.created_at || new Date().toISOString()),
            }))
          );
        }

        // Hydrate Training Courses from Supabase
        const { data: dbCourses } = await supabase
          .from('staff_training_courses')
          .select('*')
          .limit(20);
        if (dbCourses && dbCourses.length > 0) {
          setTrainingCourses(
            dbCourses.map((c: Record<string, unknown>) => ({
              id: String(c.id),
              code: `TRN-${String(c.id).slice(-4).toUpperCase()}`,
              title: String(c.title || 'หลักสูตรอบรม'),
              description: String(c.description || ''),
              category: String(c.category || 'general'),
              duration_minutes: 45,
              modules_count: 3,
              badge_name: 'Certified Specialist',
              required_for_roles: ['service_staff' as UserRole, 'beauty_staff' as UserRole],
            }))
          );
        }
      } catch (err) {
        console.warn('Initial cloud hydration check:', err);
      }
    };

    hydrateData();

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Transaction Event Handlers
  const handleSaleCompleted = (newSale: Sale, updatedProducts: Product[]) => {
    setSales((prev) => [newSale, ...prev]);
    setProducts(updatedProducts);

    // Record movement and audit
    const newMovements: InventoryMovement[] = (newSale.items || []).map((it) => ({
      id: 'mov-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      created_at: new Date().toISOString(),
      product_id: it.product_id || '',
      product_name: it.name,
      sku: it.sku || 'SKU',
      quantity: -it.quantity,
      before_stock: (updatedProducts.find((p) => p.id === it.product_id)?.stock || 0) + it.quantity,
      after_stock: updatedProducts.find((p) => p.id === it.product_id)?.stock || 0,
      reason: 'POS_CHECKOUT_SALE',
      user_name: 'สมศรี (Cashier & POS)',
      reference_id: newSale.id,
    }));

    setMovements((prev) => [...newMovements, ...prev]);

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      created_at: new Date().toISOString(),
      actor_name: 'สมศรี (Cashier & POS)',
      action: 'SALE_COMPLETED',
      entity_type: 'sales',
      entity_id: newSale.id,
      details: {
        total: newSale.total,
        method: newSale.payment_method,
        itemsCount: newSale.items?.length,
        receiptNumber: newSale.receipt_number,
      },
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    // EQUAL1 Operating Engine: commission and activity tracking
    const isDelivery = newSale.channel === 'delivery';
    const beneficiary = employees.find((e) => (isDelivery ? e.role === 'delivery' : e.role === 'cashier'));
    if (beneficiary) {
      const earned = isDelivery ? 25 : Math.round(newSale.total * (beneficiary.commission_rate_pct / 100));
      if (earned > 0) {
        const commItem: CommissionRecord = {
          id: 'comm-' + Date.now(),
          employee_id: beneficiary.id,
          employee_name: beneficiary.nickname,
          transaction_type: 'product_sale',
          reference_id: newSale.id,
          description: isDelivery ? `ค่าบริการจัดส่งด่วน #${newSale.id}` : `คอมมิชชั่นยอดขาย POS #${newSale.id}`,
          amount_base: newSale.total,
          rate_pct: beneficiary.commission_rate_pct,
          commission_earned: earned,
          customer_name: newSale.customer_name || 'ลูกค้าทั่วไปหน้าร้าน',
          created_at: new Date().toISOString(),
          payout_status: 'approved',
        };
        setCommissions((prev) => [commItem, ...prev]);

        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === beneficiary.id
              ? {
                  ...emp,
                  today_sales: emp.today_sales + newSale.total,
                  today_commission: emp.today_commission + earned,
                }
              : emp
          )
        );
      }
    }

    handleAddStaffActivity({
      employee_id: beneficiary?.id || 'emp-004',
      employee_name: beneficiary?.nickname || 'สมศรี (Cashier)',
      action_type: 'sale_order',
      title: `ชำระเงินสำเร็จ Order #${newSale.id} (฿${newSale.total.toLocaleString()})`,
      detail: `วิธีชำระ: ${newSale.payment_method.toUpperCase()} จำนวน ${newSale.items?.length || 0} รายการ`,
      branch_name: 'สาขาเมืองเอก / รังสิต มินิมาร์ท',
    });
  };

  const handleUpdateOrderStatus = (saleId: string, nextStatus: OrderStatus, reason?: string) => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: nextStatus } : s))
    );

    const auditItem: AuditLog = {
      id: 'aud-' + Date.now(),
      created_at: new Date().toISOString(),
      actor_name: currentRole === 'owner' ? 'คุณพิมพ์พร (Owner)' : 'Staff',
      action: 'ORDER_STATUS_UPDATE',
      entity_type: 'sales',
      entity_id: saleId,
      details: { nextStatus, reason: reason || 'State transition' },
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );

    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (status === 'completed' && targetBooking) {
      const stylist = employees.find(
        (e) =>
          e.nickname.includes(targetBooking.technician_name?.split(' ')[0] || '') ||
          e.name.includes(targetBooking.technician_name || '') ||
          e.role === 'beauty_staff'
      );
      if (stylist) {
        const commEarned = Math.round(targetBooking.price * (stylist.commission_rate_pct / 100));
        const commItem: CommissionRecord = {
          id: 'comm-srv-' + Date.now(),
          employee_id: stylist.id,
          employee_name: stylist.nickname,
          transaction_type: 'service',
          reference_id: targetBooking.id,
          description: `${targetBooking.service_name} (${targetBooking.customer_name})`,
          amount_base: targetBooking.price,
          rate_pct: stylist.commission_rate_pct,
          commission_earned: commEarned,
          customer_name: targetBooking.customer_name,
          created_at: new Date().toISOString(),
          payout_status: 'approved',
        };
        setCommissions((prev) => [commItem, ...prev]);

        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === stylist.id
              ? {
                  ...emp,
                  today_services_count: emp.today_services_count + 1,
                  today_commission: emp.today_commission + commEarned,
                }
              : emp
          )
        );

        handleAddStaffActivity({
          employee_id: stylist.id,
          employee_name: stylist.nickname,
          action_type: 'booking_service',
          title: `เสร็จสิ้นบริการ ${targetBooking.service_name}`,
          detail: `ลูกค้า ${targetBooking.customer_name} ได้รับคอมมิชชั่น ฿${commEarned.toLocaleString()} (${stylist.commission_rate_pct}%)`,
          branch_name: stylist.branch_name,
        });
      }
    }

    const auditItem: AuditLog = {
      id: 'aud-' + Date.now(),
      created_at: new Date().toISOString(),
      actor_name: 'ช่างเมย์ (Stylist)',
      action: 'BOOKING_STATUS_UPDATE',
      entity_type: 'bookings',
      entity_id: bookingId,
      details: { status },
    };
    setAuditLogs((prev) => [auditItem, ...prev]);
  };

  const handleCustomerPlaceOrder = (newSale: Sale) => {
    // Deduct products stock and record movements
    const updatedProducts = products.map((prod) => {
      const item = newSale.items?.find((it) => it.product_id === prod.id);
      if (item) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - item.quantity),
        };
      }
      return prod;
    });
    handleSaleCompleted(newSale, updatedProducts);
  };

  const handleAddBooking = async (newBooking: Booking) => {
    try {
      const result = await businessService.executeAtomicBooking(
        newBooking,
        bookings,
        currentRole === 'customer' ? newBooking.customer_name : currentStaffName,
        TENANT_CONFIG.DEFAULT_ORG_ID,
        TENANT_CONFIG.DEFAULT_BRANCH_ID
      );
      setBookings((prev) => [result.booking, ...prev]);
      setAuditLogs((prev) => [result.audit, ...prev]);
    } catch (err: unknown) {
      console.warn('Booking collision / warning:', err);
      // Fallback with audit record
      setBookings((prev) => [newBooking, ...prev]);
      const auditItem: AuditLog = {
        id: 'aud-' + Date.now(),
        created_at: new Date().toISOString(),
        actor_name: currentRole === 'customer' ? newBooking.customer_name : currentStaffName,
        action: 'BOOKING_CREATED',
        entity_type: 'bookings',
        entity_id: newBooking.id,
        details: {
          service: newBooking.service_name,
          time: newBooking.starts_at,
          technician: newBooking.technician_name,
        },
      };
      setAuditLogs((prev) => [auditItem, ...prev]);
    }
  };

  const handleUpdateStock = async (productId: string, delta: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    try {
      const result = await businessService.executeAtomicInventoryAdjustment(
        productId,
        prod.stock,
        delta,
        reason,
        currentStaffName,
        currentRole,
        TENANT_CONFIG.DEFAULT_ORG_ID,
        TENANT_CONFIG.DEFAULT_BRANCH_ID
      );

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: result.newStock } : p))
      );
      setMovements((prev) => [result.movement, ...prev]);
      setAuditLogs((prev) => [result.audit, ...prev]);
    } catch (err: unknown) {
      console.warn('Inventory adjustment rejected by backend rules:', err);
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);

    if (newProduct.stock > 0) {
      const newMovement: InventoryMovement = {
        id: 'mov-' + Date.now(),
        created_at: new Date().toISOString(),
        product_id: newProduct.id,
        product_name: newProduct.name,
        sku: newProduct.sku,
        quantity: newProduct.stock,
        before_stock: 0,
        after_stock: newProduct.stock,
        reason: 'OPENING_STOCK',
        user_name: 'คุณพิมพ์พร (Owner)',
      };
      setMovements((prev) => [newMovement, ...prev]);
    }

    const newAudit: AuditLog = {
      id: 'aud-' + Date.now(),
      created_at: new Date().toISOString(),
      actor_name: 'คุณพิมพ์พร (Owner)',
      action: 'PRODUCT_CREATED',
      entity_type: 'products',
      entity_id: newProduct.id,
      details: { sku: newProduct.sku, price: newProduct.price, initialStock: newProduct.stock },
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  // Cash Shift Operations
  const handleOpenCashShift = (openingAmount: number) => {
    const newSession: CashSession = {
      id: 'shift-' + Date.now().toString().slice(-6),
      opened_at: new Date().toISOString(),
      opening_cash: openingAmount,
      status: 'open',
      user_name: 'สมศรี (Cashier & POS)',
    };
    setCashSessions((prev) => [newSession, ...prev]);
    setIsCashModalOpen(false);

    setAuditLogs((prev) => [
      {
        id: 'aud-' + Date.now(),
        created_at: new Date().toISOString(),
        actor_name: 'สมศรี (Cashier & POS)',
        action: 'CASH_SESSION_OPEN',
        entity_type: 'cash_sessions',
        entity_id: newSession.id,
        details: { openingAmount },
      },
      ...prev,
    ]);
  };

  const handleCloseCashShift = (closingAmount: number) => {
    if (!activeCashShift) return;

    // Calculate cash sales since opening
    const cashSalesSinceOpen = sales
      .filter((s) => s.payment_method === 'cash' && s.payment_status === 'paid')
      .reduce((sum, s) => sum + s.total, 0);

    const expected = activeCashShift.opening_cash + cashSalesSinceOpen;
    const variance = closingAmount - expected;

    setCashSessions((prev) =>
      prev.map((s) =>
        s.id === activeCashShift.id
          ? {
              ...s,
              closed_at: new Date().toISOString(),
              closing_cash: closingAmount,
              expected_cash: expected,
              variance,
              status: 'closed',
            }
          : s
      )
    );
    setIsCashModalOpen(false);

    setAuditLogs((prev) => [
      {
        id: 'aud-' + Date.now(),
        created_at: new Date().toISOString(),
        actor_name: 'สมศรี (Cashier & POS)',
        action: 'CASH_SESSION_CLOSE',
        entity_type: 'cash_sessions',
        entity_id: activeCashShift.id,
        details: { expected, actual: closingAmount, variance },
      },
      ...prev,
    ]);
  };

  // AI Proposals Approval (Owner + Manager Privilege)
  const handleApproveProposal = (proposalId: string) => {
    const prop = aiProposals.find((p) => p.id === proposalId);
    if (!prop) return;

    setAiProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'approved' } : p))
    );

    // AI Flash Sale Proposal Approved: Release Flash Sale to Customer App & POS
    if (prop.id === 'act-000') {
      setProducts((prev) =>
        prev.map((prod) => {
          if (['prod-001', 'prod-002', 'prod-003', 'prod-005', 'prod-007'].includes(prod.id)) {
            return {
              ...prod,
              is_flash_sale: true,
              flash_sale_price: prod.flash_sale_price || Math.round(prod.price * 0.65),
              flash_sale_stock_limit: prod.flash_sale_stock_limit || 25,
              flash_sale_sold_count: prod.flash_sale_sold_count || 12,
            };
          }
          return prod;
        })
      );
    }

    // Execute safe mutation based on proposal
    if (prop.type === 'reorder' && prop.dataPayload?.sku) {
      const p = products.find((x) => x.sku === prop.dataPayload?.sku);
      if (p) {
        handleUpdateStock(
          p.id,
          Number(prop.dataPayload?.reorder_qty || 24),
          'AI_PROPOSAL_RESTOCK_APPROVED'
        );
      }
    }

    setAuditLogs((prev) => [
      {
        id: 'aud-' + Date.now(),
        created_at: new Date().toISOString(),
        actor_name: 'คุณนันท์นภัส (Owner)',
        action: 'AI_ACTION_APPROVED_AND_EXECUTED',
        entity_type: 'ai_actions',
        entity_id: proposalId,
        details: { title: prop.title, type: prop.type, approved_by: 'Owner + Store Manager' },
      },
      ...prev,
    ]);
  };

  const handleRejectProposal = (proposalId: string) => {
    setAiProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'rejected' } : p))
    );
  };

  // Todays cash sales calculation for cash drawer
  const todaysCashSales = sales
    .filter((s) => s.payment_method === 'cash' && s.payment_status === 'paid')
    .reduce((sum, s) => sum + s.total, 0);

  // Quick statistics for Dashboard
  const totalRevenue = sales
    .filter((s) => s.payment_status === 'paid')
    .reduce((sum, s) => sum + s.total, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.reorder);
  const pendingOrdersCount = sales.filter((s) => s.status !== 'completed').length;
  const todayBookingsCount = bookings.filter((b) => b.status === 'confirmed').length;

  const theme = THEMES[currentTheme];

  return (
    <div className={`min-h-screen ${theme.bgMain} ${theme.textPrimary} font-sans antialiased transition-colors duration-200 selection:bg-[#889A7B] selection:text-white`}>
      {/* Top Application Bar */}
      <Navigation
        currentView={currentView}
        onSelectView={handleSelectView}
        currentRole={currentRole}
        currentStaffName={currentStaffName}
        onChangeRole={handleRoleChange}
        currentLang={currentLang}
        onChangeLang={(l) => setCurrentLang(l)}
        activeCashShift={!!activeCashShift}
        onOpenCashModal={() => setIsCashModalOpen(true)}
        onOpenAiBrain={() => setIsAiBrainOpen(true)}
        cartCount={customerCart.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenAuthSecurity={() => setIsAuthModalOpen(true)}
        isSessionLocked={isSessionLocked}
        isOwnerAuthenticated={isOwnerAuthenticated}
        onRequestOwnerLogin={() => {
          setTargetProtectedView('dashboard');
          setIsEqual1LoginOpen(true);
        }}
        onOwnerLogout={handleOwnerLogout}
        currentTheme={currentTheme}
        onChangeTheme={(t) => setCurrentTheme(t)}
      />

      {/* Main App View Routing */}
      <main className="pb-16">
        {/* CUSTOMER MODE VIEWS */}
        {currentRole === 'customer' || currentView.startsWith('customer-') ? (
          <CustomerApp
            products={products}
            services={services}
            customers={customers}
            activeCustomer={activeCustomer}
            sales={sales}
            bookings={bookings}
            cart={customerCart}
            onUpdateCart={(newCart) => setCustomerCart(newCart)}
            onPlaceOrder={handleCustomerPlaceOrder}
            onCreateBooking={handleAddBooking}
            lang={currentLang}
            campaigns={campaigns}
            vouchers={vouchers}
            onUploadSlip={handleCustomerUploadSlip}
            onCustomerLogin={handleCustomerLogin}
            onCustomerRegister={handleCustomerRegister}
            onCustomerUpdate={handleCustomerUpdate}
            onCustomerLogout={handleCustomerLogout}
          />
        ) : (
          /* BACKOFFICE & OWNER VIEWS */
          <>
            {currentView === 'dashboard' && (
              !isOwnerAuthenticated ? (
                <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-gray-200 shadow-xl text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-[#1F1F1F]">ระบบเจ้าของร้าน (Owner Restricted)</h2>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    พื้นที่นี้สงวนสิทธิ์เฉพาะเจ้าของกิจการเท่านั้น เพื่อรักษาความลับของตัวเลขยอดขายและผลกำไร กรุณาเข้าสู่ระบบด้วยบัญชีเจ้าของร้าน
                  </p>
                  <button
                    onClick={() => {
                      setTargetProtectedView('dashboard');
                      setIsEqual1LoginOpen(true);
                    }}
                    className="w-full py-3 bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold rounded-xl shadow transition cursor-pointer"
                  >
                    เข้าสู่ระบบเจ้าของร้าน (Sign In)
                  </button>
                </div>
              ) : (
              <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Executive Welcome & Pulse */}
                <div className="bg-[#171717] text-[#FAF8F5] rounded-3xl p-6 sm:p-8 shadow-xl mb-8 relative overflow-hidden">
                  <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
                    <div>
                      <span className="text-xs font-mono font-bold tracking-widest text-[#E6A055] uppercase block mb-1">
                        EQUAL1 EXECUTIVE OS · VERSION 1.0.0
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-black text-white">
                        ศูนย์ควบคุมธุรกิจแบบองค์รวม (Unified Control Center)
                      </h1>
                      <p className="text-sm text-[#B0ACA0] mt-1 max-w-xl">
                        เชื่อมโยงมินิมาร์ท จุดขายหน้าร้าน ซาลอน คิวบริการ สต๊อก การตลาด สแกนสลิป และการเงินบนระบบเดียว
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentView('pos')}
                        className="px-5 py-3 rounded-2xl bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-sm shadow transition flex items-center gap-2"
                      >
                        <Store className="w-4 h-4" />
                        <span>เปิด POS ขายหน้าร้าน</span>
                      </button>

                      <button
                        onClick={() => setCurrentView('slip-verification')}
                        className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur transition flex items-center gap-2"
                      >
                        <FileCheck2 className="w-4 h-4 text-emerald-400" />
                        <span>สแกนตรวจสลิป ({slipRecords.length})</span>
                      </button>

                      <button
                        onClick={() => setIsAiBrainOpen(true)}
                        className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur transition flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>AI Brain</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5-Second Executive Health Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div
                    onClick={() => setCurrentView('finance')}
                    className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm hover:border-[#CCC] cursor-pointer transition"
                  >
                    <span className="text-xs text-[#8C887B] font-medium block mb-1">
                      ยอดขายสะสมวันนี้ (Today Sales)
                    </span>
                    <strong className="text-3xl font-black text-[#171717]">
                      ฿{totalRevenue.toLocaleString()}
                    </strong>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{sales.length} ธุรกรรมสำเร็จ</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentView('orders-kanban')}
                    className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm hover:border-[#CCC] cursor-pointer transition"
                  >
                    <span className="text-xs text-[#8C887B] font-medium block mb-1">
                      ออเดอร์ค้างส่ง (Pending Orders)
                    </span>
                    <strong className="text-3xl font-black text-[#171717]">
                      {pendingOrdersCount}
                    </strong>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-2">
                      <Layers className="w-3.5 h-3.5" />
                      <span>ต้องเตรียม & จัดส่ง</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentView('salon-queue')}
                    className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm hover:border-[#CCC] cursor-pointer transition"
                  >
                    <span className="text-xs text-[#8C887B] font-medium block mb-1">
                      คิวนัดซาลอนวันนี้ (Salon Bookings)
                    </span>
                    <strong className="text-3xl font-black text-[#171717]">
                      {todayBookingsCount}
                    </strong>
                    <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold mt-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{bookings.length} นัดหมายทั้งหมด</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setCurrentView('inventory')}
                    className="bg-white p-5 rounded-3xl border border-[#E6E4DD] shadow-sm hover:border-[#CCC] cursor-pointer transition"
                  >
                    <span className="text-xs text-[#8C887B] font-medium block mb-1">
                      สินค้าสต๊อกต่ำ (Low Stock Alert)
                    </span>
                    <strong
                      className={`text-3xl font-black ${
                        lowStockProducts.length > 0 ? 'text-[#B42318]' : 'text-[#171717]'
                      }`}
                    >
                      {lowStockProducts.length}
                    </strong>
                    <div className="flex items-center gap-1 text-xs text-rose-600 font-semibold mt-2">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{lowStockProducts.length > 0 ? 'ต้องเติมของด่วน' : 'สต๊อกปกติ'}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Hub */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Column 1: Fast POS & Mini-mart */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                        <Store className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-[#171717] mb-1">
                        จุดขาย POS หน้าร้าน
                      </h3>
                      <p className="text-[11px] text-[#7A7569] leading-relaxed mb-3">
                        ยิงบาร์โค้ดเร็ว พัก/เรียกคืนบิล และรับเงินสด/PromptPay
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('pos')}
                      className="w-full py-2 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>เปิด POS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column 2: Beauty & Stylist Scheduler */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-[#171717] mb-1">
                        คิวบริการ & ช่างซาลอน
                      </h3>
                      <p className="text-[11px] text-[#7A7569] leading-relaxed mb-3">
                        ตรวจคิวชน ตารางเวลา และตู้กดบัตรคิวดิจิทัล
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('salon-queue')}
                      className="w-full py-2 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>เปิดคิวช่าง</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column 3: Slip Verification */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                        <FileCheck2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-[#171717] mb-1">
                        สแกนสลิป & ประวัติชำระ
                      </h3>
                      <p className="text-[11px] text-[#7A7569] leading-relaxed mb-3">
                        AI OCR ตรวจสลิปแท้ สลิปวนซ้ำ และยอดเงินไม่ตรง
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('slip-verification')}
                      className="w-full py-2 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>ตรวจสลิป</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column 4: Marketing Campaigns */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-3">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-[#171717] mb-1">
                        แคมเปญ & โค้ดส่วนลด
                      </h3>
                      <p className="text-[11px] text-[#7A7569] leading-relaxed mb-3">
                        จัดการแบนเนอร์ คูปอง และ LINE OA Broadcast
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('marketing')}
                      className="w-full py-2 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>คุมแคมเปญ</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column 5: Team OS & Operating Engine */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-[#E6A055]" />
                      </div>
                      <h3 className="text-sm font-black text-[#171717] mb-1">
                        EQUAL1 Team OS
                      </h3>
                      <p className="text-[11px] text-[#7A7569] leading-relaxed mb-3">
                        บริหารคน งาน สิทธิ์ คอมมิชชั่น และเปิด-ปิดร้าน ({employees.length} คน)
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView('team-os')}
                      className="w-full py-2 bg-[#E6A055] hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>เปิด Team OS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Column 6: Security Lock & RBAC */}
                  <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-black text-[#171717] mb-1">
                        ความปลอดภัย & PIN
                      </h3>
                      <p className="text-[11px] text-[#7A7569] leading-relaxed mb-3">
                        สลับกะพนักงานด้วย PIN 4 หลัก และล็อคหน้าจอทันที
                      </p>
                    </div>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-2 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <span>จัดการสิทธิ์</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {currentView === 'team-os' && (
              <TeamOsManager
                currentRole={currentRole}
                currentStaffName={currentStaffName}
                isOwnerAuthenticated={isOwnerAuthenticated}
                onRequestOwnerLogin={() => {
                  setTargetProtectedView('team-os');
                  setIsEqual1LoginOpen(true);
                }}
                employees={employees}
                onUpdateEmployees={setEmployees}
                tasks={tasks}
                onUpdateTasks={setTasks}
                approvals={approvals}
                onUpdateApprovals={setApprovals}
                commissions={commissions}
                onUpdateCommissions={setCommissions}
                trainingCourses={trainingCourses}
                activities={staffActivities}
                onAddActivity={handleAddStaffActivity}
                bookings={bookings}
                sales={sales}
                products={products}
                onNavigateToView={setCurrentView}
                customers={customers}
                onSendCartToPos={(items) => {
                  setPosInitialCart(items);
                  setCurrentView('pos');
                  handleSecurityAudit('TEAM_CART_TRANSFERRED_TO_POS', {
                    itemsCount: items.length,
                    staff: currentStaffName,
                  });
                }}
                onQuickSaleCompleted={handleSaleCompleted}
              />
            )}

            {currentView === 'pos' && (
              <PosTerminal
                products={products}
                customers={customers}
                onSaleCompleted={handleSaleCompleted}
                lang={currentLang}
                cashShiftOpen={!!activeCashShift}
                onOpenCashShift={() => setIsCashModalOpen(true)}
                cashierName={currentRole === 'owner' ? 'คุณพิมพ์พร (Owner)' : 'สมศรี (Cashier)'}
                initialCart={posInitialCart}
                onClearInitialCart={() => setPosInitialCart([])}
              />
            )}

            {currentView === 'salon-queue' && (
              <SalonBookingView
                bookings={bookings}
                services={services}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onAddBooking={handleAddBooking}
                lang={currentLang}
                onSendToPos={handleSendBookingToPos}
              />
            )}

            {currentView === 'slip-verification' && (
              <PaymentHistorySlipVerification
                sales={sales}
                slipRecords={slipRecords}
                onVerifyAndApproveSlip={handleVerifyAndApproveSlip}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                lang={currentLang}
              />
            )}

            {currentView === 'marketing' && (
              <MarketingCampaignManager
                campaigns={campaigns}
                vouchers={vouchers}
                onAddCampaign={handleAddCampaign}
                onToggleCampaign={handleToggleCampaign}
                onDeleteCampaign={handleDeleteCampaign}
                onAddVoucher={handleAddVoucher}
                onToggleVoucher={handleToggleVoucher}
                onDeleteVoucher={handleDeleteVoucher}
                lang={currentLang}
              />
            )}

            {currentView === 'orders-kanban' && (
              <OrderCenterKanban
                sales={sales}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                lang={currentLang}
              />
            )}

            {currentView === 'inventory' && (
              <InventoryManager
                products={products}
                movements={movements}
                onUpdateStock={handleUpdateStock}
                onAddProduct={handleAddProduct}
                lang={currentLang}
              />
            )}

            {currentView === 'finance' && (
              <FinanceDashboard
                sales={sales}
                cashSessions={cashSessions}
                lang={currentLang}
              />
            )}

            {currentView === 'system-health' && (
              <SystemHealthMonitor auditLogs={auditLogs} />
            )}

            {currentView === 'support' && (
              <CustomerSupportWorkspace
                currentRole={currentRole}
                currentStaffName={currentStaffName}
                customers={customers}
                activeThreads={supportThreads}
                messages={supportMessages}
                onSendMessage={handleSendSupportMessage}
                onTakeoverThread={handleTakeoverSupportThread}
                onResolveThread={handleResolveSupportThread}
              />
            )}

            {currentView === 'learning' && (
              <StaffLearningWorkspace
                currentStaffName={currentStaffName}
                currentRole={currentRole}
                courses={trainingCourses}
                assignments={trainingAssignments}
                onCompleteAssignment={handleCompleteAssignment}
                onClockInToggle={() => {}}
                isClockedIn={true}
              />
            )}

            {currentView === 'owner-control' && (
              <OwnerControlWorkspace
                currentStaffName={currentStaffName}
                currentRole={currentRole}
                employees={employees}
                approvals={approvals}
                onApproveRequest={handleApproveRequest}
                onRejectRequest={handleRejectRequest}
                activities={staffActivities}
                bookings={bookings}
                sales={sales}
                onNavigateToView={(view) => setCurrentView(view)}
              />
            )}

            {currentView === 'owner-myapp' && (
              <OwnerMyAppControl
                currentTheme={currentTheme}
                onChangeTheme={setCurrentTheme}
                onSecurityAudit={handleSecurityAudit}
              />
            )}
          </>
        )}
      </main>

      {/* Cash Drawer Modal */}
      <CashDrawerModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        activeSession={activeCashShift}
        onOpenSession={handleOpenCashShift}
        onCloseSession={handleCloseCashShift}
        pastSessions={cashSessions}
        todaysCashSales={todaysCashSales}
      />

      {/* AI Business Brain Modal */}
      <AiBusinessBrainModal
        isOpen={isAiBrainOpen}
        onClose={() => setIsAiBrainOpen(false)}
        proposals={aiProposals}
        onApproveProposal={handleApproveProposal}
        onRejectProposal={handleRejectProposal}
        sales={sales}
        products={products}
        bookings={bookings}
      />

      {/* Secure Auth & Multi-Role Modal */}
      <AuthSecurityModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={currentRole}
        currentStaffName={currentStaffName}
        onSelectRole={handleSelectStaffRole}
        staffAccounts={staffAccounts}
        onUpdateStaffAccounts={(updated) => setStaffAccounts(updated)}
        onLogSecurityAudit={handleSecurityAudit}
        isLocked={isSessionLocked}
        onUnlockSession={() => setIsSessionLocked(false)}
        onLockSession={() => setIsSessionLocked(true)}
      />

      {/* EQUAL1 Master Login Modal */}
      <Equal1LoginModal
        isOpen={isEqual1LoginOpen}
        onClose={() => setIsEqual1LoginOpen(false)}
        onOwnerLoginSuccess={handleOwnerLoginSuccess}
        onStaffLoginSuccess={handleStaffLoginSuccess}
        onCustomerLoginSuccess={() => {
          setIsOwnerAuthenticated(false);
          setCurrentRole('customer');
          setCurrentView('customer-shop');
        }}
        staffAccounts={staffAccounts}
        currentTheme={currentTheme}
      />

      {/* Owner Protected Challenge Modal */}
      <OwnerAuthChallengeModal
        isOpen={isOwnerChallengeOpen}
        onClose={() => setIsOwnerChallengeOpen(false)}
        onVerifySuccess={handleOwnerVerifySuccess}
        targetFeatureName={
          targetProtectedView === 'dashboard'
            ? 'ศูนย์ควบคุมธุรกิจเจ้าของร้าน (Owner Executive OS)'
            : targetProtectedView === 'finance'
            ? 'การเงิน & ผลกำไร (Financial Dashboard)'
            : targetProtectedView === 'marketing'
            ? 'จัดการแคมเปญ & ปล่อยโปรโมชั่น (Marketing & Flash Sale)'
            : targetProtectedView === 'team-os'
            ? 'ศูนย์อนุมัติ & บริหารทีมงาน (Approvals & Team Control)'
            : 'ระบบเจ้าของร้าน'
        }
      />
    </div>
  );
}
