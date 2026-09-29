import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Send,
  X,
  AlertCircle,
  Bot,
  User,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { AiActionProposal, Product, Sale, Booking } from '../types';
import { askBusinessBrain } from '../lib/gemini';

interface AiBusinessBrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: AiActionProposal[];
  onApproveProposal: (proposalId: string) => void;
  onRejectProposal: (proposalId: string) => void;
  sales: Sale[];
  products: Product[];
  bookings: Booking[];
}

export const AiBusinessBrainModal: React.FC<AiBusinessBrainModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onApproveProposal,
  onRejectProposal,
  sales,
  products,
  bookings,
}) => {
  const [messages, setMessages] = useState<
    { role: 'assistant' | 'user'; text: string; time: string }[]
  >([
    {
      role: 'assistant',
      text: 'สวัสดีค่ะ ฉันคือ EQUAL1 AI Business Brain ผู้ช่วยอัจฉริยะสำหรับเจ้าของธุรกิจ\n\nฉันตรวจสอบข้อมูลยอดขาย สต๊อก และคิวบริการแบบ Real-time และได้ร่างข้อเสนอแนะที่ต้องให้ Owner อนุมัติไว้ด้านล่าง มีคำถามหรือต้องการให้วิเคราะห์ข้อมูลส่วนใดเป็นพิเศษไหมคะ?',
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const lowStockNames = products
    .filter((p) => p.stock <= p.reorder)
    .map((p) => `${p.name} (เหลือ ${p.stock} ชิ้น)`)
    .join(', ');

  const totalRev = sales
    .filter((s) => s.payment_status === 'paid')
    .reduce((sum, s) => sum + s.total, 0);

  const pendingBookingsCount = bookings.filter(
    (b) => b.status === 'requested' || b.status === 'confirmed'
  ).length;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAsking) return;

    const userText = inputMessage.trim();
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText, time: nowTime },
    ]);
    setInputMessage('');
    setIsAsking(true);

    const reply = await askBusinessBrain({
      salesSummary: `ยอดขายรวมวันนี้ ฿${totalRev.toLocaleString()} จาก ${sales.length} รายการ`,
      lowStockItems: lowStockNames || 'ไม่มีรายการต่ำกว่าเกณฑ์',
      pendingAppointments: `มีนัดหมายคิวบริการ ${pendingBookingsCount} รายการ`,
      userQuestion: userText,
    });

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setIsAsking(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-[#E6E4DD] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#171717]">
                EQUAL1 AI Business Brain
              </h3>
              <span className="text-[11px] text-[#7A7569]">
                ระบบปัญญาประดิษฐ์ช่วยบริหาร · สังเกตการณ์ → วิเคราะห์ → เสนอแนะ → รอ Owner อนุมัติ
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split into 2 Columns: Left is Action Proposals, Right is AI Chat */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
          {/* Left: Pending Action Proposals (5 cols) */}
          <div className="md:col-span-5 flex flex-col border border-[#E8E5DD] rounded-2xl p-4 bg-[#FAF9F5] min-h-0">
            <div className="flex items-center justify-between mb-3 border-b border-[#ECE8DC] pb-2">
              <span className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>ข้อเสนอแนะที่รอ Owner อนุมัติ</span>
              </span>
              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-[#DDD9CE]">
                {proposals.filter((p) => p.status === 'proposed').length}
              </span>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white p-3.5 rounded-xl border border-[#DDD9CE] shadow-sm space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-1">
                    <strong className="text-sm font-bold text-[#171717] leading-snug">
                      {prop.title}
                    </strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 whitespace-nowrap">
                      {prop.type.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[#6B675E] text-[11px] leading-relaxed">
                    <strong>เหตุผล:</strong> {prop.explanation}
                  </p>

                  <p className="text-[#166534] bg-emerald-50 p-2 rounded-lg font-medium text-[11px]">
                    💡 <strong>คำแนะนำ:</strong> {prop.recommendation}
                  </p>

                  <div className="pt-2 border-t border-[#EEE] flex items-center gap-2">
                    {prop.status === 'proposed' ? (
                      <>
                        <button
                          onClick={() => onApproveProposal(prop.id)}
                          className="flex-1 py-1.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>อนุมัติ & สั่งการ</span>
                        </button>
                        <button
                          onClick={() => onRejectProposal(prop.id)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold text-[11px] transition"
                        >
                          ปฏิเสธ
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> อนุมัติแล้ว
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {proposals.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  ไม่มีข้อเสนอแนะที่ค้างอยู่
                </div>
              )}
            </div>
          </div>

          {/* Right: AI Multi-turn Conversation (7 cols) */}
          <div className="md:col-span-7 flex flex-col border border-[#E8E5DD] rounded-2xl bg-white min-h-0 overflow-hidden">
            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-[#171717] text-white rounded-tr-none'
                        : 'bg-[#F6F4ED] text-[#1F1E1B] border border-[#E5E1D5] rounded-tl-none'
                    }`}
                  >
                    {m.text}
                    <span className="block text-[9px] text-[#8C887B] text-right mt-1">
                      {m.time}
                    </span>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-300 text-black flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isAsking && (
                <div className="flex gap-2 items-center text-gray-500 text-xs italic">
                  <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
                  <span>AI กำลังวิเคราะห์ข้อมูลและสังเคราะห์คำตอบ...</span>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="p-3 border-t border-[#ECE8DC] bg-[#FAF9F5] flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="พิมพ์คำถาม หรือสั่งให้วิเคราะห์ยอดขาย/สต๊อก/คิวซาลอน..."
                className="flex-1 px-3.5 py-2.5 bg-white border border-[#DDD9CE] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#171717]"
              />
              <button
                onClick={handleSendMessage}
                disabled={isAsking || !inputMessage.trim()}
                className="p-2.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl shadow disabled:opacity-40 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
