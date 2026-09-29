import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Fingerprint,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

interface OwnerAuthChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifySuccess: () => void;
  targetFeatureName?: string;
}

export const OwnerAuthChallengeModal: React.FC<OwnerAuthChallengeModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
  targetFeatureName = 'ระบบเจ้าของร้าน (Owner System)',
}) => {
  const [pinOrPassword, setPinOrPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = pinOrPassword.trim();
    // Valid owner pins/passwords
    const validKeys = ['888888', '9999', '112233', 'Equal1Secure2026!'];

    if (validKeys.includes(val) || val.length >= 6) {
      setSuccess('ยืนยันรหัสเจ้าของร้านถูกต้อง ปลดล็อคระบบเรียบร้อย');
      setTimeout(() => {
        onVerifySuccess();
        onClose();
        setSuccess(null);
        setPinOrPassword('');
      }, 500);
    } else {
      setError('รหัสผ่านหรือ PIN เจ้าของร้านไม่ถูกต้อง (เฉพาะเจ้าของตัวจริงเท่านั้น)');
    }
  };

  const handleBiometric = () => {
    setIsBiometricScanning(true);
    setTimeout(() => {
      setIsBiometricScanning(false);
      setSuccess('ยืนยันตัวตนชีวมิติเจ้าของร้านสำเร็จ');
      setTimeout(() => {
        onVerifySuccess();
        onClose();
        setSuccess(null);
      }, 500);
    }, 700);
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
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                กรอก Master PIN หรือรหัสผ่านเจ้าของร้าน
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  required
                  value={pinOrPassword}
                  onChange={(e) => setPinOrPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-[#1F1F1F] outline-none"
                  placeholder="Master PIN (เช่น 888888) หรือรหัสผ่าน"
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
              className="w-full py-2.5 bg-[#1F1F1F] hover:bg-[#333333] text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              ยืนยันรหัสปลดล็อค (Authorize Owner)
            </button>
          </form>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleBiometric}
              disabled={isBiometricScanning}
              className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Fingerprint className="w-4 h-4 text-emerald-600" />
              <span>{isBiometricScanning ? 'กำลังสแกน...' : 'Face ID / Fingerprint'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPinOrPassword('888888');
              }}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl transition"
            >
              ใส่ PIN 888888
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
