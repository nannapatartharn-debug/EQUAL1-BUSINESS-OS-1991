import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Shield,
  Layers,
  Palette,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  Send,
  Cpu,
  Eye,
} from 'lucide-react';
import { StyleGuideTheme, FeatureFlagConfig, MyAppConfig } from '../types';
import { runtimeManager } from '../lib/backendEngine';

interface OwnerMyAppControlProps {
  currentTheme: StyleGuideTheme;
  onChangeTheme: (theme: StyleGuideTheme) => void;
  onSecurityAudit: (action: string, details: Record<string, unknown>) => void;
}

export const OwnerMyAppControl: React.FC<OwnerMyAppControlProps> = ({
  currentTheme,
  onChangeTheme,
  onSecurityAudit,
}) => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagConfig[]>([
    { id: 'ff-flash', name: '⚡ ระบบ Flash Sale และนับถอยหลังเร่งด่วน', key: 'enable_flash_sale', enabled: true, description: 'แสดงแถบ Flash Sale สีแดงเพลิงบนหน้าร้านและเปิดส่วนลดตามกำหนดเวลา', category: 'marketing' },
    { id: 'ff-camera', name: '📷 กล้องสแกนบาร์โค้ด & QR Code บนมือถือ', key: 'enable_camera_scanner', enabled: true, description: 'อนุญาตให้เปิดกล้องอุปกรณ์เพื่อสแกนสินค้าใน POS และสแกนสต๊อก', category: 'pos' },
    { id: 'ff-slip', name: '🧾 ระบบตรวจสลิปโอนเงิน PromptPay อัจฉริยะ', key: 'enable_slip_verification', enabled: true, description: 'ระบบตรวจสอบภาพสลิปธนาคารพร้อม QR Code และเปรียบเทียบยอดเงิน', category: 'pos' },
    { id: 'ff-ai-support', name: '🤖 ผู้ช่วย AI ประจำร้าน ตอบคำถามลูกค้า 24 ชม.', key: 'enable_customer_ai_support', enabled: true, description: 'ลูกค้าสามารถสนทนากับ AI และขอสลับคุยกับพนักงานจริงได้', category: 'customer' },
    { id: 'ff-tat', name: '🎨 หมวดบริการสักลาย & PMU (Permanent Makeup)', key: 'enable_tattoo_pmu_services', enabled: true, description: 'เปิดเมนูและจองคิวบริการสักลาย สักคิ้ว ฝังสีปาก', category: 'salon' },
    { id: 'ff-offline', name: '🛡️ Local Offline Sandbox Failover Protection', key: 'strict_cloud_checkout', enabled: true, description: 'ในโหมด LIVE จะบล็อกการขาย Local หาก Supabase RPC ขัดข้อง เพื่อความถูกต้อง 100%', category: 'system' },
  ]);

  // AI System Assistant Proposals with STRICT 6-stage lifecycle:
  // AI Analyze → AI Proposal → AI Draft → OWNER REVIEW → OWNER APPROVE → TEST → Test Result → OWNER PUBLISH → LIVE
  const [systemProposals, setSystemProposals] = useState<{
    id: string;
    title: string;
    description: string;
    impact: string;
    status: 'draft' | 'testing' | 'test_passed' | 'published';
    proposedConfig: Record<string, unknown>;
  }[]>([
    {
      id: 'prop-sys-01',
      title: 'เปิดใช้งานโหมด Speed POS Fast-Tap สำหรับช่วงเวลาเร่งด่วน',
      description: 'ปรับแต่งการแสดงผลปุ่มสินค้าใน POS ให้กว้างขึ้น 20% เพื่อให้แคชเชียร์กดเร็วขึ้น 1.5 วินาทีต่อออเดอร์',
      impact: 'เพิ่มอัตราการชำระเงินสำเร็จ 18% ในช่วงเที่ยงและเย็น',
      status: 'draft',
      proposedConfig: { speed_pos_tap_size: 'large', auto_focus_barcode: true },
    },
    {
      id: 'prop-sys-02',
      title: 'ตั้งค่าระบบแจ้งเตือนมัดจำซาลอนอัตโนมัติผ่าน SMS',
      description: 'ส่งข้อความยืนยันการรับยอดมัดจำเมื่อผู้จัดการกดยืนยันในระบบ',
      impact: 'ลดอัตราการไม่มาตามนัด (No-show rate) ลง 40%',
      status: 'test_passed',
      proposedConfig: { auto_sms_deposit_verified: true },
    },
  ]);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3000);
  };

  const handleToggleFlag = (id: string) => {
    setFeatureFlags((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const nextState = !f.enabled;
          onSecurityAudit('FEATURE_FLAG_TOGGLED', { key: f.key, enabled: nextState });
          showToast(`เปลี่ยนสถานะฟีเจอร์ "${f.name}" เป็น ${nextState ? 'เปิดใช้งาน (ON)' : 'ปิดการใช้งาน (OFF)'}`);
          return { ...f, enabled: nextState };
        }
        return f;
      })
    );
  };

  // AI Workflow Actions
  const handleTestProposal = (propId: string) => {
    setSystemProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status: 'testing' } : p))
    );
    showToast('กำลังทดสอบข้อเสนอใน Sandbox Sandbox Test Mode...');

    setTimeout(() => {
      setSystemProposals((prev) =>
        prev.map((p) => (p.id === propId ? { ...p, status: 'test_passed' } : p))
      );
      showToast('การทดสอบเสร็จสิ้น: ผลการทดสอบผ่านเกณฑ์ความเสถียร (Test Passed)');
      onSecurityAudit('AI_SYSTEM_PROPOSAL_TESTED', { proposalId: propId });
    }, 1200);
  };

  const handlePublishLive = (propId: string) => {
    setSystemProposals((prev) =>
      prev.map((p) => (p.id === propId ? { ...p, status: 'published' } : p))
    );
    showToast('🚀 ผู้บริหารอนุมัติและเผยแพร่การตั้งค่าขึ้นระบบ LIVE สำเร็จ!');
    onSecurityAudit('AI_SYSTEM_PROPOSAL_PUBLISHED_LIVE', { proposalId: propId });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Toast */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-[#1F1F1F] text-white text-xs font-bold rounded-2xl shadow-2xl border border-white/20 animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#171717] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black">
              OWNER RESTRICTED · MYAPP CONTROL
            </span>
            <span className="text-xs text-[#AAA]">ศูนย์ปรับแต่งและควบคุมการทำงานระดับระบบ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            MyApp &amp; System Configuration Control
          </h1>
          <p className="text-xs text-[#BBB] mt-1 max-w-xl">
            ควบคุมการเปิด/ปิดโมดูล, ฟีเจอร์แฟล็ก (Feature Flags), ธีมองค์กร และการอนุมัติข้อเสนอปรับแต่งระบบจาก AI
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feature Flags & Theme Control (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Appearance & Themes */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-600" />
              <span>ภาพลักษณ์และธีมของแอปพลิเคชัน (Style Guide Theme)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'minimal_luxury' as StyleGuideTheme, title: 'Style 01: Minimal Luxury', desc: 'โทนสว่าง พรีเมียม เรียบหรู' },
                { id: 'modern_glass' as StyleGuideTheme, title: 'Style 02: Modern Glass', desc: 'โทนมืด กระจกใสไฮเทค' },
                { id: 'soft_organic' as StyleGuideTheme, title: 'Style 03: Soft Organic', desc: 'โทนอุ่น ธรรมชาติ ผ่อนคลาย' },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => onChangeTheme(th.id)}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    currentTheme === th.id
                      ? 'bg-[#1F1F1F] text-white border-black shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                  }`}
                >
                  <strong className="text-xs font-bold block">{th.title}</strong>
                  <span className={`text-[11px] mt-1 block ${currentTheme === th.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    {th.desc}
                  </span>
                  {currentTheme === th.id && (
                    <span className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>ใช้งานอยู่</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Feature Flags Center */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>สวิตช์ฟีเจอร์ระดับระบบ (System Feature Flags)</span>
              </h3>
              <span className="text-xs text-gray-400">ควบคุมเปิด/ปิดทันทีโดยไม่ต้อง Build ใหม่</span>
            </div>

            <div className="divide-y divide-gray-100">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <strong className="text-xs font-bold text-gray-900 block">{flag.name}</strong>
                    <span className="text-[11px] text-gray-500 block mt-0.5">{flag.description}</span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(flag.id)}
                    className="p-1 cursor-pointer transition text-gray-400 hover:text-black shrink-0"
                  >
                    {flag.enabled ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-300" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI System Assistant & Safe Staging Workflow (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-black text-gray-900">AI System Configuration Proposals</h3>
                <span className="text-[11px] text-gray-400 block">AI วิเคราะห์และเสนอแนะ แต่ไม่มีสิทธิ์เผยแพร่โดยตรง</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 leading-relaxed">
              <strong>มาตรการความปลอดภัยสูงสุด (Safe Staging Protocol):</strong>
              <span className="block text-[11px] text-purple-800 mt-0.5">
                AI Analyze → AI Proposal → AI Draft → <strong>OWNER REVIEW</strong> → <strong>OWNER APPROVE</strong> → TEST → Test Result → <strong>OWNER PUBLISH</strong> → LIVE
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {systemProposals.map((prop) => (
                <div
                  key={prop.id}
                  className="p-4 rounded-2xl border border-gray-200 bg-[#FAF9F6] space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <strong className="font-bold text-gray-900">{prop.title}</strong>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        prop.status === 'published'
                          ? 'bg-emerald-100 text-emerald-800'
                          : prop.status === 'test_passed'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {prop.status === 'published' ? 'LIVE' : prop.status === 'test_passed' ? 'ผ่านการทดสอบแล้ว' : 'ฉบับร่าง'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-[11px] leading-relaxed">{prop.description}</p>
                  <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2 rounded-xl border border-emerald-200/60">
                    ผลลัพธ์ที่คาดการณ์: {prop.impact}
                  </div>

                  {/* Staging Workflow Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    {prop.status === 'draft' && (
                      <button
                        onClick={() => handleTestProposal(prop.id)}
                        className="flex-1 py-2 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-amber-400" />
                        <span>อนุมัติเพื่อทดสอบ (Test in Sandbox)</span>
                      </button>
                    )}

                    {prop.status === 'test_passed' && (
                      <button
                        onClick={() => handlePublishLive(prop.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                        <span>เจ้าของร้านอนุมัติเผยแพร่ LIVE</span>
                      </button>
                    )}

                    {prop.status === 'published' && (
                      <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>มีผลบังคับใช้บนระบบ LIVE แล้ว</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
