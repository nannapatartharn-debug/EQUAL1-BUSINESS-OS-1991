import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { authService } from '../lib/backendEngine';

interface OwnerAuthChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
  targetFeatureName?: string;
  ownerEmail?: string;
}

export const OwnerAuthChallengeModal: React.FC<OwnerAuthChallengeModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
  targetFeatureName = 'ระบบเจ้าของร้าน (Owner System)',
  ownerEmail = '',
}) => {
  const [emailInput, setEmailInput] = useState(ownerEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetEmail = (emailInput || ownerEmail).trim().toLowerCase();
    const val = password.trim();

    if (!targetEmail) {
      setError('กรุณากรอกอีเมลเจ้าของร้าน');
      return;
    }

    if (!val) {
      setError('กรุณากรอกรหัสผ่านยืนยันสิทธิ์เจ้าของร้าน');
      return;
    }

    setIsVerifying(true);
    try {
      // Supabase Auth is the single authoritative source of truth for Owner
      const { data, error: authErr } = await authService.signInWithEmail(targetEmail, val);
      if (authErr) {
        setError(authErr.message || 'รหัสผ่านเจ้าของร้านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
      } else if (data?.user) {
        setSuccess('ยืนยันรหัสผ่านเจ้าของร้านผ่าน Supabase Auth สำเร็จ');
        setTimeout(() => {
          onVerifySuccess();
          onClose();
          setSuccess(null);
          setPassword('');
        }, 500);
      } else {
        setError('ไม่สามารถยืนยันตัวตนเจ้าของร้านได้');
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-[#1F1F1F]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <strong className="text-sm font-bold">ยืนยันสิทธิ์เจ้าของร้าน</strong>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 mb-3 shadow-inner">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black">พื้นที่หวงห้ามเฉพาะเจ้าของกิจการ</h3>
            <p className="text-xs text-gray-500 mt-1">
              ต้องการเข้าถึง: <strong className="text-gray-800">{targetFeatureName}</strong>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              พนักงานทั่วไปไม่ได้รับอนุญาตให้ดูข้อมูลการเงินหรือตัวเลขกำไร
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {!ownerEmail && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  อีเมลเจ้าของร้าน (Owner Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#1F1F1F] outline-none"
                    placeholder="owner@business.com"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                รหัสผ่านเจ้าของร้าน (Supabase Auth Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#1F1F1F] outline-none"
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

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-[#1F1F1F] hover:bg-[#333333] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? 'กำลังตรวจสอบสิทธิ์ Supabase Auth...' : 'ยืนยันรหัสปลดล็อค (Authorize Owner)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
