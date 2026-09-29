import React, { useState } from 'react';
import {
  Megaphone,
  Tag,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Eye,
  ExternalLink,
  Sparkles,
  Percent,
  Clock,
  Send,
  Smartphone,
  Share2,
  Calendar,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
} from 'lucide-react';
import { MarketingCampaign, PromoVoucher } from '../types';
import { Language } from '../lib/i18n';

interface MarketingCampaignManagerProps {
  campaigns: MarketingCampaign[];
  vouchers: PromoVoucher[];
  onAddCampaign: (campaign: MarketingCampaign) => void;
  onToggleCampaign: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onAddVoucher: (voucher: PromoVoucher) => void;
  onToggleVoucher: (voucherId: string) => void;
  onDeleteVoucher: (voucherId: string) => void;
  lang: Language;
}

export const MarketingCampaignManager: React.FC<MarketingCampaignManagerProps> = ({
  campaigns,
  vouchers,
  onAddCampaign,
  onToggleCampaign,
  onDeleteCampaign,
  onAddVoucher,
  onToggleVoucher,
  onDeleteVoucher,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'banners' | 'vouchers' | 'line_broadcast'>('banners');

  // New Banner Modal state
  const [isNewBannerOpen, setIsNewBannerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState<'HOT' | 'PROMO' | 'FLASH' | 'NEW' | 'EXCLUSIVE'>('HOT');
  const [newDiscountText, setNewDiscountText] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=800&q=80');
  const [newTargetLink, setNewTargetLink] = useState('customer-shop');

  // New Voucher state
  const [isNewVoucherOpen, setIsNewVoucherOpen] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherTitle, setVoucherTitle] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [minSpend, setMinSpend] = useState<number>(200);
  const [usageLimit, setUsageLimit] = useState<number>(100);

  // LINE OA Simulation state
  const [broadcastMessage, setBroadcastMessage] = useState(
    '🎉 EQUAL1 Special Privilege! สมาชิกรับส่วนลด 15% ทันทีเมื่อสั่งมินิมาร์ท หรือจองบริการสปาเล็บวันนี้ถึงวันอาทิตย์นี้เท่านั้น! พิมพ์โค้ด: EQUAL15'
  );
  const [broadcastSent, setBroadcastSent] = useState(false);

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const banner: MarketingCampaign = {
      id: 'camp-' + Date.now(),
      title: newTitle,
      subtitle: newSubtitle,
      badge: newBadge,
      type: 'banner',
      image_url: newImageUrl,
      target_link: newTargetLink,
      discount_text: newDiscountText || 'ส่วนลดพิเศษ',
      active: true,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      views_count: 0,
      clicks_count: 0,
    };

    onAddCampaign(banner);
    setIsNewBannerOpen(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewDiscountText('');
  };

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;

    const voucher: PromoVoucher = {
      id: 'vouch-' + Date.now(),
      code: voucherCode.toUpperCase().trim(),
      title: voucherTitle || `คูปองลด ${discountValue} ${discountType === 'fixed' ? 'บาท' : '%'}`,
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_spend: Number(minSpend),
      expires_at: new Date(Date.now() + 86400000 * 60).toISOString().slice(0, 10),
      usage_limit: Number(usageLimit),
      used_count: 0,
      active: true,
    };

    onAddVoucher(voucher);
    setIsNewVoucherOpen(false);
    setVoucherCode('');
    setVoucherTitle('');
  };

  const handleSendBroadcast = () => {
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      alert('ส่งบรอดแคสต์ LINE Official Account ถึงลูกค้า 1,420 คนเรียบร้อยแล้ว!');
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#8C887B]">
            EQUAL1 MARKETING & PROMOTIONAL BRAIN
          </span>
          <h2 className="text-2xl font-black text-[#171717] mt-1 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-[#E6A055]" />
            <span>ศูนย์จัดการโฆษณา ประชาสัมพันธ์ & คูปองส่งเสริมการขาย</span>
          </h2>
          <p className="text-xs text-[#7A7569] mt-0.5">
            จัดการแบนเนอร์หน้าร้าน คูปองส่วนลดแบบไดนามิก และตัวจำลองข้อความ LINE Official Account
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewBannerOpen(true)}
            className="px-4 py-2.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-xl transition shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างแบนเนอร์โฆษณา</span>
          </button>

          <button
            onClick={() => setIsNewVoucherOpen(true)}
            className="px-4 py-2.5 bg-[#171717] hover:bg-[#2C2A26] text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-2"
          >
            <Tag className="w-4 h-4" />
            <span>สร้างโค้ดส่วนลด</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6E4DD] mb-6">
        <button
          onClick={() => setActiveTab('banners')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'banners'
              ? 'border-[#E6A055] text-[#171717]'
              : 'border-transparent text-[#8C887B] hover:text-[#171717]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>แบนเนอร์ & แคมเปญโฆษณา ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vouchers')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'vouchers'
              ? 'border-[#E6A055] text-[#171717]'
              : 'border-transparent text-[#8C887B] hover:text-[#171717]'
          }`}
        >
          <Tag className="w-4 h-4 text-purple-600" />
          <span>โค้ดคูปองส่วนลด ({vouchers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('line_broadcast')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'line_broadcast'
              ? 'border-[#E6A055] text-[#171717]'
              : 'border-transparent text-[#8C887B] hover:text-[#171717]'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>LINE OA Broadcast Simulator</span>
        </button>
      </div>

      {/* TAB 1: BANNERS & CAMPAIGNS */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className={`bg-white rounded-3xl overflow-hidden border transition shadow-sm flex flex-col justify-between ${
                  camp.active ? 'border-[#E6E4DD]' : 'border-gray-200 opacity-60'
                }`}
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                    <img
                      src={camp.image_url}
                      alt={camp.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/80 text-white backdrop-blur uppercase tracking-wide">
                        {camp.badge}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#E6A055] text-black shadow">
                        {camp.discount_text}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => onToggleCampaign(camp.id)}
                        className="p-1 rounded-full bg-white/90 shadow text-xs font-bold"
                        title={camp.active ? 'ปิดการใช้งาน' : 'เปิดใช้งาน'}
                      >
                        {camp.active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-black text-[#171717] mb-1">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-[#7A7569] leading-relaxed mb-4">
                      {camp.subtitle}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#8C887B] pt-3 border-t border-[#F0EDE6]">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{camp.views_count?.toLocaleString() || 0} วิว</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{camp.clicks_count?.toLocaleString() || 0} คลิก</span>
                      </span>
                      <span>ถึง {camp.end_date}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#FAF8F5] border-t border-[#F0EDE6] flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8C887B]">
                    สถานะ: {camp.active ? '🟢 กำลังแสดงใน Customer App' : '⚪ หยุดชั่วคราว'}
                  </span>
                  <button
                    onClick={() => onDeleteCampaign(camp.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                    title="ลบแบนเนอร์"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: VOUCHERS */}
      {activeTab === 'vouchers' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E6E4DD] mb-6">
            <div>
              <h3 className="text-base font-black text-[#171717]">
                โค้ดคูปองส่งเสริมการขาย (Active Vouchers & Promo Codes)
              </h3>
              <p className="text-xs text-[#8C887B]">
                ลูกค้าสามารถพิมพ์โค้ดเหล่านี้ในหน้าสรุปตะกร้าเพื่อรับส่วนลดทันที
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.map((vouch) => (
              <div
                key={vouch.id}
                className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E6E4DD] hover:border-[#E6A055] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-xl bg-[#171717] text-white font-mono font-black text-sm tracking-wider">
                      {vouch.code}
                    </span>
                    <button
                      onClick={() => onToggleVoucher(vouch.id)}
                      className="text-xs"
                    >
                      {vouch.active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-[#171717] mb-1">
                    {vouch.title}
                  </h4>
                  <div className="text-xs text-[#7A7569] space-y-1 mb-4">
                    <div>
                      ส่วนลด:{' '}
                      <strong className="text-emerald-700 font-black">
                        {vouch.discount_type === 'fixed'
                          ? `฿${vouch.discount_value}`
                          : `${vouch.discount_value}%`}
                      </strong>
                    </div>
                    <div>ขั้นต่ำ: ฿{vouch.min_spend}</div>
                    <div>หมดอายุ: {vouch.expires_at}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6E4DD] flex items-center justify-between text-xs">
                  <span className="text-[#8C887B]">
                    ใช้ไปแล้ว: <strong>{vouch.used_count}</strong> / {vouch.usage_limit} สิทธิ์
                  </span>
                  <button
                    onClick={() => onDeleteVoucher(vouch.id)}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LINE OA BROADCAST SIMULATOR */}
      {activeTab === 'line_broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
            <h3 className="text-base font-black text-[#171717] mb-1">
              จำลองการส่งข้อความ LINE Official Account
            </h3>
            <p className="text-xs text-[#8C887B] mb-5">
              สร้างบรอดแคสต์ส่งถึงผู้ติดตาม LINE OA ของร้าน เพื่อกระตุ้นยอดขายแบบเรียลไทม์
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  ข้อความประชาสัมพันธ์ (Broadcast Text)
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-2xl p-3.5 text-xs text-[#171717] focus:border-[#E6A055] outline-none"
                />
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <strong className="block font-bold mb-1">ข้อมูลฐานสมาชิกร้าน EQUAL1</strong>
                <div>จำนวนผู้ติดตามในระบบ: 1,420 บัญชี</div>
                <div>อัตราการเปิดอ่านเฉลี่ย (Open Rate): 74.2%</div>
              </div>

              <button
                onClick={handleSendBroadcast}
                disabled={broadcastSent}
                className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{broadcastSent ? 'กำลังส่งบรอดแคสต์...' : 'ส่งบรอดแคสต์ทันที (Broadcast to LINE OA)'}</span>
              </button>
            </div>
          </div>

          {/* Smartphone Simulator Preview */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-[320px] bg-[#2C384A] rounded-[42px] p-3 shadow-2xl border-4 border-gray-800">
              {/* iPhone screen container */}
              <div className="bg-[#8C9FB5] rounded-[34px] overflow-hidden min-h-[520px] flex flex-col justify-between">
                {/* LINE Chat Header */}
                <div className="bg-[#243342] text-white px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E6A055] text-black font-black flex items-center justify-center text-xs">
                    E1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">EQUAL1 Official Store</h4>
                    <span className="text-[10px] text-gray-300">LINE Official Account</span>
                  </div>
                </div>

                {/* Chat Bubble Area */}
                <div className="p-3 space-y-3">
                  <div className="text-center text-[10px] text-white/70">วันนี้ 14:30 น.</div>

                  <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm text-xs text-[#171717] max-w-[260px] leading-relaxed">
                    <p>{broadcastMessage}</p>
                    <span className="text-[9px] text-gray-400 block text-right mt-1">14:30</span>
                  </div>

                  {/* Rich message preview card */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm max-w-[260px]">
                    <img
                      src="https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&q=80"
                      alt="Promo"
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-3">
                      <strong className="text-xs font-bold text-[#171717] block">
                        กดรับสิทธิ์โค้ด: EQUAL15
                      </strong>
                      <span className="text-[10px] text-[#7A7569] block mt-0.5">
                        ใช้ได้ทั้งมินิมาร์ทและซาลอน
                      </span>
                    </div>
                  </div>
                </div>

                {/* LINE Footer Input */}
                <div className="bg-white p-2.5 flex items-center gap-2 border-t text-gray-400 text-xs">
                  <span className="text-[11px] text-gray-400">พิมพ์ข้อความ...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Banner Modal */}
      {isNewBannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateBanner}
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E4DD] shadow-2xl relative space-y-4"
          >
            <h3 className="text-base font-black text-[#171717]">
              สร้างแบนเนอร์โฆษณาใหม่ (New Campaign Banner)
            </h3>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                หัวข้อแคมเปญ (Title)
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="เช่น Flash Sale ดับร้อน ลด 30%"
                className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                คำบรรยายย่อย (Subtitle)
              </label>
              <input
                type="text"
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="เช่น เมื่อซื้อกาแฟคู่เบเกอรี่ฮอกไกโด"
                className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  ป้ายกำกับ (Badge)
                </label>
                <select
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value as any)}
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
                >
                  <option value="HOT">HOT</option>
                  <option value="PROMO">PROMO</option>
                  <option value="FLASH">FLASH SALE</option>
                  <option value="NEW">NEW</option>
                  <option value="EXCLUSIVE">EXCLUSIVE</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  ข้อความลดราคา
                </label>
                <input
                  type="text"
                  value={newDiscountText}
                  onChange={(e) => setNewDiscountText(e.target.value)}
                  placeholder="เช่น ลดสูงสุด 35%"
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E4DD]">
              <button
                type="button"
                onClick={() => setIsNewBannerOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CCC] text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#E6A055] text-black font-bold rounded-xl text-xs"
              >
                บันทึกแบนเนอร์
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Voucher Modal */}
      {isNewVoucherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateVoucher}
            className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E6E4DD] shadow-2xl relative space-y-4"
          >
            <h3 className="text-base font-black text-[#171717]">
              สร้างโค้ดส่วนลดใหม่ (New Promo Code)
            </h3>

            <div>
              <label className="text-xs font-bold text-[#171717] block mb-1">
                รหัสโค้ดส่วนลด (เช่น SUMMER20)
              </label>
              <input
                type="text"
                required
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="เช่น SUMMER20"
                className="w-full uppercase font-mono bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  ประเภทส่วนลด
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
                >
                  <option value="fixed">บาท (Fixed ฿)</option>
                  <option value="percent">เปอร์เซ็นต์ (% Off)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  มูลค่าส่วนลด
                </label>
                <input
                  type="number"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  ยอดสั่งซื้อขั้นต่ำ (฿)
                </label>
                <input
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#171717] block mb-1">
                  จำนวนสิทธิ์ทั้งหมด
                </label>
                <input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  className="w-full bg-[#FAF8F5] border border-[#E6E4DD] rounded-xl px-3 py-2 text-xs text-[#171717] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E4DD]">
              <button
                type="button"
                onClick={() => setIsNewVoucherOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#CCC] text-xs font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#171717] text-white font-bold rounded-xl text-xs"
              >
                สร้างโค้ด
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
