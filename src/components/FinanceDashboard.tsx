import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Plus,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { Sale, CashSession } from '../types';
import { Language } from '../lib/i18n';

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  note: string;
  created_at: string;
}

interface FinanceDashboardProps {
  sales: Sale[];
  cashSessions: CashSession[];
  lang: Language;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  sales,
  cashSessions,
}) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: 'exp-1',
      category: 'ค่าน้ำแข็ง & วัตถุดิบสด',
      amount: 450,
      note: 'น้ำแข็งหลอด + ผลไม้สดเข้าร้าน',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'exp-2',
      category: 'ค่าซองและถุงบรรจุภัณฑ์',
      amount: 320,
      note: 'ถุงหูหิ้วรักษ์โลก 3 ห่อ',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ]);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseCat, setExpenseCat] = useState('วัตถุดิบ & สินค้าสิ้นเปลือง');
  const [expenseAmt, setExpenseAmt] = useState<number>(500);
  const [expenseNote, setExpenseNote] = useState('');

  // Financial calculations
  const totalRevenue = useMemo(() => {
    return sales
      .filter((s) => s.payment_status === 'paid')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const totalCOGS = useMemo(() => {
    return sales.reduce((sum, s) => {
      const itemsCost =
        s.items?.reduce((iSum, it) => iSum + it.unit_cost * it.quantity, 0) || 0;
      return sum + itemsCost;
    }, 0);
  }, [sales]);

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const netCashFlow = totalRevenue - totalExpenses;

  // Breakdown by payment method
  const paymentBreakdown = useMemo(() => {
    const acc = { cash: 0, promptpay: 0, card: 0, transfer: 0 };
    sales
      .filter((s) => s.payment_status === 'paid')
      .forEach((s) => {
        if (s.payment_method in acc) {
          acc[s.payment_method as keyof typeof acc] += s.total;
        }
      });
    return acc;
  }, [sales]);

  const handleCreateExpense = () => {
    if (expenseAmt <= 0) return;
    const newExp: ExpenseItem = {
      id: 'exp-' + Date.now().toString().slice(-6),
      category: expenseCat,
      amount: expenseAmt,
      note: expenseNote,
      created_at: new Date().toISOString(),
    };
    setExpenses([newExp, ...expenses]);
    setIsAddExpenseOpen(false);
    setExpenseNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#8C887B] font-medium">ยอดขายรวม (Total Revenue)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-[#171717]">
            ฿{totalRevenue.toLocaleString()}
          </strong>
          <span className="text-[11px] text-[#7A7569] block mt-1">
            จาก {sales.length} ธุรกรรมสำเร็จ
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#8C887B] font-medium">กำไรขั้นต้น (Gross Profit)</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#FAF9F5] border border-[#DDD9CE]">
              {grossMargin}%
            </span>
          </div>
          <strong className="text-2xl font-black text-[#16A34A]">
            ฿{grossProfit.toLocaleString()}
          </strong>
          <span className="text-[11px] text-[#7A7569] block mt-1">
            ต้นทุนขาย (COGS): ฿{totalCOGS.toLocaleString()}
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#8C887B] font-medium">ค่าใช้จ่ายร้าน (Expenses)</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <strong className="text-2xl font-black text-[#B42318]">
            ฿{totalExpenses.toLocaleString()}
          </strong>
          <span className="text-[11px] text-[#7A7569] block mt-1">
            {expenses.length} รายการบันทึก
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-[#8C887B] font-medium">กระแสเงินสดสุทธิ (Net Cash)</span>
            <TrendingUp className="w-5 h-5 text-[#E6A055]" />
          </div>
          <strong
            className={`text-2xl font-black ${
              netCashFlow >= 0 ? 'text-[#171717]' : 'text-rose-600'
            }`}
          >
            ฿{netCashFlow.toLocaleString()}
          </strong>
          <span className="text-[11px] text-[#7A7569] block mt-1">
            รายรับลบค่าใช้จ่ายจริง
          </span>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Payment Channels Breakdown */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-[#171717] mb-1">
              ช่องทางการรับเงิน (Payment Reconciliation)
            </h3>
            <p className="text-xs text-[#8C887B] mb-5">
              แยกตามวิธีการชำระเงินที่ได้รับการยืนยันแล้ว
            </p>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#FAF9F5] rounded-2xl border border-[#ECE8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm text-[#171717]">Thai PromptPay QR</strong>
                    <span className="text-[11px] text-[#8C887B]">สแกนจ่ายเงินโอนเข้าบัญชีร้าน</span>
                  </div>
                </div>
                <span className="text-base font-black text-[#171717]">
                  ฿{paymentBreakdown.promptpay.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FAF9F5] rounded-2xl border border-[#ECE8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm text-[#171717]">เงินสดในลิ้นชัก (Cash)</strong>
                    <span className="text-[11px] text-[#8C887B]">ต้องตรงกับยอดตรวจนับในกะ</span>
                  </div>
                </div>
                <span className="text-base font-black text-[#171717]">
                  ฿{paymentBreakdown.cash.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FAF9F5] rounded-2xl border border-[#ECE8DC]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-sm text-[#171717]">บัตรเครดิต/เดบิต (EDC)</strong>
                    <span className="text-[11px] text-[#8C887B]">รับผ่านเครื่องรูดบัตร</span>
                  </div>
                </div>
                <span className="text-base font-black text-[#171717]">
                  ฿{paymentBreakdown.card.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Manager */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-[#171717]">
                  บันทึกค่าใช้จ่ายร้าน (Operating Expenses)
                </h3>
                <span className="text-xs text-[#8C887B]">ค่าของใช้ ค่าน้ำแข็ง ค่าทำความสะอาด</span>
              </div>
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                className="px-3 py-1.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ บันทึกจ่าย</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="p-3 bg-[#FAF9F5] border border-[#ECE8DC] rounded-2xl flex justify-between items-center"
                >
                  <div>
                    <strong className="text-[#171717] block">{e.category}</strong>
                    <span className="text-[11px] text-[#8C887B]">
                      {e.note} · {new Date(e.created_at).toLocaleTimeString('th-TH')}
                    </span>
                  </div>
                  <strong className="text-sm font-black text-[#B42318]">
                    -฿{e.amount.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <h3 className="text-lg font-black text-[#171717]">บันทึกค่าใช้จ่ายใหม่</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs mb-5">
              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">หมวดหมู่ค่าใช้จ่าย</label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                >
                  <option value="วัตถุดิบ & สินค้าสิ้นเปลือง">วัตถุดิบ & สินค้าสิ้นเปลือง (น้ำแข็ง/ถุง/บรรจุภัณฑ์)</option>
                  <option value="อุปกรณ์บริการซาลอน">อุปกรณ์บริการซาลอน (กาว/ขนตา/สีเจล/สำลี)</option>
                  <option value="ค่าสาธารณูปโภค & ค่าเช่า">ค่าสาธารณูปโภค & ค่าเช่า</option>
                  <option value="ค่าเบี้ยเลี้ยง & ค่าจ้างชั่วคราว">ค่าเบี้ยเลี้ยง & ค่าจ้างชั่วคราว</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  min="1"
                  value={expenseAmt}
                  onChange={(e) => setExpenseAmt(Number(e.target.value))}
                  className="w-full text-xl font-bold p-2.5 border border-[#DDD9CE] rounded-xl focus:ring-2 focus:ring-[#171717]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">หมายเหตุ / เหตุผลการจ่าย</label>
                <input
                  type="text"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  placeholder="เช่น ซื้อน้ำแข็งหลอด 1 กระสอบ"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleCreateExpense}
              className="w-full py-3 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-xl transition"
            >
              บันทึกรายการจ่าย
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
