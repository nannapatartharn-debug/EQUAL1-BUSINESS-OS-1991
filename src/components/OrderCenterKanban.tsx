import React, { useState } from 'react';
import {
  Layers,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  Printer,
  X,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Sale, OrderStatus } from '../types';
import { Language, getTranslation } from '../lib/i18n';

interface OrderCenterKanbanProps {
  sales: Sale[];
  onUpdateOrderStatus: (saleId: string, nextStatus: OrderStatus, reason?: string) => void;
  lang: Language;
}

export const OrderCenterKanban: React.FC<OrderCenterKanbanProps> = ({
  sales,
  onUpdateOrderStatus,
  lang,
}) => {
  const t = (k: string) => getTranslation(lang, k);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isThermalLabelOpen, setIsThermalLabelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Kanban Columns
  const columns: { status: OrderStatus; label: string; icon: any; color: string }[] = [
    { status: 'pending', label: 'ออเดอร์ใหม่ (New)', icon: Clock, color: 'border-amber-400 bg-amber-50' },
    { status: 'confirmed', label: 'ยืนยันแล้ว (Confirmed)', icon: CheckCircle, color: 'border-blue-400 bg-blue-50' },
    { status: 'preparing', label: 'กำลังแพ็ก (Preparing)', icon: Package, color: 'border-purple-400 bg-purple-50' },
    { status: 'delivering', label: 'กำลังส่ง (Delivering)', icon: Truck, color: 'border-indigo-400 bg-indigo-50' },
    { status: 'completed', label: 'จัดส่งสำเร็จ (Completed)', icon: CheckCircle, color: 'border-emerald-500 bg-emerald-50' },
  ];

  const filteredSales = sales.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      s.id.toLowerCase().includes(q) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
      (s.customer_phone && s.customer_phone.includes(q))
    );
  });

  const handleNextStatus = (sale: Sale) => {
    // Valid state machine progression
    if (sale.status === 'pending') {
      onUpdateOrderStatus(sale.id, 'confirmed');
    } else if (sale.status === 'confirmed') {
      onUpdateOrderStatus(sale.id, 'preparing');
    } else if (sale.status === 'preparing') {
      onUpdateOrderStatus(sale.id, 'delivering');
    } else if (sale.status === 'delivering') {
      onUpdateOrderStatus(sale.id, 'completed');
    }
  };

  const handleCancel = (sale: Sale) => {
    if (['completed', 'cancelled', 'failed'].includes(sale.status)) {
      alert('ออเดอร์อยู่ในสถานะสิ้นสุดแล้ว ไม่สามารถยกเลิกได้');
      return;
    }
    const reason = prompt('กรุณากรอกเหตุผลในการยกเลิกออเดอร์');
    if (!reason) return;
    onUpdateOrderStatus(sale.id, 'cancelled', reason);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E4DD] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#8C887B]">
            EQUAL1 ORDER CENTER
          </span>
          <h2 className="text-xl font-black text-[#171717] mt-0.5">
            ศูนย์ควบคุมออเดอร์ & เดลิเวอรี่ (Order Kanban)
          </h2>
          <p className="text-xs text-[#7A7569]">
            ตรวจสอบสถานะออเดอร์เดลิเวอรี่และหน้าร้านตาม State Machine ที่ถูกต้อง
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C887B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหา Order ID, ชื่อลูกค้า, เบอร์โทร..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF9F5] border border-[#DDD9CE] rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colSales = filteredSales.filter((s) => s.status === col.status);
          const ColIcon = col.icon;

          return (
            <div
              key={col.status}
              className="bg-[#FAF9F5] rounded-3xl p-3 border border-[#E2DFD7] flex flex-col min-w-[240px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-3 border-b border-[#ECE8DC]">
                <div className="flex items-center gap-1.5">
                  <ColIcon className="w-4 h-4 text-[#555]" />
                  <span className="text-xs font-bold text-[#1F1E1C]">
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-[#DDD9CE]">
                  {colSales.length}
                </span>
              </div>

              {/* Cards list */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {colSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-white p-3.5 rounded-2xl border border-[#E0DCD1] shadow-sm hover:shadow transition text-xs space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="font-mono text-[#171717] block">
                          #{sale.id}
                        </strong>
                        <span className="text-[11px] text-[#8C887B]">
                          {new Date(sale.created_at).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#171717] text-white">
                        {sale.channel.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-[#171717] block">
                        {sale.customer_name || 'ลูกค้าทั่วไป'}
                      </span>
                      {sale.delivery_address && (
                        <p className="text-[11px] text-[#7A7569] line-clamp-1">
                          📍 {sale.delivery_address}
                        </p>
                      )}
                    </div>

                    <div className="bg-[#FAF9F5] p-2 rounded-xl border border-[#ECE8DC] space-y-1">
                      {sale.items?.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex justify-between text-[11px]">
                          <span className="truncate pr-1">{item.name}</span>
                          <span>×{item.quantity}</span>
                        </div>
                      ))}
                      {(sale.items?.length || 0) > 2 && (
                        <span className="text-[10px] text-gray-500 block italic">
                          และอีก {(sale.items?.length || 0) - 2} รายการ...
                        </span>
                      )}
                      <div className="pt-1.5 border-t border-[#DDD9CE] flex justify-between font-bold text-[#171717]">
                        <span>ยอดสุทธิ</span>
                        <span>฿{sale.total.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setIsDetailOpen(true);
                        }}
                        className="flex-1 py-1.5 bg-[#FAF9F5] border border-[#DDD9CE] hover:bg-[#F2EFE9] text-[#171717] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>ตรวจบิล</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSale(sale);
                          setIsThermalLabelOpen(true);
                        }}
                        className="p-1.5 bg-[#FAF9F5] border border-[#DDD9CE] hover:bg-[#F2EFE9] text-[#171717] rounded-lg"
                        title="พิมพ์ใบปะหน้าพัสดุ (Thermal)"
                      >
                        <Printer className="w-3 h-3" />
                      </button>

                      {sale.status !== 'completed' && (
                        <button
                          onClick={() => handleNextStatus(sale)}
                          className="px-2.5 py-1.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-lg font-bold text-[11px] transition"
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colSales.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#A8A499] italic">
                    ไม่มีออเดอร์
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Detail & Slip Verification Modal */}
      {isDetailOpen && selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#8C887B] block uppercase tracking-wider">
                  รายละเอียดออเดอร์
                </span>
                <h3 className="text-lg font-black text-[#171717]">
                  #{selectedSale.id}
                </h3>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF9F5] rounded-2xl border border-[#ECE8DC]">
                <div>
                  <span className="text-[#8C887B] block">ลูกค้า:</span>
                  <strong className="text-sm text-[#171717]">{selectedSale.customer_name}</strong>
                  {selectedSale.customer_phone && <p>{selectedSale.customer_phone}</p>}
                </div>
                <div>
                  <span className="text-[#8C887B] block">สถานะการชำระเงิน:</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-[#DCFCE7] text-[#16A34A] inline-block mt-0.5">
                    {selectedSale.payment_status.toUpperCase()} ({selectedSale.payment_method})
                  </span>
                </div>
              </div>

              {selectedSale.delivery_address && (
                <div className="p-3 bg-[#FAF9F5] rounded-2xl border border-[#ECE8DC]">
                  <span className="text-[#8C887B] block">ที่อยู่จัดส่ง:</span>
                  <strong className="text-[#171717]">{selectedSale.delivery_address}</strong>
                </div>
              )}

              {/* Items Table */}
              <div className="border border-[#ECE8DC] rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF9F5] border-b border-[#ECE8DC] text-[#6B675E]">
                    <tr>
                      <th className="p-2.5 text-left font-bold">รายการสินค้า</th>
                      <th className="p-2.5 text-center font-bold">จำนวน</th>
                      <th className="p-2.5 text-right font-bold">ราคา</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE8DC]">
                    {selectedSale.items?.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5">{it.name}</td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right font-bold">฿{it.line_total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-[#ECE8DC] text-sm font-bold text-[#171717]">
                <span>ยอดรวมสุทธิ</span>
                <span className="text-xl font-black">฿{selectedSale.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleCancel(selectedSale)}
                className="py-2.5 px-4 bg-[#FEE4E2] text-[#B42318] hover:bg-[#FECDCA] rounded-xl text-xs font-bold transition"
              >
                ยกเลิกออเดอร์
              </button>
              <button
                onClick={() => {
                  handleNextStatus(selectedSale);
                  setIsDetailOpen(false);
                }}
                className="flex-1 py-2.5 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl text-xs font-bold transition"
              >
                เลื่อนสถานะถัดไป
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Packing Slip Modal (Stitch: equal1_packing_slip_thermal_label) */}
      {isThermalLabelOpen && selectedSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-gray-300 font-mono text-xs">
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <h4 className="text-base font-black">EQUAL1 PACKING SLIP</h4>
              <p className="text-[10px]">ORDER #{selectedSale.id}</p>
            </div>

            <div className="space-y-1 mb-3 text-[11px] border-b border-black pb-2">
              <div><strong>ลูกค้า:</strong> {selectedSale.customer_name}</div>
              <div><strong>เบอร์:</strong> {selectedSale.customer_phone || '-'}</div>
              <div><strong>ที่อยู่:</strong> {selectedSale.delivery_address || 'รับที่ร้าน'}</div>
            </div>

            <div className="space-y-1 mb-3 border-b border-black pb-2 text-[11px]">
              {selectedSale.items?.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>[ ] {it.name}</span>
                  <strong>x{it.quantity}</strong>
                </div>
              ))}
            </div>

            <div className="text-center text-[10px] mb-4">
              <p>*** ตรวจสอบสินค้าครบถ้วนก่อนส่งมอบ ***</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-black text-white font-bold rounded-lg"
              >
                Print Thermal
              </button>
              <button
                onClick={() => setIsThermalLabelOpen(false)}
                className="py-2 px-3 bg-gray-200 text-black font-bold rounded-lg"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
