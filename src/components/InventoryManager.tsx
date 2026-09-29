import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Search,
  CheckCircle,
  X,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, InventoryMovement } from '../types';
import { Language, getTranslation } from '../lib/i18n';
import { supabase } from '../lib/supabase';

interface InventoryManagerProps {
  products: Product[];
  movements: InventoryMovement[];
  onUpdateStock: (productId: string, delta: number, reason: string, refId?: string) => void;
  onAddProduct: (product: Product) => void;
  lang: Language;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  movements,
  onUpdateStock,
  onAddProduct,
  lang,
}) => {
  const t = (k: string) => getTranslation(lang, k);

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [search, setSearch] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('PURCHASE_RECEIVE');
  const [customReasonNote, setCustomReasonNote] = useState('');

  // New Product Modal
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('เครื่องดื่ม (Beverages)');
  const [newPrice, setNewPrice] = useState<number>(25);
  const [newCost, setNewCost] = useState<number>(15);
  const [newOpeningStock, setNewOpeningStock] = useState<number>(20);
  const [newReorderPoint, setNewReorderPoint] = useState<number>(5);

  const lowStockCount = products.filter((p) => p.stock <= p.reorder).length;

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q));
    const matchLow = !filterLowStockOnly || p.stock <= p.reorder;
    return matchSearch && matchLow;
  });

  const handleConfirmAdjust = () => {
    if (!selectedProduct || adjustAmount <= 0) return;

    const delta = adjustType === 'add' ? adjustAmount : -adjustAmount;
    if (selectedProduct.stock + delta < 0) {
      alert('ไม่สามารถตัดสต๊อกให้ติดลบได้ (สต๊อกปัจจุบัน: ' + selectedProduct.stock + ')');
      return;
    }

    const finalReason = customReasonNote
      ? `${adjustReason}: ${customReasonNote}`
      : adjustReason;

    onUpdateStock(selectedProduct.id, delta, finalReason);
    setSelectedProduct(null);
    setAdjustAmount(10);
    setCustomReasonNote('');
  };

  const handleSaveNewProduct = async () => {
    if (!newName.trim() || !newSku.trim()) {
      alert('กรุณากรอกชื่อสินค้าและ SKU');
      return;
    }

    const newProd: Product = {
      id: 'prod-' + Date.now().toString().slice(-6),
      sku: newSku.toUpperCase().trim(),
      name: newName.trim(),
      category: newCategory,
      price: newPrice,
      cost: newCost,
      stock: newOpeningStock,
      reorder: newReorderPoint,
      active: true,
    };

    // Attempt RPC call to Supabase equal1_create_product
    try {
      await supabase.rpc('equal1_create_product', {
        p_branch_id: '00000000-0000-0000-0000-000000000000',
        p_sku: newProd.sku,
        p_name: newProd.name,
        p_category: newProd.category,
        p_price: newProd.price,
        p_cost: newProd.cost,
        p_stock: newProd.stock,
        p_reorder: newProd.reorder,
      });
    } catch (err) {
      console.warn('RPC create product notice:', err);
    }

    onAddProduct(newProd);
    setIsNewProductOpen(false);
    setNewName('');
    setNewSku('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner and KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8C887B] block">สินค้าทั้งหมดในระบบ</span>
            <strong className="text-2xl font-black text-[#171717]">
              {products.length} <span className="text-xs font-normal text-gray-500">SKU</span>
            </strong>
          </div>
          <Package className="w-8 h-8 text-[#171717] opacity-20" />
        </div>

        <div
          onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
          className={`rounded-3xl p-5 border shadow-sm flex items-center justify-between cursor-pointer transition ${
            filterLowStockOnly
              ? 'bg-[#FEF3F2] border-[#FECDCA]'
              : 'bg-white border-[#E6E4DD] hover:border-[#D0CCC0]'
          }`}
        >
          <div>
            <span className="text-xs text-[#8C887B] block">สินค้าใกล้หมด (Low Stock)</span>
            <strong className="text-2xl font-black text-[#B42318]">
              {lowStockCount} <span className="text-xs font-normal text-gray-500">รายการ</span>
            </strong>
          </div>
          <AlertTriangle className="w-8 h-8 text-[#B42318] opacity-80" />
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8C887B] block">มูลค่าสต๊อกขายรวม</span>
            <strong className="text-2xl font-black text-[#171717]">
              ฿{products.reduce((acc, p) => acc + p.stock * p.price, 0).toLocaleString()}
            </strong>
          </div>
          <FileSpreadsheet className="w-8 h-8 text-[#16A34A] opacity-20" />
        </div>
      </div>

      {/* Main Subtabs & Actions */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                activeTab === 'stock'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'bg-[#FAF9F5] text-[#555] hover:bg-[#EAE6DE]'
              }`}
            >
              รายการสต๊อกคงเหลือ (On-Hand)
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
                activeTab === 'movements'
                  ? 'bg-[#171717] text-white shadow-sm'
                  : 'bg-[#FAF9F5] text-[#555] hover:bg-[#EAE6DE]'
              }`}
            >
              ประวัติเคลื่อนไหวสต๊อก (Movement Ledger)
            </button>
          </div>

          <button
            onClick={() => setIsNewProductOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ สร้างสินค้าใหม่ (New SKU)</span>
          </button>
        </div>

        {/* Tab 1: Product Inventory Table */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C887B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อสินค้า, SKU, Barcode หรือหมวดหมู่..."
                className="w-full pl-9 pr-4 py-2 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#171717]"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#FAF9F5] border-b border-[#ECE8DC] text-[#6B675E]">
                  <tr>
                    <th className="p-3 text-left font-bold">SKU / รหัส</th>
                    <th className="p-3 text-left font-bold">ชื่อสินค้า</th>
                    <th className="p-3 text-left font-bold">หมวดหมู่</th>
                    <th className="p-3 text-right font-bold">ต้นทุน</th>
                    <th className="p-3 text-right font-bold">ราคาขาย</th>
                    <th className="p-3 text-right font-bold">มาร์จิ้น</th>
                    <th className="p-3 text-center font-bold">คงเหลือ</th>
                    <th className="p-3 text-center font-bold">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE8DC]">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.reorder;
                    const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF9F5]/70 transition">
                        <td className="p-3 font-mono font-bold text-[#171717]">{p.sku}</td>
                        <td className="p-3 font-semibold text-[#171717]">{p.name}</td>
                        <td className="p-3 text-[#6B675E]">{p.category}</td>
                        <td className="p-3 text-right text-[#6B675E]">฿{p.cost}</td>
                        <td className="p-3 text-right font-bold text-[#171717]">฿{p.price}</td>
                        <td className="p-3 text-right text-emerald-700 font-semibold">{margin}%</td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-extrabold ${
                              isLow
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-[#EBF7EE] text-[#16A34A]'
                            }`}
                          >
                            {p.stock}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="px-3 py-1 bg-[#FAF9F5] border border-[#DDD9CE] hover:bg-[#F2EFE9] text-[#171717] rounded-lg font-bold transition"
                          >
                            ปรับสต๊อก
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Inventory Movements Ledger */}
        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF9F5] border-b border-[#ECE8DC] text-[#6B675E]">
                <tr>
                  <th className="p-3 text-left font-bold">เวลา</th>
                  <th className="p-3 text-left font-bold">สินค้า / SKU</th>
                  <th className="p-3 text-center font-bold">ก่อนเปลี่ยน</th>
                  <th className="p-3 text-center font-bold">จำนวน</th>
                  <th className="p-3 text-center font-bold">คงเหลือใหม่</th>
                  <th className="p-3 text-left font-bold">เหตุผล (Movement Reason)</th>
                  <th className="p-3 text-left font-bold">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE8DC]">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF9F5]/70 transition">
                    <td className="p-3 text-[#6B675E]">{new Date(m.created_at).toLocaleString('th-TH')}</td>
                    <td className="p-3">
                      <strong className="text-[#171717]">{m.product_name}</strong>
                      <span className="block text-[11px] font-mono text-[#8C887B]">{m.sku}</span>
                    </td>
                    <td className="p-3 text-center">{m.before_stock}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-black ${
                          m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{m.after_stock}</td>
                    <td className="p-3">
                      <span className="bg-[#F2EFE9] px-2 py-0.5 rounded text-[11px] font-mono font-medium">
                        {m.reason}
                      </span>
                    </td>
                    <td className="p-3 text-[#6B675E]">{m.user_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal (Requires Reason & Emits Movement) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#8C887B] block uppercase tracking-wider">
                  บันทึกความเคลื่อนไหวสต๊อก
                </span>
                <h3 className="text-base font-black text-[#171717]">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#ECE8DC] mb-4 flex justify-between text-xs">
              <span>สต๊อกปัจจุบัน:</span>
              <strong className="text-sm text-[#171717]">{selectedProduct.stock} ชิ้น</strong>
            </div>

            <div className="space-y-3.5 mb-5 text-xs">
              {/* Type */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4F1EA] rounded-xl font-bold text-center">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-lg transition ${
                    adjustType === 'add' ? 'bg-[#171717] text-white' : 'text-[#666]'
                  }`}
                >
                  + รับสินค้าเข้า (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-2 rounded-lg transition ${
                    adjustType === 'remove' ? 'bg-[#B42318] text-white' : 'text-[#666]'
                  }`}
                >
                  − ปรับลด / ชำรุด (Deduct)
                </button>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  จำนวน (ชิ้น)
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl text-base font-bold text-center focus:ring-2 focus:ring-[#171717]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  เหตุผลในการปรับสต๊อก (บังคับตามรัฐธรรมนูญระบบ)
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                >
                  {adjustType === 'add' ? (
                    <>
                      <option value="PURCHASE_RECEIVE">รับสินค้าจากการสั่งซื้อ (PO Receipt)</option>
                      <option value="STOCK_COUNT_INCREASE">นับสต๊อกจริงเกิน (Stock Count Surplus)</option>
                      <option value="TRANSFER_IN">โอนย้ายมาจากสาขาอื่น (Transfer In)</option>
                      <option value="CUSTOMER_RETURN">ลูกค้านำสินค้ามาคืน (Customer Return)</option>
                    </>
                  ) : (
                    <>
                      <option value="DAMAGED">สินค้าชำรุด เสียหาย (Damaged Stock)</option>
                      <option value="EXPIRED">สินค้าหมดอายุ (Expired Stock)</option>
                      <option value="STOCK_COUNT_SHORTAGE">นับสต๊อกจริงขาด (Stock Count Loss)</option>
                      <option value="INTERNAL_USE">นำไปใช้ภายในร้าน/ทดลอง (Internal Store Use)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  รายละเอียดเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={customReasonNote}
                  onChange={(e) => setCustomReasonNote(e.target.value)}
                  placeholder="เช่น เลขที่บิลซัพพลายเออร์, กล่องชำรุดตอนขนส่ง"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleConfirmAdjust}
              className="w-full py-3 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-xl transition active:scale-[0.98]"
            >
              บันทึก Movement ลงสมุดสต๊อก
            </button>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <h3 className="text-lg font-black text-[#171717]">
                เพิ่มสินค้าใหม่ (New SKU)
              </h3>
              <button
                onClick={() => setIsNewProductOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="เช่น ชาอู่หลงไม่มีน้ำตาล 500มล."
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">รหัส SKU / Barcode</label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="เช่น BEV-OOLONG-500"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#5A574E] block mb-1">ราคาขาย (บาท)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#5A574E] block mb-1">ต้นทุน (บาท)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#5A574E] block mb-1">สต๊อกเริ่มต้น</label>
                  <input
                    type="number"
                    value={newOpeningStock}
                    onChange={(e) => setNewOpeningStock(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#5A574E] block mb-1">จุดเตือนสั่งซื้อ (Reorder)</label>
                  <input
                    type="number"
                    value={newReorderPoint}
                    onChange={(e) => setNewReorderPoint(Number(e.target.value))}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveNewProduct}
              className="w-full py-3 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-xl transition active:scale-[0.98]"
            >
              บันทึกสินค้าใหม่ลงระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
