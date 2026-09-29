import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Clock,
  Calendar,
  CheckCircle,
  Truck,
  MapPin,
  ChevronRight,
  Plus,
  Minus,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Star,
  Award,
  Phone,
  Tag,
  Upload,
  FileCheck2,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  User,
  UserCheck,
  LogOut,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  Product,
  ServiceItem,
  CartItem,
  Sale,
  Booking,
  Customer,
  MarketingCampaign,
  PromoVoucher,
  BankSlipRecord,
} from '../types';
import { Language, getTranslation } from '../lib/i18n';
import {
  hashSync,
  verifySecret,
  maskPhoneNumber,
  playTactileHaptic,
} from '../lib/security';

interface CustomerAppProps {
  products: Product[];
  services: ServiceItem[];
  customers: Customer[];
  activeCustomer: Customer;
  sales: Sale[];
  bookings: Booking[];
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  onPlaceOrder: (newSale: Sale) => void;
  onCreateBooking: (newBooking: Booking) => void;
  lang: Language;
  campaigns?: MarketingCampaign[];
  vouchers?: PromoVoucher[];
  onUploadSlip?: (orderId: string, record: BankSlipRecord) => void;
  onCustomerLogin?: (customer: Customer) => void;
  onCustomerRegister?: (newCustomer: Customer) => void;
  onCustomerUpdate?: (updatedCustomer: Customer) => void;
  onCustomerLogout?: () => void;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  products,
  services,
  customers,
  activeCustomer,
  sales,
  bookings,
  cart,
  onUpdateCart,
  onPlaceOrder,
  onCreateBooking,
  lang,
  campaigns = [],
  vouchers = [],
  onUploadSlip,
  onCustomerLogin,
  onCustomerRegister,
  onCustomerUpdate,
  onCustomerLogout,
}) => {
  const t = (k: string) => getTranslation(lang, k);

  const [activeTab, setActiveTab] = useState<'shop' | 'services' | 'orders' | 'loyalty'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('all');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');

  // Checkout modal & vouchers
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState(activeCustomer.delivery_address || 'คอนโดเมืองเอก ตึก B ชั้น 8');
  const [customerPhone, setCustomerPhone] = useState(activeCustomer.phone || '081-234-5678');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'promptpay' | 'cash' | 'card'>('promptpay');
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<PromoVoucher | null>(null);
  const [usePointsRedeem, setUsePointsRedeem] = useState(false);

  // Customer slip upload modal
  const [slipUploadOrder, setSlipUploadOrder] = useState<Sale | null>(null);
  const [uploadedSlipPreview, setUploadedSlipPreview] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  // Booking Modal
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState<string>('14:00');
  const [technicianChoice, setTechnicianChoice] = useState<string>('ช่างเมย์ (Master Stylist)');
  const [bookingNotes, setBookingNotes] = useState('');

  // ----------------------------------------------------
  // CUSTOMER AUTH & SECURITY MODAL STATES
  // ----------------------------------------------------
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'register' | 'otp'>('signin');

  // Sign In inputs
  const [loginPhone, setLoginPhone] = useState('081-234-5678');
  const [loginPassword, setLoginPassword] = useState('Member1234!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // OTP inputs
  const [otpPhone, setOtpPhone] = useState('081-234-5678');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Change Password in Profile Drawer
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showChangePasswordSection, setShowChangePasswordSection] = useState(false);

  // Messages
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [customerToast, setCustomerToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showCustomerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setCustomerToast({ message, type });
    setTimeout(() => setCustomerToast(null), 3500);
  };

  // Animation state for progress bar width updates and smooth growth transform
  const [isProgressBarGrowing, setIsProgressBarGrowing] = useState(false);
  const prevProgressPctRef = useRef<number | null>(null);

  // Update address when activeCustomer changes
  useEffect(() => {
    if (activeCustomer.delivery_address) {
      setDeliveryAddress(activeCustomer.delivery_address);
    }
    if (activeCustomer.phone) {
      setCustomerPhone(activeCustomer.phone);
    }
  }, [activeCustomer]);

  // OTP countdown timer
  useEffect(() => {
    let t: NodeJS.Timeout;
    if (otpCountdown > 0) {
      t = setInterval(() => setOtpCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(t);
  }, [otpCountdown]);

  // Password strength score (0 to 4)
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (regPassword.length >= 6) score += 1;
    if (regPassword.length >= 8) score += 1;
    if (/[0-9]/.test(regPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(regPassword) || /[A-Z]/.test(regPassword)) score += 1;
    return score;
  }, [regPassword]);

  // Cart calculations with Voucher Discount & Points
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const voucherDiscount = useMemo(() => {
    if (!appliedVoucher) return 0;
    if (cartSubtotal < appliedVoucher.min_spend) return 0;
    if (appliedVoucher.discount_type === 'fixed') {
      return Math.min(cartSubtotal, appliedVoucher.discount_value);
    } else {
      const pct = (cartSubtotal * appliedVoucher.discount_value) / 100;
      return appliedVoucher.max_discount ? Math.min(pct, appliedVoucher.max_discount) : pct;
    }
  }, [appliedVoucher, cartSubtotal]);

  // 100 PTS = ฿10 Discount
  const pointsDiscount = useMemo(() => {
    if (!usePointsRedeem || activeCustomer.points < 100) return 0;
    const maxPtsCanUse = Math.min(activeCustomer.points, 500); // Up to 500 points = ฿50
    return Math.floor(maxPtsCanUse / 10);
  }, [usePointsRedeem, activeCustomer.points]);

  const deliveryFee = fulfillmentType === 'delivery' ? 25 : 0;
  const cartTotal = Math.max(0, cartSubtotal - voucherDiscount - pointsDiscount + deliveryFee);

  // Tier Progression Calculation for visual progress bar
  // Dynamically calculates points needed, target points, progress percentage, and dynamic tier color styling
  const tierProgression = useMemo(() => {
    const pts = activeCustomer.points || 0;
    const tierRaw = (activeCustomer.tier || 'EQUAL').trim();
    const tierUpper = tierRaw.toUpperCase();

    // Check rank dynamically based on customer tier or points thresholds
    const isServiceElite =
      tierUpper.includes('SERVICE') ||
      tierUpper.includes('ELITE') ||
      tierUpper.includes('PLATINUM') ||
      pts >= 1000;

    const isMartVip =
      !isServiceElite && (
        tierUpper.includes('MART') ||
        tierUpper.includes('VIP') ||
        tierUpper.includes('GOLD') ||
        pts >= 300
      );

    if (isServiceElite) {
      const isMax = pts >= 1000;
      const needed = Math.max(0, 1000 - pts);
      const progress = isMax ? 100 : Math.min(100, Math.max(4, Math.round((pts / 1000) * 100)));
      return {
        currentTier: activeCustomer.tier || '1Service Elite',
        nextTier: 'VIP CLUB ULTRA (ระดับสูงสุด)',
        isMaxTier: isMax,
        pointsNeeded: needed,
        progressPct: progress,
        targetPoints: 1000,
        // Dynamic background colors reflecting 1Service Elite (Royal Gold & Champagne Amber)
        tierColor: 'from-amber-400 via-amber-300 to-[#E6A055]',
        solidColor: '#F59E0B',
        gradientCss: 'linear-gradient(90deg, #F59E0B 0%, #FDE047 50%, #D97706 100%)',
        accentBadge: '1Service Elite',
        badgeText: isMax
          ? 'คุณอยู่ในระดับสมาชิกสูงสุดของ EQUAL1 แล้ว 🏆'
          : `ขาดอีก ${needed.toLocaleString()} แต้ม สู่สถานะ VIP CLUB ULTRA 👑`,
      };
    } else if (isMartVip) {
      const needed = Math.max(0, 1000 - pts);
      const basePts = 300;
      const progress = Math.min(100, Math.max(4, Math.round(((Math.max(0, pts - basePts)) / (1000 - basePts)) * 100)));
      return {
        currentTier: activeCustomer.tier || '1Mart VIP',
        nextTier: '1Service Elite',
        isMaxTier: false,
        pointsNeeded: needed,
        progressPct: progress,
        targetPoints: 1000,
        // Dynamic background colors reflecting 1Mart VIP (Warm Amber & Honey Gold)
        tierColor: 'from-[#E6A055] via-amber-400 to-amber-300',
        solidColor: '#E6A055',
        gradientCss: 'linear-gradient(90deg, #E6A055 0%, #FBBF24 50%, #F59E0B 100%)',
        accentBadge: '1Mart VIP',
        badgeText: `อีก ${needed.toLocaleString()} แต้ม เพื่อเลื่อนระดับเป็น 1Service Elite ✨`,
      };
    } else {
      // EQUAL (Standard / Entry Tier)
      const needed = Math.max(0, 300 - pts);
      const progress = Math.min(100, Math.max(4, Math.round((pts / 300) * 100)));
      return {
        currentTier: activeCustomer.tier || 'EQUAL',
        nextTier: '1Mart VIP',
        isMaxTier: false,
        pointsNeeded: needed,
        progressPct: progress,
        targetPoints: 300,
        // Dynamic background colors reflecting EQUAL Tier (Fresh Jade & Emerald)
        tierColor: 'from-emerald-400 via-teal-400 to-emerald-500',
        solidColor: '#10B981',
        gradientCss: 'linear-gradient(90deg, #10B981 0%, #2DD4BF 50%, #059669 100%)',
        accentBadge: 'EQUAL Standard',
        badgeText: `อีก ${needed.toLocaleString()} แต้ม เพื่อเลื่อนระดับเป็น 1Mart VIP 🌟`,
      };
    }
  }, [activeCustomer.points, activeCustomer.tier]);

  // Trigger smooth transform animation when progress bar width updates
  useEffect(() => {
    if (prevProgressPctRef.current !== null && prevProgressPctRef.current !== tierProgression.progressPct) {
      setIsProgressBarGrowing(true);
      const timer = setTimeout(() => {
        setIsProgressBarGrowing(false);
      }, 750);
      return () => clearTimeout(timer);
    }
    prevProgressPctRef.current = tierProgression.progressPct;
  }, [tierProgression.progressPct]);

  // Voucher apply handler
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = voucherCodeInput.trim().toUpperCase();
    const match = vouchers.find((v) => v.code === raw && v.active);

    if (!match) {
      showCustomerToast(`ไม่พบโค้ด "${raw}" หรือโค้ดหมดอายุแล้ว`, 'error');
      return;
    }

    if (cartSubtotal < match.min_spend) {
      showCustomerToast(`ยอดสั่งซื้อขั้นต่ำสำหรับโค้ด ${match.code} คือ ฿${match.min_spend} (ยอดปัจจุบัน ฿${cartSubtotal})`, 'error');
      return;
    }

    setAppliedVoucher(match);
    playTactileHaptic('success');
    showCustomerToast(`ใช้โค้ดส่วนลด ${match.code} สำเร็จ! ลดทันที ฿${match.discount_value}`, 'success');
  };

  const productCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [products]);

  const serviceCategories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => s.category && set.add(s.category));
    return Array.from(set);
  }, [services]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedProductCategory === 'all' || p.category === selectedProductCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      return matchCat && matchSearch && p.active !== false;
    });
  }, [products, selectedProductCategory, searchQuery]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = selectedServiceCategory === 'all' || s.category === selectedServiceCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || s.name.toLowerCase().includes(q);
      return matchCat && matchSearch && s.active !== false;
    });
  }, [services, selectedServiceCategory, searchQuery]);

  // Cart management
  const handleAddToCart = (product: Product) => {
    playTactileHaptic('keypad');
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      onUpdateCart(
        cart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      onUpdateCart([...cart, { product, quantity: 1 }]);
    }
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    playTactileHaptic('keypad');
    const existing = cart.find((item) => item.product.id === productId);
    if (!existing) return;

    const nextQty = existing.quantity + delta;
    if (nextQty <= 0) {
      onUpdateCart(cart.filter((item) => item.product.id !== productId));
    } else {
      onUpdateCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity: nextQty } : item
        )
      );
    }
  };

  // Submit Order Checkout
  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;

    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const newSale: Sale = {
      id: orderId,
      created_at: new Date().toISOString(),
      customer_id: activeCustomer.id,
      customer_name: activeCustomer.name,
      customer_phone: customerPhone,
      channel: 'delivery',
      status: 'pending',
      payment_status: selectedPaymentMethod === 'cash' ? 'pending' : 'pending',
      payment_method: selectedPaymentMethod,
      subtotal: cartSubtotal,
      discount: voucherDiscount + pointsDiscount,
      delivery_fee: deliveryFee,
      total: cartTotal,
      delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : 'รับเองที่ร้าน EQUAL1 Hub',
      items: cart.map((it, idx) => ({
        id: `si-${orderId}-${idx}`,
        sale_id: orderId,
        product_id: it.product.id,
        name: it.product.name,
        sku: it.product.sku,
        quantity: it.quantity,
        unit_price: it.product.price,
        unit_cost: it.product.cost || 0,
        line_total: it.product.price * it.quantity,
      })),
    };

    onPlaceOrder(newSale);
    onUpdateCart([]);
    setIsCheckoutOpen(false);
    playTactileHaptic('success');

    // Deduct points if redeemed
    if (usePointsRedeem && onCustomerUpdate && activeCustomer.points >= 100) {
      onCustomerUpdate({
        ...activeCustomer,
        points: Math.max(0, activeCustomer.points - 100),
      });
      setUsePointsRedeem(false);
    }

    if (selectedPaymentMethod === 'promptpay') {
      setSlipUploadOrder(newSale);
    } else {
      showCustomerToast(`สั่งซื้อสำเร็จ! รหัสออเดอร์ #${orderId} พนักงานกำลังเตรียมสินค้าจัดส่ง`, 'success');
    }
    setActiveTab('orders');
  };

  // Booking appointment submission
  const handleConfirmBooking = () => {
    if (!selectedService) return;
    if (!bookingDate || !bookingTime) {
      showCustomerToast('กรุณาเลือกวันและเวลาที่ต้องการรับบริการ', 'error');
      return;
    }

    const bookingId = 'BK-' + Date.now().toString().slice(-6);
    const newBooking: Booking = {
      id: bookingId,
      created_at: new Date().toISOString(),
      service_id: selectedService.id,
      service_name: selectedService.name,
      customer_name: activeCustomer.name,
      customer_phone: customerPhone,
      starts_at: `${bookingDate}T${bookingTime}:00`,
      duration_minutes: selectedService.duration_minutes,
      technician_name: technicianChoice,
      status: 'confirmed',
      price: selectedService.price,
      notes: bookingNotes || undefined,
    };

    onCreateBooking(newBooking);
    setSelectedService(null);
    playTactileHaptic('success');
    showCustomerToast(`จองคิวสำเร็จ! คิวนัดหมาย #${bookingId} สำหรับ ${selectedService.name} ถูกบันทึกแล้ว`, 'success');
    setActiveTab('orders');
  };

  // Filter customer's own orders
  const mySales = useMemo(() => {
    return sales.filter(
      (s) =>
        s.customer_name === activeCustomer.name ||
        s.customer_id === activeCustomer.id ||
        (activeCustomer.phone && s.customer_phone === activeCustomer.phone) ||
        s.channel === 'delivery'
    );
  }, [sales, activeCustomer]);

  // ----------------------------------------------------
  // CUSTOMER AUTH HANDLERS
  // ----------------------------------------------------
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const cleanInputPhone = loginPhone.replace(/[^0-9]/g, '');
    const matched = customers.find((c) => {
      const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return (
        (cleanInputPhone && cPhone === cleanInputPhone) ||
        (c.email && c.email.toLowerCase() === loginPhone.toLowerCase())
      );
    });

    if (!matched) {
      playTactileHaptic('error');
      setAuthError('ไม่พบบัญชีสมาชิกด้วยเบอร์โทรหรืออีเมลนี้ กรุณาสมัครสมาชิกใหม่');
      return;
    }

    // Verify Password against hash
    if (matched.password_hash) {
      const ok = verifySecret(loginPassword, matched.password_hash);
      if (!ok) {
        playTactileHaptic('error');
        setAuthError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง หรือเข้าสู่ระบบด้วย OTP');
        return;
      }
    }

    playTactileHaptic('success');
    setAuthSuccess(`ยินดีต้อนรับกลับ, ${matched.name}! เข้าสู่ระบบสำเร็จ`);

    setTimeout(() => {
      if (onCustomerLogin) {
        onCustomerLogin(matched);
      }
      setIsAuthModalOpen(false);
      setAuthSuccess(null);
    }, 600);
  };

  const handleSendOtp = () => {
    if (!otpPhone || otpPhone.length < 9) {
      setAuthError('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง');
      return;
    }
    setOtpSent(true);
    setOtpCountdown(60);
    setOtpCode('123456'); // Simulated fast OTP
    playTactileHaptic('keypad');
    setAuthSuccess('รหัส OTP ทดสอบคือ "123456" (ส่งไปยัง SMS เบอร์ ' + otpPhone + ')');
  };

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (otpCode !== '123456') {
      playTactileHaptic('error');
      setAuthError('รหัส OTP ไม่ถูกต้อง กรุณากรอก 123456');
      return;
    }

    const cleanInputPhone = otpPhone.replace(/[^0-9]/g, '');
    let matched = customers.find((c) => (c.phone || '').replace(/[^0-9]/g, '') === cleanInputPhone);

    if (!matched) {
      // Auto register quick member via phone
      matched = {
        id: 'cust-' + Date.now(),
        name: 'สมาชิก EQUAL1 (' + maskPhoneNumber(otpPhone) + ')',
        phone: otpPhone,
        points: 50,
        tier: 'EQUAL',
        created_at: new Date().toISOString(),
      };
      if (onCustomerRegister) onCustomerRegister(matched);
    } else {
      if (onCustomerLogin) onCustomerLogin(matched);
    }

    playTactileHaptic('success');
    setAuthSuccess('ยืนยัน OTP สำเร็จ! เข้าสู่ระบบเรียบร้อย');
    setTimeout(() => {
      setIsAuthModalOpen(false);
      setAuthSuccess(null);
      setOtpSent(false);
    }, 600);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (!regName.trim()) {
      setAuthError('กรุณาระบุชื่อ-นามสกุล');
      return;
    }

    if (!regPhone || regPhone.length < 9) {
      setAuthError('กรุณาระบุเบอร์โทรศัพท์ 10 หลัก');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    // Check duplicate phone
    const cleanPhone = regPhone.replace(/[^0-9]/g, '');
    const isDup = customers.some((c) => (c.phone || '').replace(/[^0-9]/g, '') === cleanPhone);
    if (isDup) {
      setAuthError('เบอร์โทรศัพท์นี้เป็นสมาชิกอยู่แล้ว กรุณาเข้าสู่ระบบ');
      return;
    }

    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: regName.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim() || undefined,
      points: 50, // Welcome Bonus
      tier: 'EQUAL',
      created_at: new Date().toISOString(),
      password_hash: hashSync(regPassword), // Salted Hash standard
      delivery_address: regAddress.trim() || undefined,
    };

    if (onCustomerRegister) {
      onCustomerRegister(newCust);
    }
    if (onCustomerLogin) {
      onCustomerLogin(newCust);
    }

    playTactileHaptic('success');
    setAuthSuccess(`สมัครสมาชิกสำเร็จ! ได้รับโบนัสต้อนรับ +50 แต้มฟรี 🎉`);

    setTimeout(() => {
      setIsAuthModalOpen(false);
      setAuthSuccess(null);
      setRegName('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    }, 800);
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    if (activeCustomer.password_hash) {
      const ok = verifySecret(oldPassword, activeCustomer.password_hash);
      if (!ok) {
        playTactileHaptic('error');
        setAuthError('รหัสผ่านเดิมไม่ถูกต้อง');
        return;
      }
    }

    if (newPassword.length < 6) {
      setAuthError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (onCustomerUpdate) {
      onCustomerUpdate({
        ...activeCustomer,
        password_hash: hashSync(newPassword),
      });
    }

    playTactileHaptic('success');
    setAuthSuccess('เปลี่ยนรหัสผ่านสำเร็จแล้ว!');
    setTimeout(() => {
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowChangePasswordSection(false);
      setAuthSuccess(null);
    }, 1000);
  };

  const isGuest = activeCustomer.id === 'cust-003' || !activeCustomer.phone;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Customer Brand & Security Status Banner */}
      <div className="bg-gradient-to-r from-[#1C1B19] via-[#2A2724] to-[#3B3632] text-white rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E6A055] text-black shadow-sm">
                {activeCustomer.tier} MEMBER
              </span>
              <span className="text-xs text-[#C4BEB5]">EQUAL1 Omni-Commerce &amp; Beauty</span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/40">
                <ShieldCheck className="w-3 h-3" />
                <span>Zero-Leak Protected</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mt-2 text-[#FDFCFB]">
              ยินดีต้อนรับ, {activeCustomer.name}
            </h2>
            <p className="text-xs text-[#A8A297] mt-0.5">
              {isGuest
                ? 'เข้าสู่ระบบหรือสมัครสมาชิกเพื่อสะสมแต้ม แลกส่วนลด และดูประวัติการสั่งซื้อ'
                : `เบอร์โทร: ${maskPhoneNumber(activeCustomer.phone)} · สะสมแต้มทุกการสั่งซื้อ`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Points Indicator */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-inner">
              <Award className="w-7 h-7 text-[#E6A055]" />
              <div>
                <span className="text-[10px] text-[#D1CCC2] block uppercase tracking-wider font-semibold">
                  แต้มสะสม (PTS)
                </span>
                <strong className="text-xl font-extrabold text-[#FDFCFB] tabular-nums">
                  {activeCustomer.points.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-[#E6A055]">PTS</span>
                </strong>
              </div>
            </div>

            {/* Account & Security Trigger */}
            {isGuest ? (
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setIsAuthModalOpen(true);
                }}
                className="px-4 py-2.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-2xl transition shadow-lg flex items-center gap-2 active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileDrawerOpen(true)}
                  className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs rounded-2xl transition border border-white/20 flex items-center gap-1.5 backdrop-blur-sm"
                >
                  <Lock className="w-3.5 h-3.5 text-[#E6A055]" />
                  <span>บัญชี &amp; ความปลอดภัย</span>
                </button>

                {onCustomerLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('ต้องการออกจากระบบสมาชิกหรือไม่?')) {
                        onCustomerLogout();
                      }
                    }}
                    className="p-2.5 bg-white/10 hover:bg-white/20 text-[#A8A297] hover:text-white rounded-2xl transition border border-white/15"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ambient Japanese pattern decorative circle */}
        <div className="absolute -right-10 -bottom-10 w-52 h-52 rounded-full border border-white/5 pointer-events-none" />
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6 border-b border-[#E6E2D8]">
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'shop'
              ? 'bg-[#171717] text-white shadow-md'
              : 'bg-white text-[#57534A] hover:bg-[#F2EFE9] border border-[#DDD9CE]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>1Mart · สินค้ามินิมาร์ท</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-[#171717] text-white shadow-md'
              : 'bg-white text-[#57534A] hover:bg-[#F2EFE9] border border-[#DDD9CE]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#E6A055]" />
          <span>1Service · ซาลอน &amp; สักลาย</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-[#171717] text-white shadow-md'
              : 'bg-white text-[#57534A] hover:bg-[#F2EFE9] border border-[#DDD9CE]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>คำสั่งซื้อ &amp; นัดหมาย</span>
          {mySales.filter((s) => s.status !== 'completed').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#E6A055] animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('loyalty')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'loyalty'
              ? 'bg-[#171717] text-white shadow-md'
              : 'bg-white text-[#57534A] hover:bg-[#F2EFE9] border border-[#DDD9CE]'
          }`}
        >
          <Award className="w-4 h-4 text-[#E6A055]" />
          <span>สมาชิก &amp; ความปลอดภัย</span>
        </button>

        {/* Floating Cart Launcher */}
        {cart.length > 0 && (
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold bg-[#E6A055] text-black shadow-lg hover:brightness-105 transition shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>ตะกร้า ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            <strong>฿{cartTotal.toLocaleString()}</strong>
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: MINI-MART SHOP */}
      {/* ==================================================== */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          {/* Active Marketing Campaign Hero Carousel */}
          {campaigns.filter((c) => c.active).length > 0 && (
            <div className="overflow-x-auto no-scrollbar pb-1">
              <div className="flex gap-4">
                {campaigns
                  .filter((c) => c.active)
                  .map((camp) => (
                    <div
                      key={camp.id}
                      className="min-w-[280px] sm:min-w-[340px] bg-gradient-to-br from-[#1E1C1A] to-[#2B2724] rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex flex-col justify-between shrink-0 border border-white/10"
                    >
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E6A055] text-black">
                            {camp.badge}
                          </span>
                          <span className="text-[11px] text-[#D1CCC2] font-semibold">
                            {camp.discount_text}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white mb-1">
                          {camp.title}
                        </h3>
                        <p className="text-xs text-[#A8A297] line-clamp-2">
                          {camp.subtitle}
                        </p>
                      </div>

                      <div className="relative z-10 pt-4 flex items-center justify-between text-xs">
                        <span className="text-[#E6A055] font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>โปรโมชั่นพิเศษ</span>
                        </span>
                        <button
                          onClick={() => {
                            if (camp.target_link === 'customer-beauty') {
                              setActiveTab('services');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-xs transition"
                        >
                          สั่งซื้อเลย
                        </button>
                      </div>

                      <div className="absolute right-0 top-0 bottom-0 w-28 opacity-25 pointer-events-none overflow-hidden">
                        <img
                          src={camp.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Search & Category Pills */}
          <div className="bg-white rounded-2xl p-4 border border-[#E6E4DD] shadow-sm flex flex-col gap-3">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C887B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาน้ำดื่ม, ชาเขียว, กาแฟ, ขนมขบเคี้ยว หรือของใช้..."
                className="w-full pl-11 pr-4 py-2.5 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#171717]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                onClick={() => setSelectedProductCategory('all')}
                className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                  selectedProductCategory === 'all'
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F2EFE9] text-[#555] hover:bg-[#E5E1D6]'
                }`}
              >
                ทั้งหมด
              </button>
              {productCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedProductCategory(c)}
                  className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                    selectedProductCategory === c
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#F2EFE9] text-[#555] hover:bg-[#E5E1D6]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => {
              const inCart = cart.find((c) => c.product.id === p.id);
              const isOut = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-[#E2DFD7] rounded-3xl p-3.5 flex flex-col justify-between shadow-sm hover:shadow-md transition"
                >
                  <div className="relative w-full h-36 rounded-2xl bg-[#F7F5EE] overflow-hidden mb-3 flex items-center justify-center">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-[#A8A499]">1M</span>
                    )}

                    {isOut ? (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        สินค้าหมด
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">
                        สต๊อก {p.stock}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-[#787467] font-medium block">
                      {p.category}
                    </span>
                    <h4 className="text-sm font-bold text-[#1C1B19] line-clamp-2 mt-0.5">
                      {p.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-[#111111]">
                        ฿{p.price.toLocaleString()}
                      </span>
                    </div>

                    {isOut ? (
                      <span className="text-xs text-[#999] font-medium">หมด</span>
                    ) : inCart ? (
                      <div className="flex items-center gap-1.5 bg-[#FAF9F5] border border-[#DDD9CE] rounded-lg p-0.5">
                        <button
                          onClick={() => handleUpdateCartQty(p.id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-200 rounded"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-1">{inCart.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQty(p.id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-xs font-bold text-gray-700 hover:bg-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="px-3 py-1.5 bg-[#171717] hover:bg-[#2C2A26] text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
                      >
                        + ใส่ตะกร้า
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: BEAUTY SERVICES & TATTOO */}
      {/* ==================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-[#E6E4DD] shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                onClick={() => setSelectedServiceCategory('all')}
                className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                  selectedServiceCategory === 'all'
                    ? 'bg-[#171717] text-white'
                    : 'bg-[#F2EFE9] text-[#555] hover:bg-[#E5E1D6]'
                }`}
              >
                บริการทั้งหมด
              </button>
              {serviceCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedServiceCategory(c)}
                  className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                    selectedServiceCategory === c
                      ? 'bg-[#171717] text-white'
                      : 'bg-[#F2EFE9] text-[#555] hover:bg-[#E5E1D6]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-[#E2DFD7] rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#FAF9F5] shrink-0 border border-[#ECE8DC]">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                        1Service
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#8C887B] block">{s.category}</span>
                    <h4 className="text-base font-bold text-[#171717] mt-0.5">{s.name}</h4>
                    <p className="text-xs text-[#7A7569] mt-1 line-clamp-2">{s.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-[#8C887B] mt-2">
                      <Clock className="w-3.5 h-3.5 text-[#E6A055]" />
                      <span>ระยะเวลา {s.duration_minutes} นาที</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-[#171717]">฿{s.price.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService(s);
                      playTactileHaptic('keypad');
                    }}
                    className="px-4 py-2 bg-[#171717] hover:bg-[#2C2A26] text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#E6A055]" />
                    <span>จองคิวนัดหมาย</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ORDER & APPOINTMENT TRACKING */}
      {/* ==================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#171717]">
              สถานะคำสั่งซื้อและการจองของคุณ
            </h3>
            <span className="text-xs text-[#7A7569]">
              อัปเดตสถานะแบบ Real-time ตามระบบจริง
            </span>
          </div>

          {/* Bookings Tracker */}
          {bookings.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-[#E6E2D8] shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-[#171717] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E6A055]" />
                <span>นัดหมายบริการที่กำลังจะมาถึง</span>
              </h4>

              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 bg-[#FAF9F5] border border-[#EAE6DD] rounded-2xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[11px] font-mono text-[#8C887B] block">
                        รหัสจอง: {b.id}
                      </span>
                      <h5 className="font-bold text-sm text-[#1A1917] mt-0.5">
                        {b.service_name}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-[#706B5E] mt-1">
                        <span>ช่าง: {b.technician_name || 'ช่างประจำสาขา'}</span>
                        <span>•</span>
                        <span>เวลา: {new Date(b.starts_at).toLocaleString('th-TH')}</span>
                        <span>({b.duration_minutes} นาที)</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${
                          b.status === 'confirmed'
                            ? 'bg-[#DCFCE7] text-[#16A34A]'
                            : b.status === 'in_service'
                            ? 'bg-[#FEF08A] text-[#854D0E]'
                            : b.status === 'completed'
                            ? 'bg-[#F3F4F6] text-[#4B5563]'
                            : 'bg-[#FED7AA] text-[#C2410C]'
                        }`}
                      >
                        {b.status === 'confirmed'
                          ? 'ยืนยันคิวแล้ว'
                          : b.status === 'in_service'
                          ? 'กำลังรับบริการ'
                          : b.status === 'completed'
                          ? 'เสร็จสิ้น'
                          : 'รอยืนยัน'}
                      </span>
                      <strong className="text-sm font-extrabold text-[#171717]">
                        ฿{b.price.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery & Pickup Sales Tracker */}
          <div className="bg-white rounded-3xl p-5 border border-[#E6E2D8] shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-[#171717] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#16A34A]" />
              <span>ประวัติคำสั่งซื้อเดลิเวอรี่ &amp; มินิมาร์ท</span>
            </h4>

            {mySales.length === 0 ? (
              <p className="text-xs text-[#8C887B] py-6 text-center">
                ยังไม่มีประวัติคำสั่งซื้อ
              </p>
            ) : (
              <div className="space-y-4">
                {mySales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-4 bg-[#FAF9F5] border border-[#EAE6DD] rounded-2xl space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE8DC] pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-[#171717]">
                          #{sale.id}
                        </span>
                        <span className="text-xs text-[#8C887B] ml-2">
                          {new Date(sale.created_at).toLocaleString('th-TH')}
                        </span>
                        {sale.delivery_address && (
                          <div className="flex items-center gap-1 text-xs text-[#6B675E] mt-1">
                            <MapPin className="w-3.5 h-3.5 text-[#B42318]" />
                            <span>{sale.delivery_address}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#171717] text-white">
                          {t(`order.status.${sale.status}`)}
                        </span>
                        <span className="text-xs text-[#7A7569] block mt-1">
                          จ่ายด้วย: {sale.payment_method.toUpperCase()} ({sale.payment_status})
                        </span>
                      </div>
                    </div>

                    {/* Progress Pipeline */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold pt-1">
                      {['pending', 'preparing', 'delivering', 'completed'].map((st) => {
                        const stepOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed'];
                        const currentIdx = stepOrder.indexOf(sale.status);
                        const isPast = currentIdx >= stepOrder.indexOf(st);

                        return (
                          <div key={st} className="flex flex-col items-center gap-1">
                            <div
                              className={`w-full h-1.5 rounded-full transition ${
                                isPast ? 'bg-[#171717]' : 'bg-[#DDD9CE]'
                              }`}
                            />
                            <span className={isPast ? 'text-[#171717]' : 'text-[#A8A499]'}>
                              {st === 'pending'
                                ? 'รับออเดอร์'
                                : st === 'preparing'
                                ? 'กำลังจัด'
                                : st === 'delivering'
                                ? 'กำลังส่ง'
                                : 'สำเร็จ'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Item list summary */}
                    <div className="text-xs text-[#6B675E] bg-white p-2.5 rounded-xl border border-[#ECE8DC] space-y-1">
                      {sale.items?.map((it) => (
                        <div key={it.id} className="flex justify-between">
                          <span>{it.name} × {it.quantity}</span>
                          <strong>฿{it.line_total.toLocaleString()}</strong>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-[#EEE] flex justify-between font-bold text-[#171717] text-sm">
                        <span>ยอดสุทธิ</span>
                        <span>฿{sale.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Customer Bank Slip Action if Pending */}
                    {sale.payment_status === 'pending' && (
                      <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                        <span className="text-amber-800 font-medium">
                          รอแนบสลิปเพื่อยืนยันการชำระเงิน
                        </span>
                        <button
                          onClick={() => {
                            setSlipUploadOrder(sale);
                            setUploadedSlipPreview(null);
                          }}
                          className="px-3 py-1.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold rounded-lg shadow-sm flex items-center gap-1 transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>แนบสลิปโอนเงิน</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: MEMBER & SECURITY CENTER */}
      {/* ==================================================== */}
      {activeTab === 'loyalty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1 & 2: Member Digital Card & Benefits */}
            <div className="md:col-span-2 space-y-4">
              {/* Virtual Luxury Card */}
              <div className="bg-gradient-to-br from-[#1E1C1A] via-[#2D2A26] to-[#453F38] text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-white/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-mono tracking-widest text-[#E6A055] uppercase block mb-1">
                      EQUAL1 MEMBERSHIP CARD
                    </span>
                    <h3 className="text-2xl font-black text-white">{activeCustomer.name}</h3>
                    <p className="text-xs text-[#AAA] mt-0.5 font-mono">
                      ID: {activeCustomer.id.toUpperCase()}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#E6A055] to-amber-200 text-black flex items-center justify-center font-black text-lg shadow-lg">
                    E1
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 mb-6">
                  <div>
                    <span className="text-[10px] text-[#A8A499] uppercase block font-semibold">
                      ระดับสมาชิก
                    </span>
                    <strong className="text-base font-bold text-[#E6A055]">
                      {activeCustomer.tier}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A8A499] uppercase block font-semibold">
                      แต้มสะสม
                    </span>
                    <strong className="text-base font-bold text-white tabular-nums">
                      {activeCustomer.points.toLocaleString()} PTS
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A8A499] uppercase block font-semibold">
                      มูลค่าส่วนลด
                    </span>
                    <strong className="text-base font-bold text-emerald-400">
                      ฿{(activeCustomer.points / 10).toFixed(0)}
                    </strong>
                  </div>

                  {/* Visual Progress Bar to Next Membership Tier */}
                  <div className="col-span-2 sm:col-span-3 pt-3 mt-1 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#D1CCC2]">ระดับถัดไป:</span>
                        <span className="font-bold text-white px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px]">
                          {tierProgression.nextTier}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!tierProgression.isMaxTier && (
                          <span className="text-[11px] text-[#E6A055] font-semibold">
                            ขาดอีก {tierProgression.pointsNeeded.toLocaleString()} แต้ม
                          </span>
                        )}
                        <span className="font-mono font-bold text-xs text-white">
                          {tierProgression.progressPct}%
                        </span>
                      </div>
                    </div>

                    {/* Luminous Glass Progress Bar Track */}
                    <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/15 relative shadow-inner">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${tierProgression.tierColor} transition-all duration-700 ease-out relative shadow-sm shadow-amber-500/30 transform origin-left ${
                          isProgressBarGrowing ? 'animate-progress-grow scale-y-110 brightness-110' : 'scale-y-100'
                        }`}
                        style={{
                          width: `${Math.max(4, tierProgression.progressPct)}%`,
                          backgroundColor: tierProgression.solidColor,
                          backgroundImage: tierProgression.gradientCss,
                          transition: 'all 700ms cubic-bezier(0.34, 1.56, 0.64, 1), width 700ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                          transform: isProgressBarGrowing ? 'scaleX(1.02) scaleY(1.08)' : 'scaleX(1) scaleY(1)',
                          transformOrigin: 'left center',
                        }}
                      >
                        <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse opacity-40 pointer-events-none" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8C887B] font-mono">
                      <span>0 PTS</span>
                      <span className="text-[#C4BEB5] font-sans font-medium text-center">
                        {tierProgression.badgeText}
                      </span>
                      <span>{tierProgression.targetPoints.toLocaleString()} PTS</span>
                    </div>

                    {/* Interactive Points Simulator & Dynamic Tier Rank Indicator */}
                    <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#A8A499]">จำลองแต้มสะสม:</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onCustomerUpdate) {
                              onCustomerUpdate({
                                ...activeCustomer,
                                points: activeCustomer.points + 50,
                              });
                            }
                          }}
                          title="เพิ่ม 50 แต้ม เพื่อดูอนิเมชันหลอดเติบโต"
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 rounded text-emerald-400 font-bold text-[10px] transition-all flex items-center gap-0.5"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>+50 PTS</span>
                        </button>
                        <button
                          type="button"
                          disabled={activeCustomer.points <= 0}
                          onClick={() => {
                            if (onCustomerUpdate) {
                              onCustomerUpdate({
                                ...activeCustomer,
                                points: Math.max(0, activeCustomer.points - 50),
                              });
                            }
                          }}
                          title="ลด 50 แต้ม เพื่อดูอนิเมชันปรับระดับ"
                          className="px-2 py-0.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 rounded text-rose-400 font-bold text-[10px] transition-all flex items-center gap-0.5 disabled:opacity-40"
                        >
                          <Minus className="w-2.5 h-2.5" />
                          <span>-50 PTS</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-[#D1CCC2]">
                        <span>เฉดสีประจำขั้น:</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shadow-sm border border-white/20 transition-colors duration-500"
                          style={{ backgroundColor: tierProgression.solidColor }}
                        />
                        <span className="font-bold text-white">{tierProgression.accentBadge}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Barcode & QR for POS Scanning */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode className="w-8 h-8 text-[#E6A055]" />
                    <div>
                      <span className="text-[11px] text-white font-bold block">
                        สแกนรับแต้ม / แลกส่วนลดหน้าร้าน
                      </span>
                      <span className="text-[10px] text-[#AAA] font-mono">
                        {activeCustomer.phone ? maskPhoneNumber(activeCustomer.phone) : 'EQ-WALK-IN'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="px-3 py-1.5 bg-[#E6A055] text-black text-xs font-bold rounded-xl hover:bg-amber-400 transition"
                  >
                    ขยาย QR
                  </button>
                </div>
              </div>

              {/* Security Standards Banner */}
              <div className="bg-emerald-950/40 border border-emerald-700/40 rounded-3xl p-5 text-emerald-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>มาตรฐานการคุ้มครองข้อมูลรหัสผ่านระดับสากล</span>
                </div>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  • <strong>ไม่มีใครเห็นรหัสผ่านของคุณ:</strong> รหัสผ่านสมาชิกถูกเข้ารหัสด้วย Salted SHA-256 ป้องกันการอ่านโดยตรง แม้แต่ทีมงานแอดมินหรือแคชเชียร์ก็ไม่สามารถมองเห็นรหัสผ่านของคุณได้
                </p>
                <p className="text-xs text-emerald-300/80 leading-relaxed">
                  • <strong>ความปลอดภัยสูง:</strong> สามารถเปลี่ยนรหัสผ่านส่วนตัวได้ตลอดเวลาผ่านหน้านี้
                </p>
              </div>
            </div>

            {/* Column 3: Security & Profile Controls */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-[#171717] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#E6A055]" />
                  <span>จัดการความปลอดภัยของบัญชี</span>
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EEE]">
                    <span className="text-[#888] block text-[11px]">ชื่อในระบบ:</span>
                    <strong className="text-[#171717] font-semibold">{activeCustomer.name}</strong>
                  </div>

                  <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EEE]">
                    <span className="text-[#888] block text-[11px]">เบอร์โทรศัพท์ (ยืนยันแล้ว):</span>
                    <strong className="text-[#171717] font-mono">
                      {activeCustomer.phone ? maskPhoneNumber(activeCustomer.phone) : '— ยังไม่ได้ระบุ —'}
                    </strong>
                  </div>

                  <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#EEE]">
                    <span className="text-[#888] block text-[11px]">ที่อยู่จัดส่งเริ่มต้น:</span>
                    <span className="text-[#555] block mt-0.5">
                      {activeCustomer.delivery_address || 'คอนโดเมืองเอก ตึก B'}
                    </span>
                  </div>
                </div>

                {/* Password Change Trigger */}
                <button
                  type="button"
                  onClick={() => setShowChangePasswordSection(!showChangePasswordSection)}
                  className="w-full py-2.5 bg-[#FAF9F5] hover:bg-[#F2EFE9] border border-[#DDD9CE] text-[#171717] font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E6A055]" />
                  <span>{showChangePasswordSection ? 'ซ่อนการเปลี่ยนรหัสผ่าน' : 'เปลี่ยนรหัสผ่านใหม่'}</span>
                </button>

                {showChangePasswordSection && (
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-2 border-t border-[#EEE]">
                    <div>
                      <label className="text-[11px] font-semibold text-[#666] block mb-1">
                        รหัสผ่านปัจจุบัน
                      </label>
                      <input
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 border border-[#DDD9CE] rounded-xl outline-none focus:ring-1 focus:ring-black font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#666] block mb-1">
                        รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 border border-[#DDD9CE] rounded-xl outline-none focus:ring-1 focus:ring-black font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#666] block mb-1">
                        ยืนยันรหัสผ่านใหม่อีกครั้ง
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 border border-[#DDD9CE] rounded-xl outline-none focus:ring-1 focus:ring-black font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    {authError && (
                      <p className="text-xs text-rose-600 font-semibold">{authError}</p>
                    )}
                    {authSuccess && (
                      <p className="text-xs text-emerald-600 font-semibold">{authSuccess}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2 bg-[#171717] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition shadow"
                    >
                      บันทึกรหัสผ่านใหม่
                    </button>
                  </form>
                )}

                {/* Switch / Sign Out */}
                <div className="pt-2 border-t border-[#EEE]">
                  {isGuest ? (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-2.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>เข้าสู่ระบบ / สมัครสมาชิก</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm('ต้องการออกจากระบบสมาชิกหรือไม่?')) {
                          if (onCustomerLogout) onCustomerLogout();
                        }
                      }}
                      className="w-full py-2 bg-[#FAF9F5] hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>ออกจากระบบสมาชิก</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CHECKOUT MODAL */}
      {/* ==================================================== */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E4DD] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <h3 className="text-lg font-black text-[#171717]">
                สั่งซื้อ &amp; ชำระเงิน (Customer Checkout)
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery or Pickup Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F1EA] rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                  fulfillmentType === 'delivery'
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'text-[#666] hover:bg-[#EAE6DE]'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>จัดส่งด่วน (Delivery)</span>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
                  fulfillmentType === 'pickup'
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'text-[#666] hover:bg-[#EAE6DE]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>รับเองที่ร้าน (Pickup)</span>
              </button>
            </div>

            {fulfillmentType === 'delivery' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-semibold text-[#5A574E] block mb-1">
                    ที่อยู่จัดส่ง
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full text-xs p-3 border border-[#DDD9CE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#171717]"
                    placeholder="บ้านเลขที่ / อาคาร / ชั้น / ซอย / จุดสังเกต"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5A574E] block mb-1">
                    เบอร์โทรศัพท์สำหรับติดต่อ
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#DDD9CE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#171717]"
                  />
                </div>
              </div>
            )}

            {/* Points Redemption Option */}
            {activeCustomer.points >= 100 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl mb-4 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-700" />
                  <div>
                    <span className="font-bold text-emerald-950 block">
                      ใช้แต้มสะสมแลกส่วนลด (มี {activeCustomer.points} แต้ม)
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      แลก 100 แต้มเพื่อลด ฿10
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUsePointsRedeem(!usePointsRedeem)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                    usePointsRedeem
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white border border-emerald-400 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {usePointsRedeem ? '✓ ใช้แล้ว (-฿10)' : 'แลกแต้ม'}
                </button>
              </div>
            )}

            {/* Order Items Preview */}
            <div className="border border-[#ECE9E1] rounded-2xl p-3 bg-[#FAF9F5] mb-4 max-h-40 overflow-y-auto space-y-2 text-xs">
              {cart.map((it) => (
                <div key={it.product.id} className="flex justify-between">
                  <span>{it.product.name} × {it.quantity}</span>
                  <strong>฿{(it.product.price * it.quantity).toLocaleString()}</strong>
                </div>
              ))}
              {fulfillmentType === 'delivery' && (
                <div className="flex justify-between text-[#888]">
                  <span>ค่าบริการจัดส่ง</span>
                  <span>฿{deliveryFee}</span>
                </div>
              )}
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>ส่วนลดคูปอง ({appliedVoucher?.code})</span>
                  <span>-฿{voucherDiscount.toLocaleString()}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>ส่วนลดแต้มสะสม</span>
                  <span>-฿{pointsDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#E0DCD1] flex justify-between font-black text-sm text-[#171717]">
                <span>ยอดชำระสุทธิ</span>
                <span>฿{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Voucher Coupon Form */}
            <form onSubmit={handleApplyVoucher} className="flex gap-2 mb-4">
              <input
                type="text"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                placeholder="กรอกโค้ดส่วนลด (เช่น EQUAL35, FREESHIP)"
                className="flex-1 text-xs p-2.5 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[#171717]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#171717] hover:bg-[#333] text-white rounded-xl font-bold text-xs transition"
              >
                ใช้โค้ด
              </button>
            </form>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-[#5A574E] block mb-2">
                วิธีชำระเงิน
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('promptpay')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    selectedPaymentMethod === 'promptpay'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#555] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-[#E6A055]" />
                  <span>PromptPay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    selectedPaymentMethod === 'cash'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#555] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>เงินสด</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    selectedPaymentMethod === 'card'
                      ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                      : 'bg-[#FAF9F5] border-[#DDD9CE] text-[#555] hover:bg-[#F2EFE9]'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <span>บัตรเครดิต</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              className="w-full py-3.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-black text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 active:scale-95"
            >
              <span>ยืนยันการสั่งซื้อ (฿{cartTotal.toLocaleString()})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* BOOKING MODAL */}
      {/* ==================================================== */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <h3 className="font-bold text-base text-[#171717]">
                นัดหมายบริการ: {selectedService.name}
              </h3>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-5 text-xs">
              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  เลือกวันที่นัดหมาย
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  เลือกรอบเวลา
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                >
                  <option value="10:00">10:00 - 11:00 น.</option>
                  <option value="11:30">11:30 - 12:30 น.</option>
                  <option value="13:00">13:00 - 14:00 น.</option>
                  <option value="14:30">14:30 - 15:30 น.</option>
                  <option value="16:00">16:00 - 17:00 น.</option>
                  <option value="17:30">17:30 - 18:30 น.</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  ช่างผู้ให้บริการ
                </label>
                <select
                  value={technicianChoice}
                  onChange={(e) => setTechnicianChoice(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                >
                  <option value="ช่างเมย์ (Master Stylist)">ช่างเมย์ (Master Stylist &amp; Lash Expert)</option>
                  <option value="ช่างแอน (Senior Nail Artist)">ช่างแอน (Senior Nail &amp; Spa Artist)</option>
                  <option value="ช่างเอก (Fine-Line Tattooist)">ช่างเอก (Fine-Line Tattoo Specialist)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="เช่น ทรงขนตาที่ชอบ, แพ้สารเคมีหรือไม่"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              className="w-full py-3.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Calendar className="w-4 h-4 text-[#E6A055]" />
              <span>ยืนยันการจองคิวนัดหมาย (฿{selectedService.price.toLocaleString()})</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CUSTOMER BANK SLIP UPLOAD MODAL */}
      {/* ==================================================== */}
      {slipUploadOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#E6A055]" />
                <h3 className="font-bold text-base text-[#171717]">
                  แนบสลิปโอนเงินออเดอร์ #{slipUploadOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setSlipUploadOrder(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6E4DD] mb-4 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8C887B]">ยอดที่ต้องชำระ:</span>
                <strong className="text-base font-black text-[#171717]">
                  ฿{slipUploadOrder.total.toLocaleString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C887B]">PromptPay EQUAL1:</span>
                <span className="font-mono font-bold text-indigo-700">098-765-4321</span>
              </div>
            </div>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-[#DDD9CE] hover:border-[#E6A055] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center bg-[#FAF9F5] hover:bg-amber-50/40 mb-4 block">
              <Upload className="w-8 h-8 text-[#8C887B] mb-2" />
              <span className="text-xs font-bold text-[#171717] block">
                เลือกรูปภาพสลิปจากอัลบั้ม หรือถ่ายรูป
              </span>
              <span className="text-[11px] text-[#8C887B] mt-0.5">
                รองรับไฟล์สลิปจากทุกธนาคาร
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setUploadedSlipPreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </label>

            {/* Quick Simulate preset */}
            {!uploadedSlipPreview && (
              <button
                type="button"
                onClick={() => {
                  setUploadedSlipPreview(
                    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80'
                  );
                }}
                className="w-full py-2 bg-[#FAF8F5] border border-[#DDD9CE] text-xs font-semibold text-[#555] rounded-xl hover:bg-gray-100 transition mb-4"
              >
                จำลองแนบสลิปทดสอบ (KBANK Transfer Slip)
              </button>
            )}

            {uploadedSlipPreview && (
              <div className="mb-4">
                <span className="text-xs font-bold text-[#171717] block mb-1">
                  ตัวอย่างสลิปที่จะส่งตรวจ:
                </span>
                <img
                  src={uploadedSlipPreview}
                  alt="Slip"
                  className="w-full h-36 object-cover rounded-xl border border-[#DDD]"
                />
              </div>
            )}

            <button
              onClick={() => {
                if (!uploadedSlipPreview) {
                  showCustomerToast('กรุณาอัปโหลดรูปภาพสลิปโอนเงิน', 'error');
                  return;
                }
                setIsUploadingSlip(true);
                setTimeout(() => {
                  setIsUploadingSlip(false);
                  if (onUploadSlip && slipUploadOrder) {
                    const randomRef =
                      '0142' + Math.floor(10000000000000 + Math.random() * 90000000000000);
                    onUploadSlip(slipUploadOrder.id, {
                      id: 'slip-' + Date.now(),
                      sale_id: slipUploadOrder.id,
                      order_id: slipUploadOrder.id,
                      slip_image_url: uploadedSlipPreview,
                      bank_name: 'ธนาคารกสิกรไทย (K PLUS)',
                      sender_name: activeCustomer.name,
                      receiver_account: '098-765-4321 (PromptPay EQUAL1)',
                      amount: slipUploadOrder.total,
                      transaction_ref: randomRef,
                      transferred_at: new Date().toISOString(),
                      verified_at: new Date().toISOString(),
                      verification_status: 'verified',
                      verification_note: 'ส่งสลิปผ่าน Customer App',
                      verified_by: 'ระบบ AI Scan & ตรวจสอบอัตโนมัติ',
                    });
                  }
                  showCustomerToast('แนบสลิปสำเร็จ! ระบบ AI และพนักงานจะตรวจสอบและอัปเดตสถานะทันที', 'success');
                  setSlipUploadOrder(null);
                  setUploadedSlipPreview(null);
                }, 800);
              }}
              disabled={isUploadingSlip || !uploadedSlipPreview}
              className="w-full py-3 bg-[#171717] hover:bg-[#333] text-white rounded-xl font-bold text-xs shadow-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-[#E6A055]" />
              <span>{isUploadingSlip ? 'กำลังส่งสลิปเข้าสู่ระบบ...' : 'ยืนยันการแนบสลิป'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CUSTOMER AUTHENTICATION MODAL (Standard & Secure) */}
      {/* ==================================================== */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#1C1C1A] text-[#FAF8F5] border border-[#333330] rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#2C2C28] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-[#E6A055]/20 text-[#E6A055] border border-[#E6A055]/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">ระบบสมาชิก EQUAL1</h3>
                  <p className="text-xs text-[#9E9A8F]">เข้าสู่ระบบ หรือ สมัครสมาชิกใหม่</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setAuthError(null);
                  setAuthSuccess(null);
                }}
                className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auth Tab Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-[#262624] p-1 rounded-2xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authTab === 'signin'
                    ? 'bg-[#E6A055] text-black shadow'
                    : 'text-[#9E9A8F] hover:text-white'
                }`}
              >
                เข้าสู่ระบบ
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authTab === 'register'
                    ? 'bg-[#E6A055] text-black shadow'
                    : 'text-[#9E9A8F] hover:text-white'
                }`}
              >
                สมัครสมาชิก (+50 แต้ม)
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('otp');
                  setAuthError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authTab === 'otp'
                    ? 'bg-[#E6A055] text-black shadow'
                    : 'text-[#9E9A8F] hover:text-white'
                }`}
              >
                SMS OTP
              </button>
            </div>

            {/* Sub-tab 1: Sign In with Phone & Password */}
            {authTab === 'signin' && (
              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                    เบอร์โทรศัพท์ หรือ อีเมล
                  </label>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    placeholder="081-234-5678"
                    className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#E6A055] outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-[#A6A297]">
                      รหัสผ่าน (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAuthTab('otp')}
                      className="text-[11px] text-[#E6A055] hover:underline"
                    >
                      เข้าสู่ระบบด้วย OTP แทน?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-[#E6A055] outline-none pr-10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7569] hover:text-white"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Preset Fast Login Selectors for test demo */}
                <div className="pt-1">
                  <span className="text-[10px] text-[#7A7569] block mb-1.5 font-semibold">
                    เลือกบัญชีทดสอบด่วน:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPhone('081-234-5678');
                        setLoginPassword('Member1234!');
                      }}
                      className="p-1.5 rounded-xl bg-[#242422] hover:bg-[#2C2C28] border border-[#333] text-left text-[11px] text-[#CCC] flex items-center gap-1.5"
                    >
                      <span>👤</span>
                      <span className="truncate">คุณนันท์นภัส (Elite)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPhone('089-876-5432');
                        setLoginPassword('Member1234!');
                      }}
                      className="p-1.5 rounded-xl bg-[#242422] hover:bg-[#2C2C28] border border-[#333] text-left text-[11px] text-[#CCC] flex items-center gap-1.5"
                    >
                      <span>👤</span>
                      <span className="truncate">คุณพัชราภรณ์ (VIP)</span>
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>เข้าสู่ระบบอย่างปลอดภัย</span>
                </button>
              </form>
            )}

            {/* Sub-tab 2: Register New Customer */}
            {authTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="เช่น คุณสมชาย เจริญสุข"
                    className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#E6A055] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                      เบอร์โทรศัพท์ (10 หลัก)
                    </label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      placeholder="08X-XXX-XXXX"
                      className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#E6A055] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                      อีเมล (ไม่บังคับ)
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#E6A055] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                    ที่อยู่จัดส่งเริ่มต้น
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="บ้านเลขที่ / คอนโด / ซอย"
                    className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#E6A055] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                      รหัสผ่าน
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3 py-2 text-xs text-white focus:border-[#E6A055] outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A7569] hover:text-white"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                      ยืนยันรหัสผ่าน
                    </label>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3 py-2 text-xs text-white focus:border-[#E6A055] outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Password strength meter */}
                {regPassword && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#8C887B]">
                      <span>ความปลอดภัยของรหัสผ่าน:</span>
                      <span className={passwordStrength >= 3 ? 'text-emerald-400 font-bold' : passwordStrength === 2 ? 'text-amber-400 font-bold' : 'text-rose-400'}>
                        {passwordStrength >= 3 ? 'แข็งแกร่ง' : passwordStrength === 2 ? 'ปานกลาง' : 'ควรเพิ่มตัวเลข/อักษรพิเศษ'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 h-1">
                      {[1, 2, 3, 4].map((s) => (
                        <div
                          key={s}
                          className={`rounded-full ${
                            passwordStrength >= s
                              ? passwordStrength >= 3
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                              : 'bg-[#333]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Welcome bonus badge */}
                <div className="p-2.5 rounded-xl bg-[#E6A055]/15 border border-[#E6A055]/30 text-[#E6A055] text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>รับโบนัสทันที +50 แต้มสะสม เมื่อสมัครสมาชิกสำเร็จ</span>
                </div>

                {authError && (
                  <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>ยืนยันการสมัครสมาชิก</span>
                </button>
              </form>
            )}

            {/* Sub-tab 3: Fast SMS OTP Login */}
            {authTab === 'otp' && (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                    เบอร์โทรศัพท์สำหรับรับรหัส SMS OTP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      required
                      className="flex-1 bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2 text-xs text-white focus:border-[#E6A055] outline-none"
                    />
                    <button
                      type="button"
                      disabled={otpCountdown > 0}
                      onClick={handleSendOtp}
                      className="px-3 py-2 bg-[#2E2E2A] hover:bg-[#3D3D38] border border-[#444] text-xs font-semibold text-white rounded-xl transition disabled:opacity-50"
                    >
                      {otpCountdown > 0 ? `${otpCountdown}s` : 'ขอรหัส OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="text-xs font-semibold text-[#A6A297] block mb-1">
                      รหัส OTP 6 หลัก
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full bg-[#262624] border border-[#3A3A36] rounded-xl px-3.5 py-2.5 text-center text-lg tracking-widest text-white focus:border-[#E6A055] outline-none font-mono"
                    />
                  </div>
                )}

                {authError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!otpSent}
                  className="w-full py-3 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ยืนยันรหัส OTP เพื่อเข้าสู่ระบบ</span>
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-[#2C2C28] text-center">
              <span className="text-[11px] text-[#7A7569]">
                🔒 ข้อมูลส่วนบุคคลได้รับการคุ้มครองด้วยการเข้ารหัส SHA-256 ตามมาตรฐานสากล
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* PROFILE & SECURITY DRAWER */}
      {/* ==================================================== */}
      {isProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#EEE] mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#E6A055]" />
                  <h3 className="font-bold text-base text-[#171717]">ข้อมูลบัญชี &amp; ความปลอดภัย</h3>
                </div>
                <button
                  onClick={() => setIsProfileDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Digital Card Preview */}
              <div className="bg-[#171717] text-white p-4 rounded-2xl mb-4 relative overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-mono text-[#E6A055]">EQUAL1 MEMBER</span>
                  <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                    {activeCustomer.tier}
                  </span>
                </div>
                <h4 className="font-bold text-base text-white">{activeCustomer.name}</h4>
                <p className="text-xs text-[#AAA] mt-0.5 font-mono">
                  {activeCustomer.phone ? maskPhoneNumber(activeCustomer.phone) : '—'}
                </p>
                <div className="mt-3 pt-2 border-t border-white/10 flex justify-between text-xs">
                  <span>แต้มสะสม:</span>
                  <strong className="text-[#E6A055]">{activeCustomer.points} PTS</strong>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-3 text-xs mb-6">
                <div>
                  <label className="text-[11px] font-semibold text-[#666] block mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    value={activeCustomer.name}
                    onChange={(e) => {
                      if (onCustomerUpdate) {
                        onCustomerUpdate({ ...activeCustomer, name: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#666] block mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={activeCustomer.phone || ''}
                    onChange={(e) => {
                      if (onCustomerUpdate) {
                        onCustomerUpdate({ ...activeCustomer, phone: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#666] block mb-1">
                    ที่อยู่จัดส่งเริ่มต้น
                  </label>
                  <textarea
                    rows={2}
                    value={activeCustomer.delivery_address || ''}
                    onChange={(e) => {
                      if (onCustomerUpdate) {
                        onCustomerUpdate({ ...activeCustomer, delivery_address: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EEE] mb-4">
                <span className="text-xs font-bold text-[#171717] block mb-1">
                  ความปลอดภัยของรหัสผ่าน
                </span>
                <p className="text-[11px] text-[#777] mb-2 leading-relaxed">
                  รหัสผ่านถูกป้องกันด้วยระบบเข้ารหัส ไม่มีการเปิดเผยให้กับเจ้าหน้าที่
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    setActiveTab('loyalty');
                  }}
                  className="text-xs text-[#E6A055] font-bold hover:underline"
                >
                  เปลี่ยนรหัสผ่านในแท็บสมาชิก →
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#EEE] space-y-2">
              <button
                onClick={() => {
                  setIsProfileDrawerOpen(false);
                }}
                className="w-full py-2.5 bg-[#171717] text-white font-bold text-xs rounded-xl hover:bg-[#333] transition"
              >
                บันทึกการเปลี่ยนแปลง
              </button>

              {onCustomerLogout && (
                <button
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    onCustomerLogout();
                  }}
                  className="w-full py-2 bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl hover:bg-rose-100 transition"
                >
                  ออกจากระบบสมาชิก
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code & Digital Barcode Expanded Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1B19] border border-white/15 text-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl space-y-5 text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#E6A055] block mb-1">
                EQUAL1 MEMBER PASS
              </span>
              <h3 className="text-xl font-black text-white">{activeCustomer.name}</h3>
              <p className="text-xs text-[#AAA] font-mono mt-0.5">
                ระดับ: <strong className="text-[#E6A055]">{activeCustomer.tier}</strong> | แต้ม: {activeCustomer.points} PTS
              </p>
            </div>

            {/* Simulated High-Res QR Code Card */}
            <div className="bg-white p-5 rounded-2xl mx-auto w-48 h-48 flex flex-col items-center justify-center shadow-lg">
              <QrCode className="w-36 h-36 text-black" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono tracking-widest text-white/90 font-bold block">
                {activeCustomer.id.toUpperCase()}
              </span>
              <p className="text-[11px] text-[#A8A499]">
                แสดง QR หรือบาร์โค้ดนี้ให้แคชเชียร์สแกนผ่าน POS หรือตู้บริการอัตโนมัติ
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-[#E6A055] hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Floating Customer Toast Notification */}
      {customerToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 transition-all backdrop-blur-md animate-fade-in ${
            customerToast.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/40'
              : customerToast.type === 'info'
              ? 'bg-amber-950/95 text-amber-100 border-amber-500/50 shadow-amber-950/40'
              : 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
          }`}
        >
          {customerToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{customerToast.message}</span>
        </div>
      )}
    </div>
  );
};
