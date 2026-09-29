import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  Plus,
  X,
  Scissors,
  Check,
  AlertTriangle,
  Volume2,
  Ticket,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Booking, ServiceItem, BookingStatus } from '../types';
import { Language } from '../lib/i18n';

interface SalonBookingViewProps {
  bookings: Booking[];
  services: ServiceItem[];
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onAddBooking: (booking: Booking) => void;
  lang: Language;
  onSendToPos?: (booking: Booking) => void;
}

export const SalonBookingView: React.FC<SalonBookingViewProps> = ({
  bookings,
  services,
  onUpdateBookingStatus,
  onAddBooking,
  onSendToPos,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'timeline' | 'walkin_queue'>('cards');
  const [selectedStylist, setSelectedStylist] = useState<string>('all');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  // Walk-in digital queue state
  const [walkinQueueNumber, setWalkinQueueNumber] = useState<number>(3);
  const [currentCallingQueue, setCurrentCallingQueue] = useState<string>('Q-01');
  const [callingAnnouncement, setCallingAnnouncement] = useState<string | null>(null);

  // New Booking form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bookingTime, setBookingTime] = useState<string>('11:00');
  const [technicianName, setTechnicianName] = useState('ช่างเมย์ (Master Stylist)');
  const [notes, setNotes] = useState('');

  const stylists = [
    'ช่างเมย์ (Master Stylist)',
    'ช่างแอน (Senior Nail Artist)',
    'ช่างเอก (Fine-Line Tattooist)',
  ];

  const timeSlots = [
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
  ];

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      return selectedStylist === 'all' || b.technician_name === selectedStylist;
    });
  }, [bookings, selectedStylist]);

  // Statistics
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const inServiceCount = bookings.filter((b) => b.status === 'in_service').length;
  const completedTodayCount = bookings.filter((b) => b.status === 'completed').length;

  // Collision checking with exact duration logic
  const handleCreateBooking = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์ลูกค้า');
      return;
    }

    const srv = services.find((s) => s.id === selectedServiceId) || services[0];
    if (!srv) return;

    // Check collision for this technician and time slot
    const targetSlot = `${bookingDate}T${bookingTime}:00`;
    const collision = bookings.find(
      (b) =>
        b.technician_name === technicianName &&
        b.starts_at.slice(0, 16) === targetSlot.slice(0, 16) &&
        !['cancelled', 'no_show'].includes(b.status)
    );

    if (collision) {
      alert(`⚠️ ระบบตรวจจับการชนของคิว (Conflict Prevention): ช่าง ${technicianName} ติดนัดหมายเวลา ${bookingTime} น. อยู่แล้ว (${collision.service_name} - ${collision.customer_name}) กรุณาเลือกช่วงเวลาอื่น`);
      return;
    }

    const newBooking: Booking = {
      id: 'BK-' + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      service_id: srv.id,
      service_name: srv.name,
      customer_name: customerName,
      customer_phone: customerPhone,
      starts_at: targetSlot,
      duration_minutes: srv.duration_minutes,
      technician_name: technicianName,
      status: 'confirmed',
      price: srv.price,
      notes: notes || undefined,
    };

    onAddBooking(newBooking);
    setIsNewBookingOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setNotes('');
  };

  // Walk-in queue issuance
  const handleIssueWalkinTicket = () => {
    const nextNum = walkinQueueNumber + 1;
    setWalkinQueueNumber(nextNum);
    const queueCode = `Q-0${nextNum}`;

    const newBooking: Booking = {
      id: 'BK-' + Date.now().toString().slice(-6),
      created_at: new Date().toISOString(),
      service_id: services[0].id,
      service_name: services[0].name + ' (Walk-in)',
      customer_name: `ลูกค้า Walk-in (${queueCode})`,
      customer_phone: 'หน้าร้าน',
      starts_at: new Date().toISOString(),
      duration_minutes: services[0].duration_minutes,
      technician_name: 'ช่างคิวถัดไป (Next Available)',
      status: 'checked_in',
      price: services[0].price,
      notes: `บัตรคิวดิจิทัล ${queueCode}`,
    };

    onAddBooking(newBooking);
    alert(`ออกบัตรคิว ${queueCode} สำเร็จ! ประมาณการเวลารอคอย: 15-20 นาที`);
  };

  // Call Next Queue Announcement
  const handleCallNextQueue = (code: string) => {
    setCurrentCallingQueue(code);
    setCallingAnnouncement(`🔔 เชิญคิวหมายเลข ${code} เข้าประจำสถานีบริการค่ะ`);
    setTimeout(() => {
      setCallingAnnouncement(null);
    }, 4000);
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">ยืนยันแล้ว</span>;
      case 'checked_in':
        return <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">ลูกค้าถึงร้านแล้ว</span>;
      case 'in_service':
        return <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse">กำลังให้บริการ</span>;
      case 'completed':
        return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">เสร็จสิ้น</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">ยกเลิก</span>;
      default:
        return <span className="bg-orange-100 text-orange-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">รอยืนยัน</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner & KPI */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#8C887B]">
            EQUAL1 SALON & BEAUTY ARCHITECTURE · PRECISION SCHEDULER
          </span>
          <h2 className="text-2xl font-black text-[#171717] mt-1 flex items-center gap-2">
            <Scissors className="w-6 h-6 text-[#E6A055]" />
            <span>ระบบคิวบริการ & ตารางช่างเสริมสวย</span>
          </h2>
          <p className="text-xs text-[#7A7569] mt-0.5">
            ป้องกันคิวชน 100% บริหารช่างหลายสถานี พร้อมระบบบัตรคิว Walk-in ดิจิทัล
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#FAF8F5] border border-[#E6E4DD] rounded-2xl text-right">
            <span className="text-[10px] text-[#8C887B] block">กำลังทำบริการ</span>
            <strong className="text-base font-black text-amber-600">
              {inServiceCount} คิว
            </strong>
          </div>

          <div className="px-4 py-2 bg-[#FAF8F5] border border-[#E6E4DD] rounded-2xl text-right">
            <span className="text-[10px] text-[#8C887B] block">นัดหมายรอดำเนินการ</span>
            <strong className="text-base font-black text-indigo-600">
              {confirmedCount} คิว
            </strong>
          </div>

          <button
            onClick={() => setIsNewBookingOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#E6A055] hover:bg-[#d69045] text-black font-bold text-xs rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ ลงคิวนัดหมายใหม่</span>
          </button>
        </div>
      </div>

      {/* Calling Alert Banner */}
      {callingAnnouncement && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-600 text-white shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <Volume2 className="w-6 h-6" />
            <span className="text-sm font-bold">{callingAnnouncement}</span>
          </div>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">
            กำลังประกาศเรียก
          </span>
        </div>
      )}

      {/* Mode Sub-Tabs & Stylist Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6E4DD] pb-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('cards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'cards'
                ? 'bg-[#171717] text-white shadow'
                : 'bg-white border border-[#E6E4DD] text-[#7A7569] hover:bg-gray-50'
            }`}
          >
            การ์ดคิวบริการ ({filteredBookings.length})
          </button>

          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'timeline'
                ? 'bg-[#171717] text-white shadow'
                : 'bg-white border border-[#E6E4DD] text-[#7A7569] hover:bg-gray-50'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#E6A055]" />
            <span>ตารางกริดเวลา (Precision Timeline)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('walkin_queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'walkin_queue'
                ? 'bg-[#171717] text-white shadow'
                : 'bg-white border border-[#E6E4DD] text-[#7A7569] hover:bg-gray-50'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-indigo-500" />
            <span>บัตรคิว Walk-in ดิจิทัล</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8C887B]">กรองช่าง:</span>
          <select
            value={selectedStylist}
            onChange={(e) => setSelectedStylist(e.target.value)}
            className="bg-white border border-[#E6E4DD] rounded-xl px-3 py-1.5 text-xs font-bold text-[#171717] outline-none"
          >
            <option value="all">ช่างทุกคน (All Stylists)</option>
            {stylists.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUB-TAB 1: CARDS VIEW */}
      {activeSubTab === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-[#E6E4DD] rounded-3xl p-5 shadow-sm hover:border-[#CCC] transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0EDE6] pb-2.5">
                  <span className="text-xs font-mono font-bold text-[#8C887B]">
                    #{b.id}
                  </span>
                  {getStatusBadge(b.status)}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-[#171717] leading-snug">
                    {b.service_name}
                  </h4>
                  <div className="text-xs text-[#6B675E] space-y-1 mt-2">
                    <p>👤 <strong>{b.customer_name}</strong> {b.customer_phone ? `(${b.customer_phone})` : ''}</p>
                    <p>✂️ {b.technician_name || 'ช่างประจำสาขา'}</p>
                    <p className="flex items-center gap-1 font-semibold text-[#171717]">
                      <Clock className="w-3.5 h-3.5 text-[#E6A055]" />
                      <span>{new Date(b.starts_at).toLocaleString('th-TH')} ({b.duration_minutes} นาที)</span>
                    </p>
                    {b.notes && (
                      <p className="text-[#888] italic bg-[#FAF8F5] p-2 rounded-xl mt-1 border border-[#EFECE6]">
                        "{b.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* In-service stopwatch simulation */}
                {b.status === 'in_service' && (
                  <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs">
                    <div className="flex justify-between items-center text-amber-900 font-bold mb-1">
                      <span>กำลังให้บริการ...</span>
                      <span className="font-mono">เหลืออีก ~35 นาที</span>
                    </div>
                    <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-3/5 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-[#F0EDE6]">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-xs text-[#8C887B]">ค่าบริการ</span>
                  <span className="text-base font-black text-[#171717]">
                    ฿{b.price.toLocaleString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'checked_in')}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                    >
                      ลูกค้าถึงร้าน (Check-in)
                    </button>
                  )}

                  {b.status === 'checked_in' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'in_service')}
                      className="py-2 bg-amber-500 hover:bg-amber-600 text-black rounded-xl transition"
                    >
                      เริ่มทำบริการ (Start)
                    </button>
                  )}

                  {b.status === 'in_service' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'completed')}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition col-span-2"
                    >
                      ทำบริการเสร็จสิ้น (Finish)
                    </button>
                  )}

                  {b.status === 'completed' && onSendToPos && (
                    <button
                      onClick={() => onSendToPos(b)}
                      className="py-2 bg-[#171717] hover:bg-[#333] text-white rounded-xl transition col-span-2 flex items-center justify-center gap-1.5"
                    >
                      <span>ส่งชำระเงินที่ POS หน้าร้าน</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E6A055]" />
                    </button>
                  )}

                  {b.status !== 'completed' && b.status !== 'cancelled' && (
                    <button
                      onClick={() => onUpdateBookingStatus(b.id, 'cancelled')}
                      className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition"
                    >
                      ยกเลิกคิว
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 2: PRECISION TIMELINE GRID */}
      {activeSubTab === 'timeline' && (
        <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="text-xs font-bold text-[#8C887B] uppercase mb-4">
              ตารางเวลาการครองคิวรายวัน (10:00 - 19:00 น.) — เช็คคิวชนเรียลไทม์
            </div>

            <div className="grid grid-cols-11 gap-2 pb-3 border-b border-[#E6E4DD] text-xs font-bold text-center text-[#7A7569]">
              <div className="text-left font-mono">ช่าง / สถานี</div>
              {timeSlots.map((ts) => (
                <div key={ts} className="font-mono">{ts}</div>
              ))}
            </div>

            <div className="divide-y divide-[#F0EDE6]">
              {stylists.map((stylist) => (
                <div key={stylist} className="grid grid-cols-11 gap-2 py-4 items-center text-xs">
                  <div className="font-bold text-[#171717] truncate pr-2">
                    {stylist.split(' ')[0]}
                  </div>

                  {timeSlots.map((slot) => {
                    const match = bookings.find(
                      (b) =>
                        b.technician_name === stylist &&
                        b.starts_at.includes(slot) &&
                        b.status !== 'cancelled'
                    );

                    return (
                      <div key={slot} className="h-14 flex items-center justify-center">
                        {match ? (
                          <div
                            onClick={() => alert(`นัดหมาย: ${match.customer_name}\nบริการ: ${match.service_name}\nสถานะ: ${match.status}`)}
                            className={`w-full h-full rounded-xl p-1.5 text-[10px] font-bold text-center flex flex-col justify-center cursor-pointer transition shadow-sm ${
                              match.status === 'in_service'
                                ? 'bg-amber-100 border border-amber-300 text-amber-900 animate-pulse'
                                : match.status === 'completed'
                                ? 'bg-gray-100 border border-gray-300 text-gray-700'
                                : 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                            }`}
                          >
                            <span className="truncate block">{match.customer_name}</span>
                            <span className="text-[9px] opacity-75">{match.duration_minutes}m</span>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-xl border border-dashed border-[#E6E4DD] hover:border-[#E6A055] hover:bg-amber-50/20 transition flex items-center justify-center text-[10px] text-[#AAA]">
                            ว่าง
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DIGITAL WALKIN QUEUE */}
      {activeSubTab === 'walkin_queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
            <h3 className="text-base font-black text-[#171717] mb-1">
              ตู้กดบัตรคิวดิจิทัล (Walk-in Kiosk Simulation)
            </h3>
            <p className="text-xs text-[#8C887B] mb-6">
              สำหรับลูกค้าหน้าร้านที่ไม่ได้จองล่วงหน้า กดรับบัตรคิวเพื่อคำนวณเวลารอรับบริการอัตโนมัติ
            </p>

            <div className="p-6 bg-[#FAF8F5] rounded-3xl border border-[#E6E4DD] text-center mb-6">
              <span className="text-xs text-[#8C887B] font-bold block mb-1">
                คิวถัดไปที่จะได้รับ:
              </span>
              <strong className="text-5xl font-black text-[#171717] font-mono tracking-widest block">
                Q-0{walkinQueueNumber + 1}
              </strong>
              <span className="text-xs text-emerald-700 font-semibold block mt-2">
                เวลารอประมาณการ: 15-20 นาที (มี 2 คิวก่อนหน้า)
              </span>

              <button
                onClick={handleIssueWalkinTicket}
                className="mt-5 px-6 py-3 bg-[#171717] hover:bg-[#333] text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 mx-auto"
              >
                <Ticket className="w-4 h-4 text-[#E6A055]" />
                <span>กดออกบัตรคิว Walk-in ทันที</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
            <h3 className="text-base font-black text-[#171717] mb-1">
              หน้าจอเรียกคิวหน้าร้าน (Queue Calling Display)
            </h3>
            <p className="text-xs text-[#8C887B] mb-6">
              แสดงหมายเลขคิวปัจจุบันที่กำลังเรียกรับบริการ
            </p>

            <div className="p-8 bg-[#171717] text-white rounded-3xl text-center shadow-xl mb-4">
              <span className="text-xs text-[#E6A055] font-mono tracking-widest block uppercase mb-1">
                NOW CALLING · คิวปัจจุบัน
              </span>
              <strong className="text-6xl font-black font-mono text-white tracking-wider block">
                {currentCallingQueue}
              </strong>
              <p className="text-xs text-[#AAA] mt-3">
                โต๊ะบริการ: สถานีสปา & ทำเล็บ A1 (ช่างเมย์)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['Q-01', 'Q-02', 'Q-03'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleCallNextQueue(q)}
                  className="py-2.5 bg-[#FAF8F5] border border-[#E6E4DD] hover:border-indigo-500 rounded-xl text-xs font-bold text-[#171717] transition flex items-center justify-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>เรียกคิว {q}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {isNewBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E6E4DD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE9E1] mb-4">
              <h3 className="text-lg font-black text-[#171717]">
                ลงคิวนัดหมายบริการใหม่
              </h3>
              <button
                onClick={() => setIsNewBookingOpen(false)}
                className="text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  ชื่อลูกค้า
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณกมลวรรณ"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl focus:ring-2 focus:ring-[#171717]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl focus:ring-2 focus:ring-[#171717]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  เลือกบริการ
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes} นาที - ฿{s.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#5A574E] block mb-1">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#5A574E] block mb-1">
                    เวลา
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                  >
                    {timeSlots.map((ts) => (
                      <option key={ts} value={ts}>{ts} น.</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  ช่างผู้ให้บริการ
                </label>
                <select
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl bg-white"
                >
                  {stylists.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#5A574E] block mb-1">
                  หมายเหตุ
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น มัดจำแล้ว 200 บ. / ขอเพิ่มลายเพ้นท์"
                  className="w-full p-2.5 border border-[#DDD9CE] rounded-xl"
                />
              </div>
            </div>

            <button
              onClick={handleCreateBooking}
              className="w-full py-3 bg-[#171717] hover:bg-[#2C2A26] text-white rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกคิวนัดหมาย (ลงระบบ)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
