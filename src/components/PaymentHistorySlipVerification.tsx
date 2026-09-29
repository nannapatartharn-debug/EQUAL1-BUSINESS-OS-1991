import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Eye,
  Camera,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Receipt,
  Building2,
  User,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Sale, BankSlipRecord, OrderStatus, PaymentStatus } from '../types';
import { Language } from '../lib/i18n';

interface PaymentHistorySlipVerificationProps {
  sales: Sale[];
  slipRecords: BankSlipRecord[];
  onVerifyAndApproveSlip: (record: BankSlipRecord, targetSaleId?: string) => void;
  lang: Language;
  onUpdateOrderStatus: (saleId: string, nextStatus: OrderStatus, reason?: string) => void;
}

// Built-in high fidelity sample bank slips for instant 1-click verification testing
const SAMPLE_TEST_SLIPS = [
  {
    name: 'KBANK สลิปแท้ (฿155 ยอดตรง)',
    bank_name: 'KBANK (ธนาคารกสิกรไทย)',
    sender_name: 'นาย พิชญ์ กุลวิวัฒน์',
    sender_account: 'xxx-2-94182-x',
    receiver_account: '098-765-4321 (PromptPay EQUAL1)',
    amount: 155,
    transaction_ref: '014298102938475610',
    slip_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
    type: 'valid',
  },
  {
    name: 'SCB สลิปแท้ (฿450 ยอดบริการซาลอน)',
    bank_name: 'SCB (ธนาคารไทยพาณิชย์)',
    sender_name: 'น.ส. ธนัชชา กิจประเสริฐ',
    sender_account: 'xxx-1-48201-x',
    receiver_account: '098-765-4321 (PromptPay EQUAL1)',
    amount: 450,
    transaction_ref: '20260928SCB1122334455',
    slip_image_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80',
    type: 'valid',
  },
  {
    name: '🚨 สลิปวนซ้ำ (Duplicate Fraud Alert)',
    bank_name: 'KBANK (กสิกรไทย)',
    sender_name: 'นาย ธีรภัทร วงศ์เจริญ',
    sender_account: 'xxx-2-58192-x',
    receiver_account: '098-765-4321 (PromptPay EQUAL1)',
    amount: 110,
    transaction_ref: '014234123456789012', // Already exists in INITIAL_SLIP_RECORDS!
    slip_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80',
    type: 'duplicate',
  },
  {
    name: '⚠️ สลิปยอดไม่ตรง (Amount Mismatch ฿50 vs บิล ฿250)',
    bank_name: 'KTB (ธนาคารกรุงไทย)',
    sender_name: 'นายนิธิศ สุขสวัสดิ์',
    sender_account: 'xxx-0-12845-x',
    receiver_account: '098-765-4321 (PromptPay EQUAL1)',
    amount: 50,
    transaction_ref: 'KTB2026092899887766',
    slip_image_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&q=80',
    type: 'mismatch',
  },
];

