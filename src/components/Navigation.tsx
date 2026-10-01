import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  LayoutDashboard,
  Globe,
  Coins,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Briefcase,
  Coffee,
  Calendar,
  Layers,
  History,
  FileCheck2,
  Megaphone,
  Lock,
  Unlock,
  Shield,
  Palette,
  LogOut,
  Zap,
} from 'lucide-react';
import { Language, getTranslation } from '../lib/i18n';
import { UserRole, StyleGuideTheme, RuntimeEnvironmentMode } from '../types';
import { THEMES } from '../lib/theme';
import { runtimeManager } from '../lib/backendEngine';

interface NavigationProps {
  currentView: string;
  onSelectView: (view: string) => void;
  currentRole: UserRole;
  currentStaffName?: string;
  onChangeRole: (role: UserRole) => void;
  currentLang: Language;
  onChangeLang: (lang: Language) => void;
  activeCashShift: boolean;
  onOpenCashModal: () => void;
  onOpenAiBrain: () => void;
  cartCount: number;
  onOpenAuthSecurity?: () => void;
  isSessionLocked?: boolean;
  // Security & Owner Separation props:
  isOwnerAuthenticated: boolean;
  onRequestOwnerLogin: () => void;
  onOwnerLogout: () => void;
  // Theme Switching props:
  currentTheme: StyleGuideTheme;
  onChangeTheme: (theme: StyleGuideTheme) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onSelectView,
  currentRole,
  currentStaffName = 'คุณนันท์นภัส (Owner)',
  onChangeRole,
  currentLang,
  onChangeLang,
  activeCashShift,
  onOpenCashModal,
  onOpenAiBrain,
  cartCount,
  onOpenAuthSecurity,
  isSessionLocked,
  isOwnerAuthenticated,
  onRequestOwnerLogin,
  onOwnerLogout,
  currentTheme,
  onChangeTheme,
}) => {
  const t = (key: string) => getTranslation(currentLang, key);
  const theme = THEMES[currentTheme];
  const [runtimeMode, setRuntimeMode] = useState<RuntimeEnvironmentMode>(runtimeManager.getMode());

  const handleRoleSelectChange = (newRole: UserRole) => {
    if (newRole === 'owner') {
      if (!isOwnerAuthenticated) {
        onRequestOwnerLogin();
        return;
      }
    }
    onChangeRole(newRole);
  };

  const handleOwnerProtectedNav = (targetView: string) => {
    const ownerOnlyViews = ['dashboard', 'finance', 'system-health', 'marketing'];
    if (ownerOnlyViews.includes(targetView) && !isOwnerAuthenticated) {
      onRequestOwnerLogin();
      return;
    }
    onSelectView(targetView);
  };

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-200 border-b ${theme.bgHeader} shadow-sm backdrop-blur-md`}>
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#1F1F1F] text-white font-black flex items-center justify-center text-xs shadow-md">
            E1
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-sm">
              EQUAL1
            </span>
            <span className="hidden sm:inline-block text-[11px] opacity-60 border-l border-current pl-2">
              Business Operating System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Style Guide Theme Switcher (from Reference Graphic Board) */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-xl p-0.5 border border-black/10 dark:border-white/15">
            <Palette className="w-3.5 h-3.5 ml-2 opacity-60" />
            <select
              value={currentTheme}
              onChange={(e) => onChangeTheme(e.target.value as StyleGuideTheme)}
              className="bg-transparent text-xs px-2 py-1 outline-none font-semibold cursor-pointer"
              title="สลับ Style Guide ตามเรฟเฟอเรนซ์"
            >
              <option value="minimal_luxury" className="text-black bg-white">Style 01: Minimal Luxury (Light)</option>
              <option value="modern_glass" className="text-black bg-white">Style 02: Modern Glass (Dark)</option>
              <option value="soft_organic" className="text-black bg-white">Style 03: Soft Organic (Warm)</option>
            </select>
          </div>

          {/* Cash Shift Indicator */}
          {currentRole !== 'customer' && (
            <button
              onClick={onOpenCashModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                activeCashShift
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}
              title="จัดการกะเงินสด"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>{activeCashShift ? 'กะเงินสด: เปิด' : 'กะเงินสด: ปิด'}</span>
            </button>
          )}

          {/* AI Brain Button (Owner only or gated) */}
          {isOwnerAuthenticated && (
            <button
              onClick={onOpenAiBrain}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#9333EA] to-[#6366F1] text-white font-bold text-xs hover:opacity-95 shadow transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">AI Business Brain</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center bg-black/5 dark:bg-white/10 rounded-xl p-0.5 border border-black/10 dark:border-white/15">
            <Globe className="w-3.5 h-3.5 ml-2 opacity-60" />
            <select
              value={currentLang}
              onChange={(e) => onChangeLang(e.target.value as Language)}
              className="bg-transparent text-xs px-2 py-1 outline-none font-medium cursor-pointer"
            >
              <option value="th" className="text-black bg-white">🇹🇭 TH</option>
              <option value="en" className="text-black bg-white">🇬🇧 EN</option>
              <option value="zh" className="text-black bg-white">🇨🇳 ZH</option>
              <option value="ja" className="text-black bg-white">🇯🇵 JA</option>
            </select>
          </div>

          {/* RUNTIME ENVIRONMENT INDICATOR & TOGGLE (LIVE vs TEST) */}
          <button
            onClick={() => {
              const next = runtimeMode === 'LIVE' ? 'TEST' : 'LIVE';
              runtimeManager.setMode(next);
              setRuntimeMode(next);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
              runtimeMode === 'LIVE'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="สลับโหมดสภาพแวดล้อม: LIVE (Supabase Cloud) / TEST (Sandbox)"
          >
            <span className={`w-2 h-2 rounded-full ${runtimeMode === 'LIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{runtimeMode === 'LIVE' ? '🔴 LIVE' : '🟡 TEST'}</span>
          </button>

          {/* OWNER STATUS & STRICT SEPARATION BUTTONS */}
          {isOwnerAuthenticated ? (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1 text-xs">
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-extrabold text-amber-900 dark:text-amber-300 hidden sm:inline">
                👑 โหมดเจ้าของ (คุณนันท์นภัส)
              </span>
              <button
                onClick={onOwnerLogout}
                className="ml-1 p-1 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg transition font-bold flex items-center gap-1"
                title="ล็อคหน้าจอ & ออกจากโหมดเจ้าของร้านเพื่อความปลอดภัย"
              >
                <Lock className="w-3 h-3" />
                <span className="text-[11px]">ล็อค</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onRequestOwnerLogin}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1F1F1F] text-white hover:bg-black rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              title="เข้าสู่ระบบสำหรับเจ้าของร้าน (เฉพาะผู้มีรหัสผ่าน)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>เข้าสู่ระบบเจ้าของร้าน</span>
            </button>
          )}

          {/* Quick Staff Shift Switcher */}
          {onOpenAuthSecurity && (
            <button
              onClick={onOpenAuthSecurity}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/10 hover:bg-black/10 text-current border border-black/10 dark:border-white/15 transition cursor-pointer"
              title="สลับกะพนักงานด้วย PIN 4 หลัก"
            >
              <span>กะ: {currentStaffName.split(' ')[0]}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Role-Specific Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto no-scrollbar py-2 text-xs sm:text-sm">
        <nav className="flex items-center gap-1 sm:gap-2">
          {currentRole === 'customer' || currentView.startsWith('customer-') ? (
            <>
              <button
                onClick={() => onSelectView('customer-shop')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'customer-shop'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>มินิมาร์ท & ช้อป</span>
              </button>

              <button
                onClick={() => onSelectView('customer-beauty')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'customer-beauty'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>จองบริการ ซาลอน & สัก</span>
              </button>

              <button
                onClick={() => onSelectView('customer-orders')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'customer-orders'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <History className="w-4 h-4" />
                <span>ออเดอร์ & นัดหมายของฉัน</span>
              </button>

              <button
                onClick={() => onSelectView('customer-cart')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium relative transition cursor-pointer ${
                  currentView === 'customer-cart'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ตะกร้า</span>
                {cartCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Backoffice / Staff / Owner Navigation */}
              {/* OWNER DASHBOARD (Visible to Owner ONLY) */}
              {isOwnerAuthenticated ? (
                <button
                  onClick={() => handleOwnerProtectedNav('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-[#1F1F1F] text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-500" />
                  <span>ศูนย์ควบคุมธุรกิจ (Owner)</span>
                </button>
              ) : (
                <button
                  onClick={onRequestOwnerLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-gray-400 hover:text-gray-700 hover:bg-black/5 transition cursor-pointer"
                  title="ต้องเข้าสู่ระบบเจ้าของร้านก่อนจึงจะเปิดหน้านี้ได้"
                >
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Dashboard (เฉพาะเจ้าของ)</span>
                </button>
              )}

              {/* TEAM OS & MY WORK (Available to Staff & Owner) */}
              <button
                onClick={() => onSelectView('team-os')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'team-os'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-500" />
                <span>Team OS &amp; My Work</span>
              </button>

              {/* POS TERMINAL */}
              <button
                onClick={() => onSelectView('pos')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'pos'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>POS ขายหน้าร้าน</span>
              </button>

              {/* SALON QUEUE & SERVICES */}
              <button
                onClick={() => onSelectView('salon-queue')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'salon-queue'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>คิวบริการ &amp; ซาลอน</span>
              </button>

              {/* ORDERS KANBAN */}
              <button
                onClick={() => onSelectView('orders-kanban')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'orders-kanban'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>จัดการออเดอร์</span>
              </button>

              {/* INVENTORY */}
              <button
                onClick={() => onSelectView('inventory')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'inventory'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <span>คลังสินค้า &amp; สต๊อก</span>
              </button>

              {/* SLIP VERIFICATION */}
              <button
                onClick={() => onSelectView('slip-verification')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'slip-verification'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                <span>ตรวจสลิป</span>
              </button>

              {/* CUSTOMER SUPPORT WORKSPACE */}
              <button
                onClick={() => onSelectView('support')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'support'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Briefcase className="w-4 h-4 text-sky-500" />
                <span>แชทดูแลลูกค้า</span>
              </button>

              {/* STAFF LEARNING & SOP WORKSPACE */}
              <button
                onClick={() => onSelectView('learning')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  currentView === 'learning'
                    ? 'bg-[#1F1F1F] text-white shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>อบรม &amp; SOP</span>
              </button>

              {/* OWNER-ONLY TABS */}
              {isOwnerAuthenticated && (
                <>
                  <button
                    onClick={() => onSelectView('owner-control')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      currentView === 'owner-control'
                        ? 'bg-[#1F1F1F] text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>ศูนย์สั่งการ &amp; อนุมัติ</span>
                  </button>

                  <button
                    onClick={() => onSelectView('owner-myapp')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      currentView === 'owner-myapp'
                        ? 'bg-[#1F1F1F] text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>MyApp &amp; ควบคุม AI</span>
                  </button>

                  <button
                    onClick={() => onSelectView('finance')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      currentView === 'finance'
                        ? 'bg-[#1F1F1F] text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <span>การเงิน &amp; กำไร</span>
                  </button>

                  <button
                    onClick={() => onSelectView('marketing')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      currentView === 'marketing'
                        ? 'bg-[#1F1F1F] text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <Megaphone className="w-4 h-4 text-[#889A7B]" />
                    <span>แคมเปญ &amp; แฟลชเซลล์</span>
                  </button>

                  <button
                    onClick={() => onSelectView('system-health')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                      currentView === 'system-health'
                        ? 'bg-[#1F1F1F] text-white shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>ความปลอดภัย</span>
                  </button>
                </>
              )}
            </>
          )}
        </nav>

        {/* Customer App Shortcut if in Backoffice */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (currentView.startsWith('customer-')) {
                onSelectView(isOwnerAuthenticated ? 'dashboard' : 'pos');
              } else {
                onSelectView('customer-shop');
              }
            }}
            className="px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Store className="w-3.5 h-3.5" />
            <span>{currentView.startsWith('customer-') ? 'กลับระบบหลังบ้าน' : 'เปิดมุมมองลูกค้า (Client)'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
