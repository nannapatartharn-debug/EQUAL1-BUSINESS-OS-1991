import React, { useState } from 'react';
import {
  Coins,
  DollarSign,
  AlertCircle,
  CheckCircle,
  X,
  History,
  Lock,
  Unlock,
} from 'lucide-react';
import { CashSession } from '../types';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: CashSession | null;
  onOpenSession: (openingAmount: number) => void;
  onCloseSession: (closingAmount: number) => void;
  pastSessions: CashSession[];
  todaysCashSales: number;
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  onOpenSession,
  onCloseSession,
  pastSessions,
  todaysCashSales,
}) => {
  const [openingInput, setOpeningInput] = useState<number>(2000);
  const [closingInput, setClosingInput] = useState<number>(0);
  const [viewHistory, setViewHistory] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedCash = activeSession
    ? activeSession.opening_cash + todaysCashSales
    : 0;

  const variance = activeSession ? closingInput - expectedCash : 0;

  const handleStartShift = () => {
    if (openingInput < 0) {
      setErrorNotice('จำนวนเงินเริ่มต้นไม่ถูกต้อง');
      return;
    }
    setErrorNotice(null);
    onOpenSession(openingInput);
  };

  const handleEndShift = () => {
    if (closingInput < 0) {
      setErrorNotice('กรุณากรอกจำนวนเงินสดที่นับได้จริง');
      return;
    }
    setErrorNotice(null);
    onCloseSession(closingInput);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E4DD] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#E6A055]" />
            <h3 className="text-lg font-black text-[#171717]">
              การจัดการลิ้นชักเงินสด & กะการทำงาน (Cash Shift)
            </h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View toggle */}
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setViewHistory(!viewHistory)}
            className="text-xs text-[#7A7569] hover:underline flex items-center gap-1 font-medium"
          >
            <History className="w-3.5 h-3.5" />
            <span>{viewHistory ? 'กลับหน้าปัจจุบัน' : 'ดูประวัติรอบกะย้อนหลัง'}</span>
          </button>
        </div>

        {viewHistory ? (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#6B675E]">
              ประวัติรอบกะเงินสดที่ผ่านมา
            </h4>
            <div className="border border-[#ECE9E1] rounded-2xl overflow-hidden max-h-64 overflow-y-auto text-xs">
              <table className="w-full">
                <thead className="bg-[#FAF9F5] border-b border-[#ECE9E1] text-[#6B675E]">
                  <tr>
                    <th className="p-2 text-left">กะ</th>
                    <th className="p-2 text-right">เงินเปิดกะ</th>
                    <th className="p-2 text-right">เงินปิดกะ</th>
                    <th className="p-2 text-right">ผลต่าง</th>
                    <th className="p-2 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE9E1]">
                  {pastSessions.map((s) => (
                    <tr key={s.id}>
                      <td className="p-2 font-mono">{s.id}</td>
                      <td className="p-2 text-right">฿{s.opening_cash}</td>
                      <td className="p-2 text-right">{s.closing_cash != null ? `฿${s.closing_cash}` : '-'}</td>
                      <td className={`p-2 text-right font-bold ${
                        (s.variance || 0) < 0 ? 'text-red-600' : (s.variance || 0) > 0 ? 'text-emerald-600' : 'text-gray-500'
                      }`}>
                        {s.variance != null ? (s.variance >= 0 ? `+${s.variance}` : s.variance) : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {s.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeSession ? (
          /* ACTIVE SHIFT: CLOSING UI */
          <div className="space-y-4">
            <div className="p-4 bg-[#F2FBF4] border border-[#B7E4BE] rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A622A] flex items-center gap-1.5">
                  <Unlock className="w-4 h-4" /> รอบกะกำลังเปิดใช้งาน (#{activeSession.id})
                </span>
                <span className="text-[#555]">
                  เปิดเมื่อ: {new Date(activeSession.opened_at).toLocaleTimeString('th-TH')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#CCEBD2]">
                <div>
                  <span className="text-gray-500 block">เงินทอนตั้งต้น (Opening Float):</span>
                  <strong className="text-sm text-black">฿{activeSession.opening_cash.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">ยอดขายเงินสดรอบนี้:</span>
                  <strong className="text-sm text-black">฿{todaysCashSales.toLocaleString()}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[#CCEBD2] flex justify-between items-baseline">
                <span className="font-bold text-gray-700">ยอดเงินสดที่ควรมีในลิ้นชัก (Expected):</span>
                <strong className="text-lg text-emerald-800">฿{expectedCash.toLocaleString()}</strong>
              </div>
            </div>

            {/* Count Input */}
            <div>
              <label className="text-xs font-semibold text-[#5A574E] block mb-1">
                ยอดเงินสดที่นับได้จริงในลิ้นชัก (Actual Count)
              </label>
              <input
                type="number"
                min="0"
                value={closingInput || ''}
                onChange={(e) => setClosingInput(Number(e.target.value))}
                placeholder={String(expectedCash)}
                className="w-full text-2xl font-black px-4 py-3 border border-[#DDD9CE] rounded-xl text-center focus:ring-2 focus:ring-[#171717]"
              />
            </div>

            {/* Quick Fill Button */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClosingInput(expectedCash)}
                className="flex-1 py-1.5 bg-[#FAF9F5] border border-[#DDD9CE] rounded-lg text-xs font-bold text-gray-700 hover:bg-[#F2EFE9]"
              >
                ใส่มูลค่าที่ระบบคำนวณพอดี (฿{expectedCash})
              </button>
            </div>

            {closingInput > 0 && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  variance === 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : variance < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span>ผลต่าง (Variance):</span>
                <span className="text-sm">
                  {variance === 0
                    ? 'ตรงตามระบบพอดี (฿0)'
                    : variance > 0
                    ? `เงินเกิน +฿${variance.toLocaleString()}`
                    : `เงินขาด -฿${Math.abs(variance).toLocaleString()}`}
                </span>
              </div>
            )}

            <button
              onClick={handleEndShift}
              className="w-full py-3.5 bg-[#B42318] hover:bg-[#9B1D14] text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition"
            >
              <Lock className="w-4 h-4" />
              <span>ปิดรอบกะและบันทึกผลต่างการเงิน</span>
            </button>
          </div>
        ) : (
          /* NO ACTIVE SHIFT: OPENING UI */
          <div className="space-y-4">
            <div className="p-4 bg-[#FFF9F2] border border-[#FEE4C3] rounded-2xl text-xs space-y-1 text-[#8C5214]">
              <strong>ยังไม่มีรอบกะเงินสดที่เปิดอยู่</strong>
              <p>กรุณาระบุเงินสดเริ่มต้น (เงินทอนในลิ้นชัก) ก่อนเริ่มการขายหน้าร้าน</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#5A574E] block mb-1">
                เงินทอนเริ่มต้นในลิ้นชัก (Opening Cash Float)
              </label>
              <input
                type="number"
                min="0"
                value={openingInput || ''}
                onChange={(e) => setOpeningInput(Number(e.target.value))}
                className="w-full text-2xl font-black px-4 py-3 border border-[#DDD9CE] rounded-xl text-center focus:ring-2 focus:ring-[#171717]"
              />
            </div>

            <div className="flex gap-2">
              {[1000, 2000, 3000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningInput(amt)}
                  className="flex-1 py-1.5 bg-[#FAF9F5] border border-[#DDD9CE] rounded-lg text-xs font-bold text-gray-700 hover:bg-[#F2EFE9]"
                >
                  ฿{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <button
              onClick={handleStartShift}
              className="w-full py-3.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              <span>เปิดรอบกะเงินสด (฿{openingInput.toLocaleString()})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
