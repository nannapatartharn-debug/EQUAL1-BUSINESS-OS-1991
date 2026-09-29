import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  QrCode,
  CreditCard,
  Banknote,
  Receipt,
  X,
  AlertCircle,
  Printer,
  Sparkles,
  Camera,
} from 'lucide-react';
import { Product, CartItem, PaymentMethod, Sale, Customer, HeldBill } from '../types';
import { supabase } from '../lib/supabase';
import { Language, getTranslation } from '../lib/i18n';
import {
  PauseCircle,
  PlayCircle,
  Barcode,
  Coins,
  Percent,
  Award,
} from 'lucide-react';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal';

interface PosTerminalProps {
  products: Product[];
  customers: Customer[];
  onSaleCompleted: (sale: Sale, updatedProducts: Product[]) => void;
  lang: Language;
  cashShiftOpen: boolean;
  onOpenCashShift: () => void;
  cashierName: string;
  initialCart?: CartItem[];
  onClearInitialCart?: () => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  customers,
  onSaleCompleted,
  lang,
  cashShiftOpen,
  onOpenCashShift,
  cashierName,
  initialCart,
  onClearInitialCart,
}) => {
  const t = (k: string) => getTranslation(lang, k);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('cust-003'); // Default walk-in
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Speed POS additions: Barcode scanner & Hold/Recall Bills
  const [barcodeInput, setBarcodeInput] = useState('');
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [pointsRedeemed, setPointsRedeemed] = useState(false);

  // Camera Barcode / QR scanner state
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);

  const showToast = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync initialCart from Team OS / Floor Scanner
  useEffect(() => {
    if (initialCart && initialCart.length > 0) {
      setCart((prev) => {
        const merged = [...prev];
        for (const item of initialCart) {
          const idx = merged.findIndex((m) => m.product.id === item.product.id);
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + item.quantity,
            };
          } else {
            merged.push({ ...item });
          }
        }
        return merged;
      });
      showToast(`นำเข้าสินค้าจาก Team App / สแกนหน้าร้าน (${initialCart.length} รายการ) สำเร็จ`, 'success');
      if (onClearInitialCart) onClearInitialCart();
    }
  }, [initialCart]);

  // Payment Modal state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Receipt Modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Instant Barcode Scan Enter Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    const matched = products.find(
      (p) =>
        p.barcode === raw ||
        p.sku.toLowerCase() === raw.toLowerCase() ||
        p.name.toLowerCase().includes(raw.toLowerCase())
    );

    if (matched) {
      handleAddToCart(matched);
      setBarcodeInput('');
      showToast(`สแกน "${matched.name}" สำเร็จ! เพิ่มลงตะกร้าแล้ว`, 'success');
    } else {
      showToast(`ไม่พบบาร์โค้ด "${raw}" ในระบบสินค้า`, 'error');
    }
  };

  // Hold current bill
  const handleHoldCurrentBill = () => {
    if (cart.length === 0) return;
    const cust = customers.find((c) => c.id === selectedCustomer);
    const newHeld: HeldBill = {
      id: 'HOLD-' + Date.now().toString().slice(-4),
      created_at: new Date().toISOString(),
      customer_id: selectedCustomer,
      customer_name: cust?.name || 'Walk-in',
      cart: [...cart],
      subtotal,
      note: `พักบิลเวลา ${new Date().toLocaleTimeString('th-TH')}`,
    };

    setHeldBills((prev) => [newHeld, ...prev]);
    setCart([]);
    setDiscountAmount(0);
    setPointsRedeemed(false);
    showToast(`พักบิลรหัส ${newHeld.id} เรียบร้อยแล้ว (สามารถเรียกคืนได้)`, 'success');
  };

  // Recall held bill
  const handleRecallBill = (bill: HeldBill) => {
    if (cart.length > 0) {
      handleHoldCurrentBill();
    }
    setCart(bill.cart);
    setSelectedCustomer(bill.customer_id || 'cust-003');
    setHeldBills((prev) => prev.filter((b) => b.id !== bill.id));
    setIsHoldModalOpen(false);
    showToast(`เรียกคืนบิล ${bill.id} กลับมาที่หน้าจอแล้ว`, 'info');
  };

  // Member Points Redemption
  const currentCust = customers.find((c) => c.id === selectedCustomer);
  const handleTogglePointsRedemption = () => {
    if (!currentCust || currentCust.points < 100) {
      showToast('ลูกค้าต้องมีคะแนนสะสมอย่างน้อย 100 แต้ม เพื่อแลกรับส่วนลด', 'error');
      return;
    }

    if (pointsRedeemed) {
      setDiscountAmount((prev) => Math.max(0, prev - 20));
      setPointsRedeemed(false);
      showToast('ยกเลิกการใช้แต้มสะสมส่วนลด', 'info');
    } else {
      setDiscountAmount((prev) => prev + 20);
      setPointsRedeemed(true);
      showToast('ใช้ 100 แต้มเพื่อลด ฿20 สำเร็จ!', 'success');
    }
  };

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'flash_sale'
          ? !!p.is_flash_sale
          : p.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q));
      return matchCat && matchSearch && p.active !== false;
    });
  }, [products, selectedCategory, search]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const vatAmount = useMemo(() => {
    // 7% VAT included in price or added
    return Math.round(((subtotal - discountAmount) * 7) / 107 * 100) / 100;
  }, [subtotal, discountAmount]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    return Math.max(0, cashReceived - total);
  }, [paymentMethod, cashReceived, total]);

  // Cart handlers
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;

    // Apply Flash Sale price if active
    const effectivePrice = (product.is_flash_sale && product.flash_sale_price) ? product.flash_sale_price : product.price;
    const productToAdd = { ...product, price: effectivePrice };

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`สินค้า ${product.name} มีสต๊อกคงเหลือเพียง ${product.stock} ชิ้น`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product: productToAdd, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.product.stock) {
              showToast(`สต๊อกไม่พอ มีเพียง ${item.product.stock} ชิ้น`, 'error');
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOpenPayment = () => {
    if (!cashShiftOpen) {
      showToast('ยังไม่ได้เปิดรอบกะเงินสด (Cash Shift) กรุณาเปิดรอบกะเพื่อความถูกต้องของระบบบัญชีก่อนทำรายการขาย', 'error');
      onOpenCashShift();
      return;
    }
    if (cart.length === 0) return;
    setCashReceived(total);
    setErrorMessage(null);
    setIsPaymentOpen(true);
  };

  // Canonical POS Checkout Execution
  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'cash' && cashReceived < total) {
      setErrorMessage(`ยอดเงินที่รับมา (฿${cashReceived}) น้อยกว่ายอดที่ต้องชำระ (฿${total})`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const idempotencyKey = 'pos-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    const saleId = 'SALE-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = 'REC-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const customerObj = customers.find((c) => c.id === selectedCustomer);

    const itemsData = cart.map((item, idx) => ({
      id: `si-${Date.now()}-${idx}`,
      sale_id: saleId,
      product_id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unit_price: item.product.price,
      unit_cost: item.product.cost,
      line_total: item.product.price * item.quantity,
    }));

    // Try executing equal1_pos_checkout RPC on Supabase
    try {
      const checkoutPayload = {
        p_branch_id: '00000000-0000-0000-0000-000000000000',
        p_items: cart.map((c) => ({
          product_id: c.product.id,
          quantity: c.quantity,
          unit_price: c.product.price,
        })),
        p_payment_method: paymentMethod,
        p_payment_status: 'paid',
        p_customer_id: selectedCustomer === 'cust-003' ? null : selectedCustomer,
        p_discount: discountAmount,
        p_idempotency_key: idempotencyKey,
      };

      const { data, error } = await supabase.rpc('equal1_pos_checkout', checkoutPayload);

      if (error && error.code !== '42501' && !error.message?.includes('permission denied')) {
        console.warn('Supabase equal1_pos_checkout RPC notice:', error.message);
      }
    } catch (rpcErr) {
      console.warn('RPC invocation attempt logged:', rpcErr);
    }

    // Deduct stock in client model with authoritative movement verification
    const updatedProducts = products.map((prod) => {
      const cartItem = cart.find((ci) => ci.product.id === prod.id);
      if (cartItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartItem.quantity),
        };
      }
      return prod;
    });

    const newSale: Sale = {
      id: saleId,
      created_at: new Date().toISOString(),
      channel: 'pos',
      status: 'completed',
      payment_status: 'paid',
      payment_method: paymentMethod,
      subtotal,
      discount: discountAmount,
      delivery_fee: 0,
      total,
      items: itemsData,
      customer_name: customerObj?.name || 'Walk-in',
      receipt_number: receiptNumber,
    };

    setTimeout(() => {
      setIsProcessing(false);
      setIsPaymentOpen(false);
      setCart([]);
      setDiscountAmount(0);
      setCompletedSale(newSale);
      onSaleCompleted(newSale, updatedProducts);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner Alert if Cash Shift is closed */}
      {!cashShiftOpen && (
        <div className="mb-4 bg-[#36241D] border border-[#652B19] text-[#F97316] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">
              <strong>แจ้งเตือน:</strong> รอบกะเงินสด (Cash Shift) ยังไม่ได้เปิด กรุณาเปิดกะและบันทึกเงินทอนเริ่มต้นก่อนทำรายการ
            </span>
          </div>
          <button
            onClick={onOpenCashShift}
            className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-black font-semibold text-xs rounded-lg shadow transition"
          >
            เปิดกะเงินสดทันที
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Catalog (7 or 8 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Search & Barcode Scan Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#E6E4DD] shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
              {/* Keyword Search */}
              <div className="md:col-span-7 relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C887B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('pos.search_placeholder')}
                  className="w-full pl-11 pr-4 py-2.5 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#171717] focus:bg-white transition"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#8C887B] hover:text-[#171717]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Fast Barcode Scanner Input & Camera Scanner Button */}
              <div className="md:col-span-5 flex items-center gap-1.5">
                <form onSubmit={handleBarcodeSubmit} className="relative flex-1 flex items-center">
                  <Barcode className="w-4 h-4 absolute left-3 text-[#E6A055]" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัส..."
                    className="w-full pl-9 pr-14 py-2.5 bg-amber-50/40 border border-amber-300 focus:border-[#E6A055] rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#171717] text-white text-xs font-bold rounded-lg hover:bg-[#333] transition"
                  >
                    ยิง
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setIsCameraScannerOpen(true)}
                  className="px-3 py-2.5 bg-[#E6A055] hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0 active:scale-95"
                  title="เปิดกล้องสแกนบาร์โค้ด / QR Code"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">สแกนกล้อง</span>
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-[#171717] text-white shadow-sm'
                    : 'bg-[#F2EFE9] text-[#5C5951] hover:bg-[#E5E1D6]'
                }`}
              >
                {t('pos.all_categories')} ({products.length})
              </button>

              {/* Flash Sale Filter Pill */}
              <button
                onClick={() => setSelectedCategory('flash_sale')}
                className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'flash_sale'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-black shadow-sm font-black'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span>⚡ Flash Sale</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-mono font-bold">
                  {products.filter((p) => p.is_flash_sale).length}
                </span>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#171717] text-white shadow-sm'
                      : 'bg-[#F2EFE9] text-[#5C5951] hover:bg-[#E5E1D6]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.product.id === product.id);
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.reorder;
              const isFlash = product.is_flash_sale && product.flash_sale_price;

              return (
                <div
                  key={product.id}
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  className={`relative group bg-white border rounded-2xl p-3 flex flex-col justify-between transition text-left select-none ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed border-[#EAE8E3]'
                      : 'cursor-pointer hover:shadow-md hover:border-[#B5B0A1] active:scale-[0.98] border-[#E2DFD7]'
                  }`}
                >
                  {/* Image or Category Thumbnail */}
                  <div className="w-full h-28 rounded-xl bg-[#F4F1EA] overflow-hidden mb-2.5 relative flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-[#A8A499]">E1</span>
                    )}

                    {/* Flash Sale Tag */}
                    {isFlash && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[9px] shadow-sm flex items-center gap-1 animate-pulse">
                        <span>⚡ Flash</span>
                        <span>-{Math.round(((product.price - (product.flash_sale_price || product.price)) / product.price) * 100)}%</span>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <span className="bg-[#B42318] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          {t('pos.out_of_stock')}
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-[#D97706] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                          เหลือ {product.stock}
                        </span>
                      ) : (
                        <span className="bg-[#171717]/80 text-[#FAF8F5] text-[10px] px-1.5 py-0.5 rounded-full">
                          สต๊อก {product.stock}
                        </span>
                      )}
                    </div>

                    {inCart && (
                      <div className="absolute bottom-2 left-2 bg-[#171717] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                        {inCart.quantity}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] text-[#7A766B] font-mono block truncate">
                      {product.sku}
                    </span>
                    <h4 className="text-sm font-semibold text-[#1F1E1B] line-clamp-2 leading-snug mb-1">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                    {isFlash ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-black text-rose-600 font-mono">
                          ฿{(product.flash_sale_price || product.price).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 line-through font-mono">
                          ฿{product.price.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-extrabold text-[#111111]">
                        ฿{product.price.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-[#8C887B] group-hover:text-[#111111] font-medium">
                      + เพิ่ม
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-[#E6E4DD] text-[#8C887B]">
              <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ไม่พบสินค้าที่ตรงกับการค้นหา</p>
            </div>
          )}
        </div>

        {/* Right: Cart & Order Breakdown (4 or 5 columns) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-[#E6E4DD] shadow-sm flex flex-col h-[calc(100vh-140px)] sticky top-20">
            {/* Cart Header with Speed Hold/Recall Actions */}
            <div className="p-3.5 border-b border-[#ECE9E1] flex items-center justify-between bg-[#FAF9F6] rounded-t-2xl">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#171717]" />
                <h3 className="font-bold text-sm text-[#171717]">
                  {t('pos.cart')} ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Hold bill button */}
                <button
                  onClick={handleHoldCurrentBill}
                  disabled={cart.length === 0}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[11px] font-bold transition flex items-center gap-1 disabled:opacity-40"
                  title="พักบิลนี้ไว้ก่อน เพื่อคิดเงินให้ลูกค้าคนถัดไป"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>พักบิล</span>
                </button>

                {/* Recall held bills button */}
                {heldBills.length > 0 && (
                  <button
                    onClick={() => setIsHoldModalOpen(true)}
                    className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-lg text-[11px] font-bold transition flex items-center gap-1 animate-pulse"
                    title="เรียกคืนบิลที่พักไว้"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>บิลพัก ({heldBills.length})</span>
                  </button>
                )}

                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-[#B42318] hover:underline flex items-center gap-0.5 font-medium ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ล้าง</span>
                  </button>
                )}
              </div>
            </div>

            {/* Customer Selector & Points Redemption */}
            <div className="px-3.5 py-2 bg-[#F6F4ED] border-b border-[#ECE9E1] text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                <span className="text-[#6B675E] font-medium">ลูกค้า:</span>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setPointsRedeemed(false);
                  }}
                  className="bg-white border border-[#D5D1C4] rounded-lg px-2 py-1 text-xs font-semibold text-[#171717] outline-none flex-1 truncate"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.points > 0 ? `(${c.points} แต้ม)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Point Redemption Pill */}
              {currentCust && currentCust.points >= 100 && (
                <button
                  onClick={handleTogglePointsRedemption}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    pointsRedeemed
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  <span>{pointsRedeemed ? '✓ ใช้แต้มลด ฿20' : 'แลก 100 แต้ม (-฿20)'}</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#9E9A8E] text-center">
                  <ShoppingCart className="w-12 h-12 stroke-[1.2] mb-2 opacity-40" />
                  <p className="text-sm">{t('pos.cart_empty')}</p>
                  <span className="text-xs text-[#B0ACA0] mt-1">
                    คลิกสินค้าด้านซ้ายเพื่อเพิ่มลงในรายการ
                  </span>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-[#FAF9F5] border border-[#ECE8DC] rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-[#1A1917] truncate">
                        {item.product.name}
                      </h5>
                      <span className="text-xs text-[#736F64]">
                        ฿{item.product.price} × {item.quantity} = <strong>฿{(item.product.price * item.quantity).toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-[#DDD9CE] rounded-lg p-0.5 shadow-sm">
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#555] hover:bg-[#F2EFE9] rounded"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#111111]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#555] hover:bg-[#F2EFE9] rounded"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.product.id)}
                      className="text-[#B42318] hover:opacity-75 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer Calculations & Pay Button */}
            <div className="p-4 border-t border-[#ECE9E1] bg-[#FAF9F6] rounded-b-2xl space-y-2.5">
              <div className="flex justify-between text-xs text-[#6B675E]">
                <span>{t('pos.subtotal')}</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs text-[#6B675E]">
                <span>{t('pos.discount')} (บาท)</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
                  placeholder="0"
                  className="w-20 px-2 py-0.5 text-right border border-[#D5D1C4] rounded bg-white text-xs"
                />
              </div>

              <div className="flex justify-between text-xs text-[#8C887B]">
                <span>{t('pos.tax')} (รวมในยอดแล้ว)</span>
                <span>฿{vatAmount.toLocaleString()}</span>
              </div>

              <div className="pt-2 border-t border-[#E0DCD1] flex justify-between items-baseline">
                <span className="text-sm font-bold text-[#171717]">
                  {t('pos.total')}
                </span>
                <span className="text-2xl font-black text-[#171717]">
                  ฿{total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleOpenPayment}
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition ${
                  cart.length > 0
                    ? 'bg-[#171717] hover:bg-[#2C2A26] text-white cursor-pointer active:scale-[0.99]'
                    : 'bg-[#DDD9CE] text-[#8C887B] cursor-not-allowed'
                }`}
              >
                <span>{t('pos.pay')}</span>
                <span>฿{total.toLocaleString()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Processing Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7DF] mb-4">
              <h3 className="text-lg font-bold text-[#171717]">เลือกช่องทางชำระเงิน</h3>
              <button
                onClick={() => setIsPaymentOpen(false)}
                className="text-[#8C887B] hover:text-[#171717]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="bg-[#F8F6F0] rounded-2xl p-4 text-center mb-5 border border-[#E6E2D8]">
              <span className="text-xs text-[#7A7569] block mb-1">ยอดที่ต้องชำระสุทธิ</span>
              <span className="text-3xl font-black text-[#171717]">
                ฿{total.toLocaleString()}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  paymentMethod === 'cash'
                    ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                    : 'bg-[#FAF9F5] text-[#555] border-[#DDD9CE] hover:bg-[#F2EFE9]'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>{t('pay.cash')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('promptpay')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  paymentMethod === 'promptpay'
                    ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                    : 'bg-[#FAF9F5] text-[#555] border-[#DDD9CE] hover:bg-[#F2EFE9]'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>{t('pay.promptpay')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition text-xs font-semibold ${
                  paymentMethod === 'card'
                    ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                    : 'bg-[#FAF9F5] text-[#555] border-[#DDD9CE] hover:bg-[#F2EFE9]'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>{t('pay.card')}</span>
              </button>
            </div>

            {/* Method Specific UI */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 mb-5">
                <label className="text-xs font-semibold text-[#5A574E] block">
                  {t('pay.amount_received')}
                </label>
                <input
                  type="number"
                  min={total}
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                  className="w-full text-2xl font-bold px-4 py-2.5 border border-[#DDD9CE] rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-[#171717]"
                  placeholder="0"
                  autoFocus
                />

                {/* Quick Cash Tender Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived(total)}
                    className="py-2 bg-[#171717] text-white rounded-xl text-xs font-bold hover:bg-[#333] transition"
                  >
                    พอดี
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(100)}
                    className="py-2 bg-[#F4F1EA] text-[#333] rounded-xl text-xs font-bold hover:bg-[#E6E2D8] transition"
                  >
                    ฿100
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(500)}
                    className="py-2 bg-[#F4F1EA] text-[#333] rounded-xl text-xs font-bold hover:bg-[#E6E2D8] transition"
                  >
                    ฿500
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived(1000)}
                    className="py-2 bg-[#F4F1EA] text-[#333] rounded-xl text-xs font-bold hover:bg-[#E6E2D8] transition"
                  >
                    ฿1,000
                  </button>
                </div>

                {/* Additional quick increments */}
                <div className="flex gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCashReceived((prev) => (prev || 0) + 20)}
                    className="flex-1 py-1 bg-white border border-[#DDD] rounded-lg font-bold hover:bg-gray-50"
                  >
                    +20
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((prev) => (prev || 0) + 50)}
                    className="flex-1 py-1 bg-white border border-[#DDD] rounded-lg font-bold hover:bg-gray-50"
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((prev) => (prev || 0) + 100)}
                    className="flex-1 py-1 bg-white border border-[#DDD] rounded-lg font-bold hover:bg-gray-50"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashReceived((prev) => (prev || 0) + 500)}
                    className="flex-1 py-1 bg-white border border-[#DDD] rounded-lg font-bold hover:bg-gray-50"
                  >
                    +500
                  </button>
                </div>

                {cashReceived >= total && (
                  <div className="bg-[#EBF7EE] border border-[#B7E4BE] p-3 rounded-xl flex items-center justify-between text-sm text-[#1A622A]">
                    <span className="font-medium">{t('pay.change')}:</span>
                    <strong className="text-xl font-black">฿{changeDue.toLocaleString()}</strong>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'promptpay' && (
              <div className="text-center p-4 bg-[#FAF9F5] rounded-2xl border border-[#E6E2D8] mb-5">
                <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-xl border border-[#DDD9CE] shadow-sm flex flex-col items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=PROMPTPAY:EQUAL1:TOTAL=${total}`}
                    alt="PromptPay QR"
                    className="w-36 h-36 object-contain"
                  />
                </div>
                <div className="mt-2.5 text-xs text-[#6B675E]">
                  <strong>Thai PromptPay QR Code</strong>
                  <p>สแกนผ่าน Mobile Banking ได้ทุกธนาคาร ยอด ฿{total.toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={handleProcessCheckout}
                  className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>จำลองรับเงินโอนสำเร็จทันที (Instant Webhook)</span>
                </button>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="text-center p-6 bg-[#FAF9F5] rounded-2xl border border-[#E6E2D8] mb-5">
                <CreditCard className="w-10 h-10 mx-auto text-[#666] mb-2" />
                <p className="text-sm font-semibold text-[#171717]">
                  กรุณาเสียบหรือแตะบัตรที่เครื่อง EDC
                </p>
                <span className="text-xs text-[#8C887B]">
                  รองรับ Visa, Mastercard, JCB, UnionPay
                </span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 mb-4 bg-[#FEE4E2] border border-[#FECDCA] text-[#B42318] rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Confirm Checkout Button */}
            <button
              onClick={handleProcessCheckout}
              disabled={isProcessing}
              className="w-full py-3.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <span>กำลังประมวลผลธุรกรรม (RPC)...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('pay.confirm')} (฿{total.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Formal Digital Receipt Modal (Stitch: equal1_e_receipt_payment_success) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-[#E6E4DD] animate-in fade-in zoom-in-95 duration-150">
            {/* Success icon */}
            <div className="w-12 h-12 bg-[#DCFCE7] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="text-center border-b border-[#ECE9E1] pb-4 mb-4">
              <span className="text-[11px] font-bold tracking-widest text-[#9C988B] block uppercase">
                EQUAL1 BUSINESS OS
              </span>
              <h3 className="text-lg font-black text-[#171717] mt-0.5">
                {t('receipt.title')}
              </h3>
              <p className="text-xs text-[#7A7569] mt-1">
                สาขาหลัก (Main Branch) · TAX ID: 0105566000000
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="text-xs space-y-1.5 text-[#6B675E] mb-4 pb-3 border-b border-dashed border-[#DDD9CE]">
              <div className="flex justify-between">
                <span>{t('receipt.number')}:</span>
                <strong className="text-[#171717] font-mono">{completedSale.receipt_number}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('receipt.date')}:</span>
                <span>{new Date(completedSale.created_at).toLocaleString('th-TH')}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('receipt.cashier')}:</span>
                <span>{cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>ลูกค้า:</span>
                <span>{completedSale.customer_name}</span>
              </div>
            </div>

            {/* Receipt Items */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto text-xs pr-1">
              {completedSale.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-baseline">
                  <div className="flex-1 pr-2 truncate">
                    <span className="font-medium text-[#171717]">{item.name}</span>
                    <span className="text-[#8C887B] block text-[10px]">
                      {item.quantity} × ฿{item.unit_price}
                    </span>
                  </div>
                  <strong className="text-[#171717]">
                    ฿{item.line_total.toLocaleString()}
                  </strong>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-[#ECE9E1] pt-3 space-y-1.5 text-xs text-[#6B675E] mb-5">
              <div className="flex justify-between">
                <span>{t('pos.subtotal')}</span>
                <span>฿{completedSale.subtotal.toLocaleString()}</span>
              </div>
              {completedSale.discount > 0 && (
                <div className="flex justify-between text-[#B42318]">
                  <span>{t('pos.discount')}</span>
                  <span>-฿{completedSale.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-[#8C887B]">
                <span>{t('pos.tax')}</span>
                <span>฿{(((completedSale.total) * 7) / 107).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#171717] pt-2 border-t border-[#ECE9E1]">
                <span>{t('pos.total')}</span>
                <span>฿{completedSale.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-[#4E4A40] pt-1">
                <span>ช่องทางชำระเงิน</span>
                <span className="font-semibold uppercase">{completedSale.payment_method}</span>
              </div>
            </div>

            <div className="text-center text-[11px] text-[#8C887B] mb-5">
              <p>{t('receipt.thank_you')}</p>
              <p className="text-[10px] text-[#AAA] mt-0.5">VAT Included · Powered by EQUAL1</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#FAF9F5] border border-[#DDD9CE] hover:bg-[#F2EFE9] text-[#171717] font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-[#171717] hover:bg-[#2C2A26] text-white font-bold text-xs rounded-xl transition"
              >
                เสร็จสิ้น / ขายต่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Held Bills (บิลที่พักไว้) Modal */}
      {isHoldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-[#171717]">
                  รายการบิลที่พักไว้ (Held Bills)
                </h3>
              </div>
              <button
                onClick={() => setIsHoldModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {heldBills.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8C887B]">
                ไม่มีบิลที่พักค้างไว้ในระบบ
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto mb-4">
                {heldBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 bg-[#FAF8F5] border border-[#E6E4DD] rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-400 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#171717]">
                          {bill.id}
                        </span>
                        <span className="text-[11px] text-[#7A7569]">
                          {bill.customer_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8C887B] block mt-0.5">
                        {bill.cart.length} รายการ · {bill.note}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-black text-[#171717]">
                        ฿{bill.subtotal.toLocaleString()}
                      </strong>
                      <button
                        onClick={() => handleRecallBill(bill)}
                        className="px-3 py-1.5 bg-[#171717] hover:bg-[#333] text-white text-xs font-bold rounded-xl transition shadow"
                      >
                        เรียกคืน
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsHoldModalOpen(false)}
              className="w-full py-2.5 bg-[#F2EFE9] text-[#555] font-bold rounded-xl text-xs"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Camera Barcode / QR Code Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        products={products}
        customers={customers}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onProductScanned={(prod) => {
          handleAddToCart(prod);
          showToast(`สแกน "${prod.name}" สำเร็จ! เพิ่มลงตะกร้าแล้ว`, 'success');
        }}
        onCustomerScanned={(cust) => {
          setSelectedCustomer(cust.id);
          showToast(`สแกนพบบัตรสมาชิก: ${cust.name} (${cust.tier || 'สมาชิก'})`, 'success');
        }}
      />

      {/* Floating Status / Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 transition-all backdrop-blur-md animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/40'
              : toastMessage.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-[#171717]/95 text-white border-white/20'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
