import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckSquare,
  HelpCircle,
  Sparkles,
  Award,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { TrainingCourse, TrainingModule, TrainingAssignment, UserRole } from '../types';
import { runtimeManager, TENANT_CONFIG } from '../lib/backendEngine';

interface StaffLearningWorkspaceProps {
  currentStaffName: string;
  currentRole: UserRole;
  courses: TrainingCourse[];
  assignments: TrainingAssignment[];
  onCompleteAssignment: (assignmentId: string, score: number) => void;
  onClockInToggle: () => void;
  isClockedIn: boolean;
}

export const StaffLearningWorkspace: React.FC<StaffLearningWorkspaceProps> = ({
  currentStaffName,
  currentRole,
  courses,
  assignments,
  onCompleteAssignment,
  onClockInToggle,
  isClockedIn,
}) => {
  const [activeTab, setActiveTab] = useState<'sops' | 'courses' | 'quiz' | 'ai_coach'>('sops');
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse>(courses[0] || null);

  // SOP state
  const [completedSopSteps, setCompletedSopSteps] = useState<Record<string, boolean>>({
    'sop-1': true,
    'sop-2': true,
  });

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // AI Staff Coach Chat
  const [coachInput, setCoachInput] = useState('');
  const [coachMessages, setCoachMessages] = useState<{ sender: 'user' | 'ai'; text: string; time: string }[]>([
    {
      sender: 'ai',
      text: `สวัสดีครับคุณ ${currentStaffName} ผมคือ AI Staff Coach ประจำสาขา มีคำถามเกี่ยวกับขั้นตอน SOP, การผสมสีซาลอน, หรือการเปิดกะ POS สอบถามได้เลยครับ!`,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const handleSopToggle = (id: string) => {
    setCompletedSopSteps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sampleQuiz = [
    {
      q: 'เมื่อลูกค้าชำระเงินด้วย PromptPay ต้องตรวจสอบจุดใดก่อนกดยืนยันใน POS?',
      options: [
        'ดูแค่สลิปในมือถือลูกค้าอย่างเดียว',
        'ตรวจสอบยอดเงิน, วันเวลา, และชื่อบัญชีผู้รับในระบบหรือแจ้งเตือนแอปธนาคารของร้าน',
        'ไม่ต้องตรวจสอบ สามารถปล่อยลูกค้าได้เลย',
      ],
      correct: 1,
    },
    {
      q: 'ก่อนเริ่มทำบริการเคมีหรือทำสีผม ข้อใดคือ SOP ขั้นแรกที่ต้องทำเสมอ?',
      options: [
        'พาไปสระผมทันทีโดยไม่ต้องตรวจ',
        'ตรวจสภาพเส้นผม หนังศีรษะ และซักประวัติการแพ้พร้อมประเมินสภาพผมร่วมกับลูกค้า',
        'ผสมน้ำยาเคมีทิ้งไว้ล่วงหน้า 1 ชั่วโมง',
      ],
      correct: 1,
    },
    {
      q: 'การตัดสต๊อกสินค้าหน้าร้านในระบบ EQUAL1 เกิดขึ้นจากขั้นตอนใด?',
      options: [
        'พนักงานนับสต๊อกสิ้นเดือนเท่านั้น',
        'ระบบตัดสต๊อกอัตโนมัติแบบ Real-time ทันทีที่ทำรายการชำระเงิน POS เสร็จสิ้น',
        'เจ้าของร้านต้องมาลบเองทีละชิ้น',
      ],
      correct: 1,
    },
  ];

  const handleQuizSubmit = () => {
    let score = 0;
    sampleQuiz.forEach((item, idx) => {
      if (quizAnswers[idx] === item.correct) {
        score += 1;
      }
    });
    const finalPct = Math.round((score / sampleQuiz.length) * 100);
    setQuizScore(finalPct);
    setQuizSubmitted(true);

    const assignment = assignments[0];
    if (assignment) {
      onCompleteAssignment(assignment.id, finalPct);
    }

    runtimeManager.emitEvent(
      'task.completed',
      {
        taskType: 'STAFF_TRAINING_QUIZ',
        staffName: currentStaffName,
        score: finalPct,
      },
      undefined,
      currentStaffName
    );
  };

  const handleCoachSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachInput.trim()) return;

    const userText = coachInput.trim();
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    setCoachMessages((prev) => [...prev, { sender: 'user', text: userText, time }]);
    setCoachInput('');

    // Simulated Smart AI Coach answers grounded in EQUAL1 protocols
    setTimeout(() => {
      let reply = 'รับทราบครับ ตามระเบียบปฏิบัติการมาตรฐาน (SOP) ของ EQUAL1 ขอแนะนำให้ปฏิบัติตามคู่มือความปลอดภัยและบันทึกลงในระบบ Team OS ทุกครั้งครับ';
      const qLower = userText.toLowerCase();
      if (qLower.includes('คืนเงิน') || qLower.includes('refund')) {
        reply = 'การขอคืนเงิน (Refund): แคชเชียร์ไม่สามารถอนุมัติได้โดยตรง ต้องกด "ขออนุมัติผู้จัดการ" ในระบบ Team OS เพื่อให้ Manager หรือ Owner อนุมัติรหัสก่อนเท่านั้นครับ';
      } else if (qLower.includes('สลิป') || qLower.includes('promptpay')) {
        reply = 'การตรวจสลิป: ให้ใช้เมนู "ตรวจสลิป (Slip Verification)" เพื่ออ่านข้อมูล QR Code และเทียบยอดกับคำสั่งซื้อก่อนส่งมอบสินค้าครับ';
      } else if (qLower.includes('สี') || qLower.includes('ซาลอน') || qLower.includes('ผม')) {
        reply = 'การทำสีผม: ให้ผสมน้ำยาตามสูตรอัตราส่วน 1:1 หรือ 1:1.5 ตามที่ระบุบนหลอดผลิตภัณฑ์ และทดสอบการแพ้ (Patch test) ก่อนลงโคนผมเสมอครับ';
      }

      setCoachMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-[#1F1F1F] text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#889A7B] text-white">
                STAFF LEARNING &amp; SOP WORKSPACE
              </span>
              <span className="text-xs text-[#AAA]">EQUAL1 Academy &amp; Practice</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              ศูนย์การเรียนรู้ &amp; ระเบียบปฏิบัติงาน (SOP)
            </h1>
            <p className="text-xs text-[#BBB] mt-1 max-w-xl">
              ผู้เรียน: <strong className="text-white">{currentStaffName}</strong> (สิทธิ์: {currentRole}) · ยกระดับมาตรฐานการบริการด้วยคู่มือ SOP, แบบทดสอบ และโค้ช AI ส่วนตัว
            </p>
          </div>

          {/* Clock In / Attendance quick trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClockInToggle}
              className={`px-5 py-3 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer ${
                isClockedIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-black'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{isClockedIn ? 'ลงเวลาปฏิบัติงานแล้ว (Clocked In)' : 'กดลงเวลาเข้างาน (Check-in)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto no-scrollbar text-xs sm:text-sm">
        <button
          onClick={() => setActiveTab('sops')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'sops' ? 'bg-[#1F1F1F] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>คู่มือปฏิบัติงาน SOP ประจำวัน</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'courses' ? 'bg-[#1F1F1F] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>หลักสูตรอบรม ({courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'quiz' ? 'bg-[#1F1F1F] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>แบบทดสอบ &amp; ประเมินผล (Quiz)</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_coach')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeTab === 'ai_coach' ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Staff Coach (ถาม-ตอบขั้นตอน)</span>
        </button>
      </div>

      {/* TAB 1: DAILY SOPs */}
      {activeTab === 'sops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>SOP กะเปิดร้าน &amp; เตรียมจุดบริการ (Opening Protocol)</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-400">เวลา 08:30 - 09:00</span>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'sop-1', label: 'ตรวจความสะอาดหน้าร้าน โต๊ะเคาน์เตอร์ และสต๊อกบนชั้นวาง' },
                { id: 'sop-2', label: 'เปิดระบบ POS ตรวจสอบเงินทอนตั้งต้น (Opening Cash) และกดเปิดกะ' },
                { id: 'sop-3', label: 'ฆ่าเชื้ออุปกรณ์ซาลอน เครื่องสัก และเปลี่ยนกระดาษรองเตียง' },
                { id: 'sop-4', label: 'ตรวจยอดออเดอร์เดลิเวอรี่ค้างส่งและแจ้งเตรียมแพ็คสินค้า' },
              ].map((step) => (
                <label
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                    completedSopSteps[step.id]
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!completedSopSteps[step.id]}
                    onChange={() => handleSopToggle(step.id)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={`text-xs font-semibold ${completedSopSteps[step.id] ? 'line-through opacity-75' : ''}`}>
                    {step.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-amber-600" />
                <span>SOP กะปิดร้าน &amp; สรุปยอดเงิน (Closing Protocol)</span>
              </h3>
              <span className="text-[11px] font-bold text-gray-400">เวลา 20:30 - 21:00</span>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'sop-5', label: 'นับเงินสดคงเหลือในลิ้นชักและกรอกยอดในระบบปิดกะเงินสด (Close Shift)' },
                { id: 'sop-6', label: 'ตรวจเช็คสลิปโอนเงินทั้งหมดว่าผ่านการตรวจสอบแล้วครบ 100%' },
                { id: 'sop-7', label: 'ทำความสะอาดปิดเครื่องมือไฟฟ้าและล็อคห้องคลังสินค้า' },
                { id: 'sop-8', label: 'ส่งสรุปผลการปฏิบัติงานให้ผู้จัดการสาขา (Supervisor)' },
              ].map((step) => (
                <label
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                    completedSopSteps[step.id]
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!completedSopSteps[step.id]}
                    onChange={() => handleSopToggle(step.id)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={`text-xs font-semibold ${completedSopSteps[step.id] ? 'line-through opacity-75' : ''}`}>
                    {step.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSES & MODULES */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-black text-gray-900 px-1">หลักสูตรที่ได้รับมอบหมาย</h3>
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                  selectedCourse?.id === course.id
                    ? 'bg-[#1F1F1F] text-white border-black shadow-md'
                    : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {course.category}
                  </span>
                  <span className="text-[10px] opacity-75">{course.duration_minutes} นาที</span>
                </div>
                <strong className="text-xs font-bold">{course.title}</strong>
                <p className={`text-[11px] line-clamp-2 ${selectedCourse?.id === course.id ? 'text-gray-300' : 'text-gray-500'}`}>
                  {course.description}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-5">
            {selectedCourse ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                      หมวด: {selectedCourse.category} · รหัส {selectedCourse.code}
                    </span>
                    <h2 className="text-xl font-black text-gray-900 mt-0.5">{selectedCourse.title}</h2>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>เหรียญ: {selectedCourse.badge_name}</span>
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-700 leading-relaxed">
                  {selectedCourse.description}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900">โมดูลการเรียนรู้ (Learning Modules)</h4>
                  <div className="space-y-2">
                    {[
                      { title: 'บทที่ 1: มาตรฐานการบริการลูกค้าและสุขอนามัยหน้าร้าน', time: '10 นาที', type: 'SOP Guide' },
                      { title: 'บทที่ 2: การใช้งานฟังก์ชัน POS และการตรวจสอบสลิปโอนเงิน', time: '15 นาที', type: 'Video Tutorial' },
                      { title: 'บทที่ 3: การจัดการคิวงานซาลอน และการบันทึกบริการลูกค้า', time: '15 นาที', type: 'Practice' },
                    ].map((mod, i) => (
                      <div key={i} className="p-3.5 bg-white rounded-xl border border-gray-200/80 flex items-center justify-between hover:border-gray-300 transition">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-xs">
                            {i + 1}
                          </div>
                          <div>
                            <strong className="text-xs block text-gray-900">{mod.title}</strong>
                            <span className="text-[10px] text-gray-400">{mod.type} · {mod.time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setActiveTab('quiz')}
                          className="px-3 py-1.5 bg-[#1F1F1F] text-white rounded-lg text-xs font-bold hover:bg-black transition cursor-pointer"
                        >
                          เรียนรู้
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-400 text-xs">เลือกหลักสูตรทางซ้ายเพื่อเริ่มเรียนรู้</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUIZ & ASSESSMENT */}
      {activeTab === 'quiz' && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-gray-900">แบบทดสอบประเมินความรู้ประจำสัปดาห์</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ตอบคำถามให้ถูกต้องอย่างน้อย 80% เพื่อผ่านเกณฑ์และรับตราสัญลักษณ์ความชำนาญ
            </p>
          </div>

          <div className="space-y-6">
            {sampleQuiz.map((item, qIdx) => (
              <div key={qIdx} className="space-y-2.5">
                <strong className="text-xs font-bold text-gray-800 block">
                  ข้อ {qIdx + 1}: {item.q}
                </strong>
                <div className="space-y-1.5">
                  {item.options.map((opt, oIdx) => (
                    <label
                      key={oIdx}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition ${
                        quizAnswers[qIdx] === oIdx
                          ? 'bg-black text-white border-black font-semibold'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qIdx}`}
                        checked={quizAnswers[qIdx] === oIdx}
                        onChange={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                        className="mt-0.5"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {quizSubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <strong className="text-sm font-black text-emerald-900 block">
                ผลการทดสอบ: {quizScore}% ({quizScore >= 80 ? 'ผ่านเกณฑ์ยอดเยี่ยม 🎉' : 'ต้องทบทวนเพิ่มเติม'})
              </strong>
              <p className="text-xs text-emerald-700">
                ผลคะแนนถูกบันทึกลงฐานข้อมูลและส่งให้ผู้จัดการตรวจสอบเรียบร้อยแล้ว
              </p>
            </div>
          ) : (
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length < sampleQuiz.length}
              className="w-full py-3 bg-[#1F1F1F] hover:bg-black text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-40 cursor-pointer"
            >
              ส่งคำตอบเพื่อประเมินผล (Submit Quiz)
            </button>
          )}
        </div>
      )}

      {/* TAB 4: AI STAFF COACH */}
      {activeTab === 'ai_coach' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[560px]">
          <div className="p-4 bg-gradient-to-r from-purple-800 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <div>
                <strong className="text-sm font-black block">EQUAL1 Staff AI Assistant</strong>
                <span className="text-[11px] text-purple-200">ผู้ช่วยตอบคำถามขั้นตอน SOP และวิธีแก้ไขปัญหาเฉพาะหน้า 24 ชม.</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8F5]">
            {coachMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#1F1F1F] text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleCoachSend} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={coachInput}
              onChange={(e) => setCoachInput(e.target.value)}
              placeholder="พิมพ์คำถาม เช่น การขอคืนเงินต้องทำอย่างไร, อัตราผสมสีทำผม..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:bg-white focus:border-black transition"
            />
            <button
              type="submit"
              disabled={!coachInput.trim()}
              className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ถามโค้ช</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
