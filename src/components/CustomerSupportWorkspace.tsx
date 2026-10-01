import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Bot,
  UserCheck,
  Send,
  CheckCircle,
  Clock,
  Sparkles,
  Phone,
  Shield,
  HelpCircle,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  X,
  Headphones,
} from 'lucide-react';
import { SupportThread, SupportMessage, Customer, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { runtimeManager, TENANT_CONFIG } from '../lib/backendEngine';

interface CustomerSupportWorkspaceProps {
  currentRole: UserRole;
  currentStaffName: string;
  customers: Customer[];
  activeThreads: SupportThread[];
  messages: SupportMessage[];
  onSendMessage: (threadId: string, text: string, senderType: 'agent' | 'ai' | 'customer', senderName: string) => void;
  onTakeoverThread: (threadId: string, agentName: string) => void;
  onResolveThread: (threadId: string, agentName: string) => void;
}

export const CustomerSupportWorkspace: React.FC<CustomerSupportWorkspaceProps> = ({
  currentRole,
  currentStaffName,
  customers,
  activeThreads,
  messages,
  onSendMessage,
  onTakeoverThread,
  onResolveThread,
}) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string>(activeThreads[0]?.id || '');
  const [inputText, setInputText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting_agent' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const selectedThread = activeThreads.find((t) => t.id === selectedThreadId) || activeThreads[0];
  const threadMessages = messages.filter((m) => m.thread_id === selectedThread?.id);
  const threadCustomer = customers.find((c) => c.id === selectedThread?.customer_id);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [threadMessages, selectedThreadId]);

  const filteredThreads = activeThreads.filter((t) => {
    if (statusFilter === 'waiting_agent') return t.status === 'waiting_agent';
    if (statusFilter === 'in_progress') return t.status === 'in_progress';
    if (statusFilter === 'resolved') return t.status === 'resolved';
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedThread) return;

    onSendMessage(selectedThread.id, inputText.trim(), 'agent', currentStaffName);
    setInputText('');
  };

  const cannedResponses = [
    'สวัสดีค่ะ EQUAL1 ยินดีให้บริการค่ะ มีข้อมูลสอบถามเพิ่มเติมไหมคะ?',
    'ขออภัยในความไม่สะดวกค่ะ กำลังตรวจสอบสถานะออเดอร์กับทางสาขาให้นะคะ',
    'รายการสินค้าชิ้นนี้มีพร้อมส่งที่สาขาเมืองเอกค่ะ สามารถสั่งซื้อผ่านระบบได้ทันทีค่ะ',
    'คุณลูกค้าสามารถจองคิวบริการซาลอนและสักคิ้วล่วงหน้าผ่านหน้าระบบได้เลยนะคะ',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-[#171717] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6A055] text-black">
              SUPER ADMIN · SUPPORT WORKSPACE
            </span>
            <span className="text-xs text-[#AAA]">ศูนย์บริการลูกค้าสัมพันธ์และการดูแลสด</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Customer Support &amp; Human Takeover
          </h1>
          <p className="text-xs text-[#BBB] mt-1 max-w-xl">
            สลับการตอบกลับจาก AI อัตโนมัติเป็นพนักงานจริง (Human Staff) เพื่อแก้ไขปัญหา ให้คำแนะนำสินค้า และปิดการขายอย่างมืออาชีพ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-gray-400 block uppercase">รอดำเนินการ (Waiting)</span>
            <strong className="text-lg font-black text-amber-400">
              {activeThreads.filter((t) => t.status === 'waiting_agent').length}
            </strong>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] text-gray-400 block uppercase">กำลังดูแล (Active)</span>
            <strong className="text-lg font-black text-emerald-400">
              {activeThreads.filter((t) => t.status === 'in_progress').length}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Thread List (Left) + Chat & Customer Info (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm min-h-[640px]">
        {/* Left Column: Thread List */}
        <div className="lg:col-span-4 border-r border-gray-100 flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า หรือหัวข้อ..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-black transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'all' ? 'bg-[#1F1F1F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ทั้งหมด ({activeThreads.length})
              </button>
              <button
                onClick={() => setStatusFilter('waiting_agent')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                  statusFilter === 'waiting_agent' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>ขอคุยคน ({activeThreads.filter((t) => t.status === 'waiting_agent').length})</span>
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'in_progress' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                กำลังคุย
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  statusFilter === 'resolved' ? 'bg-gray-600 text-white' : 'bg-gray-50 text-gray-600'
                }`}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2 space-y-1">
            {filteredThreads.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                ไม่พบประวัติการสนทนาในหมวดหมู่นี้
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.id === selectedThread?.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full text-left p-3 rounded-2xl transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#1F1F1F] text-white shadow-sm'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate max-w-[160px]">
                        {thread.customer_name || 'ลูกค้าทั่วไป'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        thread.status === 'waiting_agent'
                          ? isSelected ? 'bg-amber-400 text-black' : 'bg-amber-100 text-amber-800'
                          : thread.status === 'in_progress'
                          ? isSelected ? 'bg-emerald-400 text-black' : 'bg-emerald-100 text-emerald-800'
                          : isSelected ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {thread.status === 'waiting_agent' ? 'รอคนตอบ' : thread.status === 'in_progress' ? 'กำลังดูแล' : 'เสร็จสิ้น'}
                      </span>
                    </div>

                    <p className={`text-xs truncate ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                      {thread.subject}
                    </p>

                    <div className="flex items-center justify-between text-[10px] opacity-75">
                      <span className="flex items-center gap-1">
                        {thread.mode === 'human' ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>จนท: {thread.assigned_to_name || 'พนักงาน'}</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-purple-400" />
                            <span>AI Support</span>
                          </>
                        )}
                      </span>
                      <span>{new Date(thread.updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation (8 Cols) */}
        {selectedThread ? (
          <div className="lg:col-span-8 flex flex-col justify-between h-full bg-[#FAF9F6]">
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shadow-sm">
                  {selectedThread.customer_name ? selectedThread.customer_name[0] : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-gray-900">
                      {selectedThread.customer_name || 'ลูกค้าทั่วไป'}
                    </strong>
                    {threadCustomer && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {threadCustomer.tier} · {threadCustomer.points} PTS
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 block">
                    โทร: {selectedThread.customer_phone || threadCustomer?.phone || 'ไม่ระบุ'} · หัวข้อ: {selectedThread.subject}
                  </span>
                </div>
              </div>

              {/* Takeover & Actions */}
              <div className="flex items-center gap-2">
                {selectedThread.mode === 'ai' ? (
                  <button
                    onClick={() => onTakeoverThread(selectedThread.id, currentStaffName)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>รับสายดูแลสด (Take Over)</span>
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ผู้ดูแล: {selectedThread.assigned_to_name || currentStaffName}</span>
                  </span>
                )}

                {selectedThread.status !== 'resolved' && (
                  <button
                    onClick={() => onResolveThread(selectedThread.id, currentStaffName)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
                  >
                    ปิดเคส (Resolve)
                  </button>
                )}
              </div>
            </div>

            {/* Messages Body */}
            <div
              ref={chatScrollRef}
              className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[360px] max-h-[460px]"
            >
              {threadMessages.length === 0 ? (
                <div className="py-20 text-center text-gray-400 text-xs">
                  ยังไม่มีข้อความในการสนทนานี้
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isAgent = msg.sender_type === 'agent';
                  const isAi = msg.sender_type === 'ai';
                  const isCustomer = msg.sender_type === 'customer';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1 px-1">
                        {isAi ? (
                          <>
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>AI Support Brain</span>
                          </>
                        ) : isAgent ? (
                          <>
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>{msg.sender_name || 'เจ้าหน้าที่'}</span>
                          </>
                        ) : (
                          <span>{selectedThread.customer_name || 'ลูกค้า'}</span>
                        )}
                        <span>· {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isCustomer
                            ? 'bg-white text-gray-800 border border-gray-200/80 rounded-tl-sm'
                            : isAi
                            ? 'bg-purple-600 text-white rounded-tr-sm'
                            : 'bg-[#1F1F1F] text-white rounded-tr-sm'
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Canned Responses */}
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-gray-400 shrink-0">คำตอบด่วน:</span>
              {cannedResponses.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(res)}
                  className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] rounded-lg border border-gray-200/60 whitespace-nowrap transition cursor-pointer"
                >
                  {res.slice(0, 30)}...
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="พิมพ์ข้อความตอบกลับลูกค้าในฐานะเจ้าหน้าที่..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-black transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งข้อความ</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-12 text-gray-400 text-sm">
            เลือกรายการสนทนาทางด้านซ้ายเพื่อเปิดดูและตอบกลับ
          </div>
        )}
      </div>
    </div>
  );
};
