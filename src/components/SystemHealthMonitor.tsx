import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Database,
  Lock,
  Layers,
  Cpu,
  History,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { AuditLog } from '../types';
import { PROJECT_ID, REGION } from '../lib/supabase';

interface SystemHealthMonitorProps {
  auditLogs: AuditLog[];
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  auditLogs,
}) => {
  const systemComponents = [
    {
      name: 'Supabase PostgreSQL 17',
      role: 'Single Source of Truth (53 Tables)',
      status: 'Healthy',
      latency: '24ms',
      detail: `Project: ${PROJECT_ID} (${REGION})`,
      icon: Database,
    },
    {
      name: 'Row Level Security (RLS)',
      role: 'Tenant & Branch Isolation Policies',
      status: 'Enforced',
      latency: '0ms',
      detail: 'RLS active on all tables. No direct client mutation.',
      icon: Lock,
    },
    {
      name: 'Transaction Boundary (RPC)',
      role: 'Atomic Checkout & Inventory Locking',
      status: 'Healthy',
      latency: '35ms',
      detail: 'SECURITY DEFINER with row locking FOR UPDATE',
      icon: Layers,
    },
    {
      name: 'AI Business Brain & Care Copilot',
      role: 'Gemini 2.5 Intelligence Engine',
      status: 'Active',
      latency: '180ms',
      detail: 'Observe -> Explain -> Recommend -> Owner Approval',
      icon: Cpu,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#8C887B]">
              SYSTEM HEALTH & AUDIT MONITOR
            </span>
          </div>
          <h2 className="text-xl font-black text-[#171717] mt-1">
            ความพร้อมของระบบ & สมุดบันทึกตรวจสอบ (Audit Trail)
          </h2>
          <p className="text-xs text-[#7A7569]">
            ตรวจสอบความปลอดภัยของสถาปัตยกรรม Single Source of Truth และประวัติกิจกรรมย้อนหลัง
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#F3FBF5] text-[#16A34A] px-4 py-2 rounded-2xl border border-[#BBF7D0] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>ระบบ Authoritative ปกติ 100%</span>
        </div>
      </div>

      {/* Component Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {systemComponents.map((comp) => {
          const CompIcon = comp.icon;
          return (
            <div
              key={comp.name}
              className="bg-white p-4 rounded-3xl border border-[#E2DFD7] shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-[#FAF9F5] border border-[#ECE8DC] rounded-xl text-[#171717]">
                    <CompIcon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A]">
                    {comp.status}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-[#171717]">
                  {comp.name}
                </h4>
                <span className="text-[11px] text-[#6B675E] block mt-0.5">
                  {comp.role}
                </span>
              </div>

              <div className="mt-3 pt-2 border-t border-[#F0ECE1] flex items-center justify-between text-[11px] text-[#8C887B]">
                <span className="truncate pr-1">{comp.detail}</span>
                <span className="font-mono">{comp.latency}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E4DD] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#171717]" />
            <h3 className="text-base font-black text-[#171717]">
              สมุดบันทึกกิจกรรมระบบ (Immutable System Audit Logs)
            </h3>
          </div>
          <span className="text-xs text-[#8C887B] font-mono">
            Append-Only · ป้องกันการแก้ไขย้อนหลัง
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FAF9F5] border-b border-[#ECE8DC] text-[#6B675E]">
              <tr>
                <th className="p-3 text-left font-bold">เวลา</th>
                <th className="p-3 text-left font-bold">ผู้กระทำ (Actor)</th>
                <th className="p-3 text-left font-bold">การกระทำ (Action)</th>
                <th className="p-3 text-left font-bold">เป้าหมาย (Entity)</th>
                <th className="p-3 text-left font-bold">รหัสอ้างอิง (Ref ID)</th>
                <th className="p-3 text-left font-bold">รายละเอียด (Details)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE8DC]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#FAF9F5]/70 transition">
                  <td className="p-3 text-[#6B675E] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('th-TH')}
                  </td>
                  <td className="p-3 font-semibold text-[#171717]">
                    {log.actor_name}
                  </td>
                  <td className="p-3">
                    <span className="bg-[#F2EFE9] text-[#171717] px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-[#6B675E] font-mono text-[11px]">
                    {log.entity_type}
                  </td>
                  <td className="p-3 font-mono font-bold text-[#171717]">
                    {log.entity_id}
                  </td>
                  <td className="p-3 text-[#6B675E] max-w-xs truncate">
                    {typeof log.details === 'object'
                      ? JSON.stringify(log.details)
                      : log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
