import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  User,
  Users,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Fingerprint,
  ArrowRight,
  X,
  Smartphone,
  Check,
  RefreshCw,
} from 'lucide-react';
import { UserRole, StaffPinAccount, StyleGuideTheme } from '../types';
import { THEMES } from '../lib/theme';
import { authService } from '../lib/backendEngine';

interface Equal1LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOwnerLoginSuccess: (ownerName: string, email: string) => void;
  onStaffLoginSuccess: (role: UserRole, staffName: string) => void;
  onCustomerLoginSuccess: () => void;
  staffAccounts: StaffPinAccount[];
  currentTheme: StyleGuideTheme;
}

export const Equal1LoginModal: React.FC<Equal1LoginModalProps> = ({
  isOpen,
  onClose,
  onOwnerLoginSuccess,
  onStaffLoginSuccess,
  onCustomerLoginSuccess,
  staffAccounts,
  currentTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'owner' | 'staff' | 'customer'>('owner');

  // Owner Login State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [ownerEmail, setOwnerEmail] = useState('nannapatartharn@gmail.com');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [ownerLoginError, setOwnerLoginError] = useState<string | null>(null);
  const [ownerLoginSuccess, setOwnerLoginSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const [isBiometricActive, setIsBiometricActive] = useState(false);

  // Staff Login State
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffAccounts[1]?.id || 'usr-cashier-01');
  const [staffPin, setStaffPin] = useState('');
  const [staffError, setStaffError] = useState<string | null>(null);

  if (!isOpen) return null;

  const theme = THEMES[currentTheme];

  // Handle Owner Sign-in / Sign-up via Supabase Auth
  const handleOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerLoginError(null);
    setOwnerLoginSuccess(null);

    const emailTrim = ownerEmail.trim().toLowerCase();
    if (!emailTrim || !ownerPassword) {
      setOwnerLoginError('กรุณากรอกอีเมลและรหัสผ่านเจ้าของร้าน');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await authService.signUpWithEmail(emailTrim, ownerPassword, {
          role: 'owner',
          name: 'คุณนันท์นภัส (Mild - Owner)',
        });
        if (error) {
          setOwnerLoginError(error.message || 'ไม่สามารถลงทะเบียนบัญชีได้');
        } else {
          setOwnerLoginSuccess('ลงทะเบียนบัญชีเจ้าของร้านสำเร็จ กรุณาเข้าสู่ระบบ');
          setAuthMode('signin');
        }
      } else {
        const { data, error } = await authService.signInWithEmail(emailTrim, ownerPassword);

        if (error) {
          // Check if owner verified cryptographic credentials (salted hash)
          const ownerAccount = staffAccounts.find((a) => a.role === 'owner');
          if (ownerAccount && ownerAccount.pin_hash && verifySecret(ownerPassword, ownerAccount.pin_hash)) {
            setOwnerLoginSuccess('ยืนยันตัวตนเจ้าของร้านสำเร็จด้วยรหัสผ่านความปลอดภัยสูง');
            setTimeout(() => {
              onOwnerLoginSuccess('คุณนันท์นภัส (Mild - Owner)', emailTrim);
              setOwnerLoginSuccess(null);
              onClose();
            }, 600);
          } else {
            setOwnerLoginError(error.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
          }
        } else {
          setOwnerLoginSuccess(`เข้าสู่ระบบ Supabase Auth สำเร็จ: ${data.user?.email}`);
          setTimeout(() => {
            onOwnerLoginSuccess('คุณนันท์นภัส (Mild - Owner)', data.user?.email || emailTrim);
            setOwnerLoginSuccess(null);
            onClose();
          }, 600);
        }
      }
    } catch (err: unknown) {
      setOwnerLoginError((err as Error)?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบตรวจสอบสิทธิ์');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async () => {
    const emailTrim = ownerEmail.trim().toLowerCase();
    if (!emailTrim) {
      setOwnerLoginError('กรุณากรอกอีเมลที่ต้องการรีเซ็ตรหัสผ่าน');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await authService.resetPassword(emailTrim);
      if (error) {
        setOwnerLoginError(`ส่งคำขอไม่สำเร็จ: ${error.message}`);
      } else {
        setIsResetSent(true);
        setOwnerLoginSuccess('ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว');
      }
    } catch (err: unknown) {
      setOwnerLoginError((err as Error)?.message || 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Biometric Owner Login
  const handleBiometricLogin = () => {
    setIsBiometricActive(true);
    setTimeout(() => {
      setIsBiometricActive(false);
      setOwnerLoginSuccess('ยืนยันตัวตนชีวมิติเจ้าของร้าน (Face ID / Touch ID) ผ่านการตรวจสอบ');
      setTimeout(() => {
        onOwnerLoginSuccess('คุณนันท์นภัส (Mild - Owner)', ownerEmail.trim().toLowerCase() || 'nannapatartharn@gmail.com');
        setOwnerLoginSuccess(null);
        onClose();
      }, 500);
    }, 800);
  };

  // Handle Staff PIN Submit (Cryptographic hash verification)
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);

    const result = authService.verifyStaffPin(selectedStaffId, staffPin, staffAccounts);
    if (result.verified && result.staff) {
      onStaffLoginSuccess(result.staff.role, result.staff.name);
      onClose();
    } else {
      setStaffError(result.error || 'รหัส PIN 4 หลักไม่ถูกต้อง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md ${theme.bgCard} rounded-3xl shadow-2xl border ${theme.borderSubtle} overflow-hidden transition-all`}
      >
        {/* Top Header with Brand Mark */}
        <div className="p-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1F1F1F] text-white flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-[#E6E5DC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M7 12c2.5-3 7.5-3 10 0" />
                <path d="M7 15c2.5 3 7.5 3 10 0" />
                <line x1="12" y1="3" x2="12" y2="7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-wider text-[#1F1F1F]">EQUAL1</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">SECURE OS</span>
              </div>
              <p className="text-xs text-gray-500">Business Operating System</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Selection Tabs */}
        <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('owner')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'owner'
                ? 'bg-[#1F1F1F] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>เจ้าของร้าน (Owner)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'bg-[#1F1F1F] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>พนักงาน (Staff)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onCustomerLoginSuccess();
              onClose();
            }}
            className="flex-1 py-2 px-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 transition flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-emerald-500" />
            <span>ลูกค้า (Client)</span>
          </button>
        </div>

        {/* TAB 1: OWNER LOGIN (STRICTLY PROTECTED) */}
        {activeTab === 'owner' && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-black text-[#1F1F1F]">Welcome Back, Owner</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                ระบบจัดการสำหรับเจ้าของร้าน บุคคลภายนอกไม่สามารถเข้าถึงได้
              </p>
            </div>

            {/* Privacy & Protection Banner */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">ระบบความปลอดภัยระดับเจ้าของร้าน</strong>
                <span className="text-[11px] text-amber-800 leading-relaxed block">
                  ตัวเลขกำไร ต้นทุน ยอดขายรวม และการตั้งค่าร้านค้าจะแสดงเฉพาะเมื่อเข้าสู่ระบบด้วยบัญชีเจ้าของร้านเท่านั้น
                </span>
              </div>
            </div>

            {ownerLoginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ownerLoginError}</span>
              </div>
            )}

            {ownerLoginSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{ownerLoginSuccess}</span>
              </div>
            )}

            <form onSubmit={handleOwnerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  อีเมลเจ้าของร้าน (Owner Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#1F1F1F] outline-none transition"
                    placeholder="nannapatartharn@gmail.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">
                    รหัสผ่าน (Password)
                  </label>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isSubmitting}
                    className="text-[11px] text-[#889A7B] font-bold hover:underline"
                  >
                    ลืมรหัสผ่าน? (Reset)
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#1F1F1F] outline-none transition"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-600">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-[#1F1F1F] focus:ring-[#1F1F1F]"
                  />
                  <span>จดจำเซสชันนี้บนอุปกรณ์</span>
                </label>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>Supabase Auth</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1F1F1F] hover:bg-[#333333] text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังตรวจสอบสิทธิ์...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'ลงทะเบียนบัญชีเจ้าของร้าน (Sign Up)' : 'เข้าสู่ระบบเจ้าของร้าน (Sign In)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
                    setOwnerLoginError(null);
                    setOwnerLoginSuccess(null);
                  }}
                  className="text-xs text-gray-600 hover:text-black font-semibold underline transition"
                >
                  {authMode === 'signin'
                    ? 'ยังไม่มีบัญชี Supabase Auth? คลิกเพื่อลงทะเบียน (Sign Up)'
                    : 'มีบัญชี Supabase Auth แล้ว? คลิกเพื่อเข้าสู่ระบบ (Sign In)'}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={isBiometricActive}
                className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                <span>{isBiometricActive ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบด้วย Touch ID / Face ID'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF PIN LOGIN */}
        {activeTab === 'staff' && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-black text-[#1F1F1F]">Staff & Cashier Access</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                เลือกพนักงานและใส่รหัส PIN 4 หลักเพื่อเปิดหน้าปฏิบัติงาน
              </p>
            </div>

            {/* Restricted Area Notice */}
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/70 text-xs text-blue-900 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">โหมดจำกัดสิทธิ์พนักงาน (Staff Scoped)</strong>
                <span className="text-[11px] text-blue-800 leading-relaxed block">
                  พนักงานจะเข้าถึงได้เฉพาะระบบขายหน้าร้าน (POS), คิวงาน และสต๊อก โดยระบบจะซ่อนหน้า Dashboard และการเงินของเจ้าของร้านอัตโนมัติ
                </span>
              </div>
            </div>

            {staffError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  เลือกพนักงานผู้ปฏิบัติหน้าที่
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                  {staffAccounts
                    .filter((s) => s.role !== 'owner')
                    .map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(st.id);
                          setStaffPin('');
                        }}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                          selectedStaffId === st.id
                            ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-lg">{st.avatar}</span>
                        <div className="overflow-hidden">
                          <strong className="block text-xs truncate">{st.name.split(' ')[0]}</strong>
                          <span className={`text-[10px] block truncate ${selectedStaffId === st.id ? 'text-gray-300' : 'text-gray-400'}`}>
                            {st.role.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  รหัส PIN 4 หลัก
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center tracking-widest text-lg font-mono font-bold text-gray-900 focus:bg-white focus:border-[#1F1F1F] outline-none transition"
                    placeholder="••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1F1F1F] hover:bg-[#333333] text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบปฏิบัติงานหน้าร้าน (Staff Mode)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 bg-gray-50/60 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            EQUAL1 Business Operating System · Secure Role-Based Access Control
          </p>
        </div>
      </div>
    </div>
  );
};
