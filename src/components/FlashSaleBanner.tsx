import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Clock,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Product, CartItem } from '../types';

interface FlashSaleBannerProps {
  products: Product[];
  onAddToCart: (product: Product, priceOverride?: number) => void;
  onViewAllFlashSale?: () => void;
}

export const FlashSaleBanner: React.FC<FlashSaleBannerProps> = ({
  products,
  onAddToCart,
  onViewAllFlashSale,
}) => {
  // Live Countdown Timer (Ticks every second down to midnight)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 4,
    minutes: 32,
    seconds: 48,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashSaleItems = products.filter((p) => p.is_flash_sale && p.flash_sale_price);

  if (flashSaleItems.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1F1F1F] via-[#2A2A28] to-[#1F1F1F] text-white p-5 sm:p-6 shadow-xl border border-amber-500/20 mb-6">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar with Live Countdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-black font-black shadow-md animate-pulse">
            <Zap className="w-4 h-4 fill-black text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-1.5">
                FLASH SALE วันนี้ ⚡
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                จำกัดจำนวน
              </span>
            </div>
            <p className="text-xs text-amber-200/80">ดีลพิเศษลดสูงสุด 40% เฉพาะรอบเวลานี้เท่านั้น</p>
          </div>
        </div>

        {/* Live Timer Boxes */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-2xl border border-white/10">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-gray-300 font-medium">จบใน:</span>
          <div className="flex items-center gap-1 font-mono text-xs font-black">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-amber-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-amber-400">:</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white animate-pulse">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Flash Sale Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {flashSaleItems.slice(0, 4).map((item) => {
          const regularPrice = item.price;
          const flashPrice = item.flash_sale_price || regularPrice;
          const discountPct = Math.round(((regularPrice - flashPrice) / regularPrice) * 100);
          const limit = item.flash_sale_stock_limit || 20;
          const sold = item.flash_sale_sold_count || 10;
          const progressPct = Math.min(100, Math.round((sold / limit) * 100));

          return (
            <div
              key={item.id}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3.5 transition group flex flex-col justify-between"
            >
              <div>
                <div className="relative mb-3 overflow-hidden rounded-xl bg-black/40 aspect-square">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10px] shadow">
                    -{discountPct}%
                  </div>
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-amber-400 font-bold text-[9px] flex items-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 fill-amber-400" />
                    <span>HOT</span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white line-clamp-1 mb-1" title={item.name}>
                  {item.name}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-base font-black text-amber-400 font-mono">
                    ฿{flashPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 line-through font-mono">
                    ฿{regularPrice.toLocaleString()}
                  </span>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                    <span>ขายแล้ว {sold}/{limit} ชิ้น</span>
                    <span className="text-amber-400 font-bold">เหลือ {limit - sold}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => onAddToCart(item, flashPrice)}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>คว้าดีลนี้ (฿{flashPrice})</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