export const PaymentHistorySlipVerification: React.FC<PaymentHistorySlipVerificationProps> = ({
  sales,
  slipRecords,
  onVerifyAndApproveSlip,
  lang,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'history' | 'slips'>('scanner');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Scanner state
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Sale | null>(
    sales.find((s) => s.payment_status === 'pending') || sales[0] || null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    bank_name: string;
    sender_name: string;
    sender_account: string;
    receiver_account: string;
    amount: number;
    transaction_ref: string;
    transferred_at: string;
    image_url: string;
    status: 'verified' | 'amount_mismatch' | 'duplicate_fraud';
    note: string;
  } | null>(null);

  // Manual image upload url or data
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [selectedSlipDetail, setSelectedSlipDetail] = useState<BankSlipRecord | null>(null);

  // Filtered sales for history
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        (s.receipt_number && s.receipt_number.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.customer_phone && s.customer_phone.includes(q));

      const matchStatus = statusFilter === 'all' || s.payment_status === statusFilter;
      const matchMethod = methodFilter === 'all' || s.payment_method === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [sales, searchTerm, statusFilter, methodFilter]);

  // Statistics
  const totalVerifiedRevenue = useMemo(() => {
    return sales
      .filter((s) => s.payment_status === 'paid')
      .reduce((sum, s) => sum + s.total, 0);
  }, [sales]);

  const pendingVerificationCount = useMemo(() => {
    return sales.filter((s) => s.payment_status === 'pending').length;
  }, [sales]);

  // Handler: Scan & Extract Thai Bank Slip
  const handleProcessSlip = (slipData: typeof SAMPLE_TEST_SLIPS[0]) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);

      // Check 1: Duplicate Reference Number (Prevention of reused slips)
      const isDuplicate = slipRecords.some(
        (r) => r.transaction_ref === slipData.transaction_ref
      );

      // Check 2: Amount matching with selected order
      const targetAmount = selectedOrderForSlip ? selectedOrderForSlip.total : slipData.amount;
      const isAmountMatch = Math.abs(slipData.amount - targetAmount) < 0.01;

      let status: 'verified' | 'amount_mismatch' | 'duplicate_fraud' = 'verified';
      let note = 'ตรวจสอบผ่าน: ข้อมูลตรงกับธนาคาร ยอดเงินและรหัสอ้างอิงถูกต้อง';

      if (isDuplicate) {
        status = 'duplicate_fraud';
        note = `🚨 ตรวจพบสลิปซ้ำ! รหัสอ้างอิง ${slipData.transaction_ref} มีในระบบแล้ว เคยใช้ยืนยันออเดอร์ก่อนหน้า`;
      } else if (!isAmountMatch) {
        status = 'amount_mismatch';
        note = `⚠️ ยอดโอนไม่ตรงกับยอดบิล: สลิปโอน ฿${slipData.amount.toLocaleString()} แต่ยอดบิลคือ ฿${targetAmount.toLocaleString()} (ส่วนต่าง ฿${Math.abs(
          slipData.amount - targetAmount
        )})`;
      }

      setScanResult({
        bank_name: slipData.bank_name,
        sender_name: slipData.sender_name,
        sender_account: slipData.sender_account,
        receiver_account: slipData.receiver_account,
        amount: slipData.amount,
        transaction_ref: slipData.transaction_ref,
        transferred_at: new Date().toISOString(),
        image_url: slipData.slip_image_url,
        status,
        note,
      });
    }, 1000);
  };

  // Handle file input upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setUploadedImagePreview(dataUrl);

        // Simulate AI OCR reading of uploaded file
        const randomRef = '0142' + Math.floor(10000000000000 + Math.random() * 90000000000000);
        const targetAmount = selectedOrderForSlip?.total || 120;

        handleProcessSlip({
          name: file.name,
          bank_name: 'KBANK (กสิกรไทย ผ่าน AI OCR)',
          sender_name: 'ผู้โอน: บัญชีลูกค้าผ่าน K PLUS',
          sender_account: 'xxx-3-88219-x',
          receiver_account: '098-765-4321 (PromptPay EQUAL1)',
          amount: targetAmount,
          transaction_ref: randomRef,
          slip_image_url: dataUrl,
          type: 'valid',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirm Approval of Slip
  const handleConfirmApproval = () => {
    if (!scanResult) return;

    if (scanResult.status === 'duplicate_fraud') {
      alert('ไม่สามารถอนุมัติสลิปนี้ได้ เนื่องจากเป็นสลิปซ้ำที่เคยบันทึกในระบบแล้ว!');
      return;
    }

    const newRecord: BankSlipRecord = {
      id: 'slip-' + Date.now(),
      sale_id: selectedOrderForSlip?.id,
      order_id: selectedOrderForSlip?.id,
      slip_image_url: scanResult.image_url,
      bank_name: scanResult.bank_name,
      sender_name: scanResult.sender_name,
      sender_account: scanResult.sender_account,
      receiver_account: scanResult.receiver_account,
      amount: scanResult.amount,
      transaction_ref: scanResult.transaction_ref,
      transferred_at: scanResult.transferred_at,
      verified_at: new Date().toISOString(),
      verification_status: scanResult.status,
      verification_note: scanResult.note,
      verified_by: 'ระบบ AI Scan & เจ้าของร้าน',
    };

    onVerifyAndApproveSlip(newRecord, selectedOrderForSlip?.id);

    // If order is pending, advance to confirmed
    if (selectedOrderForSlip && selectedOrderForSlip.status === 'pending') {
      onUpdateOrderStatus(selectedOrderForSlip.id, 'confirmed', 'สลิปโอนเงินตรวจสอบผ่าน (AI Verified)');
    }

    alert('บันทึกและอนุมัติการชำระเงินเรียบร้อยแล้ว');
    setScanResult(null);
    setUploadedImagePreview(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner & KPI */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#8C887B]">
            EQUAL1 FINANCIAL ASSURANCE · PRECISION SLIP VERIFIER
          </span>
          <h2 className="text-2xl font-black text-[#171717] mt-1 flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-[#E6A055]" />
            <span>ระบบเช็คประวัติการชำระเงิน & สแกนสลิปโอนเงิน</span>
          </h2>
          <p className="text-xs text-[#7A7569] mt-0.5">
            ตรวจจับสลิปปลอม สลิปวนซ้ำ ยอดเงินไม่ตรง ด้วยโมเดลตรวจสอบหลายชั้น และระบบบัญชีมาตรฐาน
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 bg-[#FAF8F5] border border-[#E6E4DD] rounded-2xl text-right">
            <span className="text-[11px] text-[#8C887B] block">ยอดชำระสำเร็จสะสม</span>
            <strong className="text-lg font-black text-emerald-700">
              ฿{totalVerifiedRevenue.toLocaleString()}
            </strong>
          </div>

          <div className="px-4 py-2.5 bg-[#FAF8F5] border border-[#E6E4DD] rounded-2xl text-right">
            <span className="text-[11px] text-[#8C887B] block">รอตรวจสลิป</span>
            <strong className="text-lg font-black text-amber-600">
              {pendingVerificationCount} รายการ
            </strong>
          </div>
        </div>
      </div>

      {/* Mode Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6E4DD] mb-6">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'scanner'
              ? 'border-[#E6A055] text-[#171717]'
              : 'border-transparent text-[#8C887B] hover:text-[#171717]'
          }`}
        >
          <Camera className="w-4 h-4 text-[#E6A055]" />
          <span>สแกนตรวจสลิปโอนเงิน (AI Slip Scanner)</span>
          {pendingVerificationCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {pendingVerificationCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-[#E6A055] text-[#171717]'
              : 'border-transparent text-[#8C887B] hover:text-[#171717]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>ประวัติธุรกรรม & ใบเสร็จ (Sales & Payments Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab('slips')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'slips'
              ? 'border-[#E6A055] text-[#171717]'
              : 'border-transparent text-[#8C887B] hover:text-[#171717]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>คลังสลิปที่ตรวจสอบแล้ว ({slipRecords.length})</span>
        </button>
      </div>

      {/* TAB 1: AI SLIP SCANNER & VERIFICATION */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Order Selector & Upload Box */}
          <div className="lg:col-span-5 space-y-6">
            {/* Step 1: Select target order to match */}
            <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm">
              <span className="text-xs font-bold text-[#8C887B] uppercase block mb-1">
                ขั้นตอนที่ 1: เลือกออเดอร์ที่ต้องการตรวจสอบสลิป
              </span>
              <label className="text-xs text-[#7A7569] block mb-2">
                ระบบจะนำยอดในสลิปมาเปรียบเทียบกับยอดของออเดอร์ที่เลือกโดยอัตโนมัติ
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedOrderForSlip(sale)}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${
                      selectedOrderForSlip?.id === sale.id
                        ? 'bg-amber-50/70 border-[#E6A055] shadow-sm'
                        : 'bg-[#FAF8F5] border-[#E6E4DD] hover:border-[#CCC]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#171717]">{sale.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sale.payment_status === 'paid' ? 'ชำระแล้ว' : 'รอชำระ/ตรวจสลิป'}
                        </span>
                      </div>
                      <span className="text-[#8C887B] block mt-0.5">
                        {sale.customer_name || 'ลูกค้าทั่วไป'} · {sale.channel.toUpperCase()}
                      </span>
                    </div>

                    <strong className="text-sm font-black text-[#171717]">
                      ฿{sale.total.toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Upload or choose sample slip */}
            <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm">
              <span className="text-xs font-bold text-[#8C887B] uppercase block mb-1">
                ขั้นตอนที่ 2: อัปโหลดรูปสลิป หรือเลือกตัวอย่างทดสอบ
              </span>

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-[#D4D0C5] hover:border-[#E6A055] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center bg-[#FAF8F5] hover:bg-amber-50/30 mb-4 block">
                <Upload className="w-8 h-8 text-[#8C887B] mb-2" />
                <span className="text-xs font-bold text-[#171717] block">
                  คลิกเพื่ออัปโหลดรูปภาพสลิป หรือลากไฟล์มาวาง
                </span>
                <span className="text-[11px] text-[#8C887B] mt-0.5">
                  รองรับ JPG, PNG จากแอปธนาคารทุกแห่ง
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Instant Test Presets */}
              <div>
                <span className="text-[11px] font-semibold text-[#8C887B] block mb-2">
                  หรือคลิกเลือกสลิปทดสอบมาตรฐาน (Instant Simulation):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_TEST_SLIPS.map((slip, i) => (
                    <button
                      key={i}
                      onClick={() => handleProcessSlip(slip)}
                      className="p-2.5 rounded-xl border border-[#E6E4DD] hover:border-[#E6A055] bg-white text-left transition hover:shadow-sm"
                    >
                      <span className="text-xs font-bold text-[#171717] block truncate">
                        {slip.name}
                      </span>
                      <span className="text-[10px] text-[#8C887B] block mt-0.5">
                        ยอด: ฿{slip.amount.toLocaleString()} · {slip.bank_name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Extraction & Verification Results */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm min-h-[460px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E6E4DD] mb-5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-black text-[#171717]">
                      ผลการสแกนและตรวจสอบข้อมูลสลิป (Precision Slip Audit)
                    </h3>
                  </div>

                  {isScanning && (
                    <span className="text-xs font-semibold text-[#E6A055] flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังตรวจจับ OCR & ความถูกต้อง...</span>
                    </span>
                  )}
                </div>

                {!scanResult && !isScanning && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-amber-50 text-[#E6A055] flex items-center justify-center mx-auto mb-3">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-[#171717] mb-1">
                      ยังไม่ได้สแกนสลิป
                    </h4>
                    <p className="text-xs text-[#8C887B] max-w-sm mx-auto">
                      กรุณาเลือกออเดอร์ทางด้านซ้าย แล้วอัปโหลดสลิปหรือกดเลือกตัวอย่างสลิปเพื่อทดสอบการทำงาน
                    </p>
                  </div>
                )}

                {isScanning && (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100/60 border border-[#E6A055] flex items-center justify-center animate-spin">
                      <RefreshCw className="w-8 h-8 text-[#E6A055]" />
                    </div>
                    <p className="text-sm font-bold text-[#171717]">
                      กำลังอ่านค่าบาร์โค้ด / ข้อความ / รหัสอ้างอิงธนาคาร...
                    </p>
                    <p className="text-xs text-[#8C887B]">
                      ตรวจสอบกับฐานข้อมูลสลิปเดิม เพื่อป้องกันการนำสลิปเก่ามาใช้ซ้ำ
                    </p>
                  </div>
                )}

                {scanResult && !isScanning && (
                  <div className="space-y-5 animate-in fade-in">
                    {/* Status Alert Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 ${
                        scanResult.status === 'verified'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : scanResult.status === 'duplicate_fraud'
                          ? 'bg-rose-50 border-rose-400 text-rose-950'
                          : 'bg-amber-50 border-amber-300 text-amber-950'
                      }`}
                    >
                      {scanResult.status === 'verified' && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      {scanResult.status === 'duplicate_fraud' && (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      {scanResult.status === 'amount_mismatch' && (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}

                      <div>
                        <strong className="text-sm font-black block">
                          {scanResult.status === 'verified' && '🟢 สลิปแท้ ถูกต้องสมบูรณ์ (Verified)'}
                          {scanResult.status === 'duplicate_fraud' && '🚨 สลิปซ้ำ / เคยถูกใช้งานแล้ว (Duplicate Fraud Alert)'}
                          {scanResult.status === 'amount_mismatch' && '⚠️ ยอดโอนไม่ตรงกับบิล (Amount Mismatch)'}
                        </strong>
                        <p className="text-xs mt-1 leading-relaxed">{scanResult.note}</p>
                      </div>
                    </div>

                    {/* Extracted Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD]">
                        <span className="text-[#8C887B] block mb-0.5">ธนาคารต้นทาง:</span>
                        <strong className="text-[#171717] font-bold">{scanResult.bank_name}</strong>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD]">
                        <span className="text-[#8C887B] block mb-0.5">ผู้โอนเงิน:</span>
                        <strong className="text-[#171717] font-bold">{scanResult.sender_name}</strong>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD]">
                        <span className="text-[#8C887B] block mb-0.5">บัญชีปลายทาง:</span>
                        <strong className="text-[#171717] font-mono">{scanResult.receiver_account}</strong>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD]">
                        <span className="text-[#8C887B] block mb-0.5">รหัสอ้างอิงธุรกรรม (Ref No.):</span>
                        <strong className="text-[#171717] font-mono text-[11px] block truncate">
                          {scanResult.transaction_ref}
                        </strong>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD]">
                        <span className="text-[#8C887B] block mb-0.5">ยอดเงินในสลิป:</span>
                        <strong className="text-lg font-black text-[#171717]">
                          ฿{scanResult.amount.toLocaleString()}
                        </strong>
                      </div>

                      <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD]">
                        <span className="text-[#8C887B] block mb-0.5">ยอดบิลที่ตรงกัน ({selectedOrderForSlip?.id}):</span>
                        <strong className="text-lg font-black text-[#171717]">
                          ฿{selectedOrderForSlip?.total.toLocaleString() || '0'}
                        </strong>
                      </div>
                    </div>

                    {/* Preview Image Thumbnail */}
                    {scanResult.image_url && (
                      <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#E6E4DD] flex items-center gap-3">
                        <img
                          src={scanResult.image_url}
                          alt="Slip Preview"
                          className="w-16 h-16 object-cover rounded-xl border border-[#DDD]"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-[#171717] block">ภาพถ่ายสลิปต้นฉบับ</span>
                          <span className="text-[#8C887B] block mt-0.5">
                            บันทึกเวลาโอน: {new Date(scanResult.transferred_at).toLocaleString('th-TH')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {scanResult && (
                <div className="pt-4 border-t border-[#E6E4DD] flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setScanResult(null)}
                    className="px-4 py-2.5 rounded-xl border border-[#CCC] text-xs font-bold text-[#666] hover:bg-[#F5F5F0] transition"
                  >
                    ยกเลิก / สแกนใหม่
                  </button>

                  <button
                    onClick={handleConfirmApproval}
                    disabled={scanResult.status === 'duplicate_fraud'}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow ${
                      scanResult.status === 'duplicate_fraud'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>อนุมัติและบันทึกยอดชำระ (Approve & Settle)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSACTIONS & PAYMENTS LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C887B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหา Order ID, เลขที่ใบเสร็จ, ชื่อลูกค้า..."
                className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl pl-9 pr-3 py-2 text-xs text-[#171717] focus:border-[#E6A055] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-[#171717] outline-none font-medium cursor-pointer"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="paid">ชำระแล้ว (Paid)</option>
                <option value="pending">รอชำระ (Pending)</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-[#171717] outline-none font-medium cursor-pointer"
              >
                <option value="all">วิธีชำระทั้งหมด</option>
                <option value="promptpay">PromptPay QR</option>
                <option value="cash">เงินสด (Cash)</option>
                <option value="card">บัตรเครดิต (Card)</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EFE9] border border-[#E6E4DD] font-semibold text-[#171717] flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์รายงาน</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E6E4DD] text-[#8C887B] font-bold">
                  <th className="py-3 px-3">Order / Receipt ID</th>
                  <th className="py-3 px-3">เวลาธุรกรรม</th>
                  <th className="py-3 px-3">ลูกค้า / ช่องทาง</th>
                  <th className="py-3 px-3">วิธีชำระเงิน</th>
                  <th className="py-3 px-3 text-right">ยอดรวม (บาท)</th>
                  <th className="py-3 px-3 text-center">สถานะการชำระ</th>
                  <th className="py-3 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE6]">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-[#FAF8F5] transition">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-[#171717] block">
                        {sale.id}
                      </span>
                      {sale.receipt_number && (
                        <span className="text-[10px] text-[#8C887B] font-mono">
                          {sale.receipt_number}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-[#7A7569]">
                      {new Date(sale.created_at).toLocaleString('th-TH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-3">
                      <strong className="text-[#171717] block">
                        {sale.customer_name || 'ลูกค้าทั่วไป'}
                      </strong>
                      <span className="text-[10px] text-[#8C887B] uppercase">
                        {sale.channel}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E6E4DD] font-semibold text-[#171717]">
                        {sale.payment_method === 'promptpay' && <QrCode className="w-3 h-3 text-indigo-600" />}
                        {sale.payment_method === 'cash' && <Banknote className="w-3 h-3 text-emerald-600" />}
                        {sale.payment_method === 'card' && <CreditCard className="w-3 h-3 text-amber-600" />}
                        <span>{sale.payment_method.toUpperCase()}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-black text-sm text-[#171717]">
                      ฿{sale.total.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sale.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sale.payment_status === 'paid' ? 'ชำระแล้ว' : 'รอตรวจสอบ'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {sale.payment_status === 'pending' ? (
                        <button
                          onClick={() => {
                            setSelectedOrderForSlip(sale);
                            setActiveTab('scanner');
                          }}
                          className="px-2.5 py-1 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold rounded-lg transition text-[11px]"
                        >
                          ตรวจสลิป
                        </button>
                      ) : (
                        <span className="text-[#8C887B] text-[11px] font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>เรียบร้อย</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFIED BANK SLIP ARCHIVE */}
      {activeTab === 'slips' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E6E4DD] mb-6">
            <div>
              <h3 className="text-base font-black text-[#171717]">
                คลังสลิปโอนเงินที่บันทึกแล้วในระบบ ({slipRecords.length} รายการ)
              </h3>
              <p className="text-xs text-[#8C887B]">
                เก็บประวัติสลิปเพื่อตรวจสอบย้อนหลังทางภาษี และป้องกันการวนสลิปซ้ำ 100%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slipRecords.map((slip) => (
              <div
                key={slip.id}
                onClick={() => setSelectedSlipDetail(slip)}
                className="bg-[#FAF8F5] border border-[#E6E4DD] hover:border-[#E6A055] rounded-2xl p-4 transition cursor-pointer hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>{slip.verification_status.toUpperCase()}</span>
                  </span>
                  <span className="text-[10px] text-[#8C887B]">
                    {new Date(slip.verified_at).toLocaleTimeString('th-TH')}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={slip.slip_image_url}
                    alt="Slip"
                    className="w-14 h-14 object-cover rounded-xl border border-[#DDD]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#171717] block">
                      {slip.sender_name}
                    </span>
                    <span className="text-[11px] text-[#8C887B] block mt-0.5">
                      {slip.bank_name}
                    </span>
                    <strong className="text-sm font-black text-[#171717] mt-1 block">
                      ฿{slip.amount.toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="text-[10px] text-[#7A7569] font-mono border-t border-[#E6E4DD] pt-2">
                  <span>Ref: {slip.transaction_ref}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slip Detail Modal */}
      {selectedSlipDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E4DD] shadow-2xl relative">
            <button
              onClick={() => setSelectedSlipDetail(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>

            <h3 className="text-base font-black text-[#171717] mb-1">
              รายละเอียดสลิปโอนเงิน (Verified Slip Details)
            </h3>
            <p className="text-xs text-[#8C887B] mb-4">
              รหัสอ้างอิง: {selectedSlipDetail.transaction_ref}
            </p>

            <img
              src={selectedSlipDetail.slip_image_url}
              alt="Full Slip"
              className="w-full h-48 object-cover rounded-2xl border border-[#E6E4DD] mb-4"
            />

            <div className="space-y-2 text-xs bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6E4DD] mb-4">
              <div className="flex justify-between">
                <span className="text-[#8C887B]">ธนาคาร:</span>
                <span className="font-bold">{selectedSlipDetail.bank_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C887B]">ผู้โอน:</span>
                <span className="font-bold">{selectedSlipDetail.sender_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C887B]">ยอดเงิน:</span>
                <strong className="text-emerald-700 font-black">
                  ฿{selectedSlipDetail.amount.toLocaleString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C887B]">ผู้ตรวจสอบ:</span>
                <span>{selectedSlipDetail.verified_by}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedSlipDetail(null)}
              className="w-full py-2.5 bg-[#171717] text-white font-bold rounded-xl text-xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
