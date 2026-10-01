import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Layers,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  Sparkles,
  Store,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import {
  ApprovalRequest,
  EmployeeProfile,
  StaffActivityLog,
  Booking,
  Sale,
  UserRole,
} from '../types';
import { runtimeManager, TENANT_CONFIG } from '../lib/backendEngine';

interface OwnerControlWorkspaceProps {
  currentStaffName: string;
  currentRole: UserRole;
  employees: EmployeeProfile[];
  approvals: ApprovalRequest[];
  onApproveRequest: (id: string, reviewerName: string) => void;
  onRejectRequest: (id: string, reviewerName: string, reason?: string) => void;
  activities: StaffActivityLog[];
  bookings: Booking[];
  sales: Sale[];
  onNavigateToView: (view: string) => void;
}

export const OwnerControlWorkspace: React.FC<OwnerControlWorkspaceProps> = ({
  currentStaffName,
  currentRole,
  employees,
  approvals,
  onApproveRequest,
  onRejectRequest,
  activities,
  bookings,
  sales,
  onNavigateToView,
}) => {
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('all');
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Service Areas / Rooms
  const serviceAreas = [
    { id: 'area-pos', name: 'เคาน์เตอร์แคชเชียร์ 01', type: 'POS & Store', assigned: 'สมศรี (Senior Cashier)', status: 'active', occupancy: '90%' },
    { id: 'area-salon-1', name: 'เก้าอี้ทำผม VIP 01', type: 'Salon & Color', assigned: 'ช่างเมย์ (Master Stylist)', status: 'busy', occupancy: '100%' },
    { id: 'area-salon-2', name: 'เก้าอี้ทำผม 02', type: 'Salon & Haircut', assigned: 'ช่างแนน (Stylist)', status: 'available', occupancy: '0%' },
    { id: 'area-tattoo', name: 'ห้องสักลาย & PMU Suite A', type: 'Tattoo & PMU', assigned: 'ช่างโจ้ (Tattoo Artist)', status: 'busy', occupancy: '100%' },
    { id: 'area-warehouse', name: 'คลังสินค้า & สต๊อกกลาง', type: 'Warehouse', assigned: 'มานะ (Stock Control)', status: 'active', occupancy: '45%' },
    { id: 'area-rider', name: 'จุดรับออเดอร์เดลิเวอรี่', type: 'Fulfillment', assigned: 'สมชาย (Delivery Rider)', status: 'active', occupancy: '70%' },
  ];

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

  const handleConfirmReject = (id: string) => {
    onRejectRequest(id, currentStaffName, rejectReason || 'ไม่อนุมัติโดยคำสั่งผู้บริหาร');
    setRejectionModalId(null);
    setRejectReason('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Command Banner */}
      <div className="bg-[#171717] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-black">
                SUPERVISOR &amp; OWNER CONTROL
              </span>
              <span className="text-xs text-[#AAA]">ศูนย์บัญชาการปฏิบัติการและจัดสรรทรัพยากร</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Executive Command &amp; Assignment Hub
            </h1>
            <p className="text-xs text-[#BBB] mt-1 max-w-xl">
              ผู้ควบคุม: <strong className="text-white">{currentStaffName}</strong> · ควบคุมผังสาขา มอบหมายจุดประจำการ ตรวจสอบคิวงาน และอนุมัติคำขอสำคัญแบบ Real-time
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToView('dashboard')}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>เปิดดู Dashboard ภาพรวม</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Service Area Assignments (8 Cols) + Real-time Approvals & Activity Radar (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Physical Rooms & Service Areas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span>ผังจุดประจำการและห้องบริการ (Service Area &amp; Room Allocation)</span>
                </h3>
                <span className="text-xs text-gray-400">
                  สาขาเมืองเอก / รังสิต มินิมาร์ท &amp; บิวตี้ซาลอน (EQUAL1 Hub)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-gray-600 mr-2">พร้อมรับงาน</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-gray-600">กำลังให้บริการ</span>
              </div>
            </div>

            {/* Service Areas Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {serviceAreas.map((area) => (
                <div
                  key={area.id}
                  className="p-4 rounded-2xl border border-gray-200/80 hover:border-gray-300 transition bg-[#FAF9F6] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{area.type}</span>
                      <strong className="text-xs block text-gray-900 font-bold mt-0.5">{area.name}</strong>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        area.status === 'busy'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {area.status === 'busy' ? 'มีลูกค้า' : 'พร้อมบริการ'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-[11px]">จนท: <strong className="text-gray-800">{area.assigned}</strong></span>
                    <span className="font-bold text-gray-600 text-[11px]">{area.occupancy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Staff Shift Roster */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>พนักงานที่กำลังปฏิบัติหน้าที่ในกะ (Active On-Duty Staff)</span>
              </h3>
              <span className="text-xs text-gray-400">{employees.length} อัตรากำลัง</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/70 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shadow-sm">
                    {emp.nickname ? emp.nickname[0] : 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="text-xs font-bold text-gray-900 block truncate">
                      {emp.name} ({emp.nickname})
                    </strong>
                    <span className="text-[11px] text-gray-500 block truncate">
                      {emp.position} · {emp.attendance_status === 'clocked_in' ? '🟢 เข้างานแล้ว' : '⚪ ยังไม่เข้างาน'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Executive Approval Queue & Live Audit Radar (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Executive Approval Queue */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>คำขอรอการอนุมัติ (Approval Queue)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingApprovals.length} รายการ
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-xs">
                ไม่มีคำขอค้างอนุมัติในระบบ
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="font-bold text-amber-950">{req.title}</strong>
                      {req.amount && (
                        <span className="font-mono font-bold text-amber-800">฿{req.amount.toLocaleString()}</span>
                      )}
                    </div>

                    <p className="text-gray-600 text-[11px] leading-relaxed">{req.details}</p>

                    <div className="text-[10px] text-gray-400">
                      ผู้ขอ: {req.requested_by_name} · {new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onApproveRequest(req.id, currentStaffName)}
                        className="flex-1 py-1.5 bg-black hover:bg-gray-800 text-white font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>อนุมัติ (Approve)</span>
                      </button>
                      <button
                        onClick={() => setRejectionModalId(req.id)}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[11px] rounded-xl transition cursor-pointer"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Activity Stream (Recent Radar) */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>เรดาร์ความเคลื่อนไหว (Live Staff Activity)</span>
            </h3>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {activities.slice(0, 8).map((act) => (
                <div key={act.id} className="p-2.5 bg-gray-50 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 text-[11px] font-bold">{act.title}</strong>
                    <span className="text-[10px] text-gray-400">
                      {new Date(act.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">{act.detail}</p>
                  <span className="text-[10px] text-emerald-700 font-semibold block">โดย: {act.employee_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h4 className="text-sm font-black text-gray-900">ระบุเหตุผลในการปฏิเสธคำขอ</h4>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผล เช่น ไม่ตรงเงื่อนไข หรือ ยอดเงินเกินวงเงิน..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24 outline-none focus:bg-white focus:border-black"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleConfirmReject(rejectionModalId)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
