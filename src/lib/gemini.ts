import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    // When using @google/genai, it automatically picks up process.env.GEMINI_API_KEY
    // or import.meta.env.VITE_GEMINI_API_KEY
    const apiKey =
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      '';
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function askBusinessBrain(params: {
  salesSummary: string;
  lowStockItems: string;
  pendingAppointments: string;
  userQuestion: string;
}): Promise<string> {
  try {
    const ai = getGeminiClient();
    const systemPrompt = `You are the EQUAL1 AI Business Brain, an executive copilot for business owners managing Mini-Mart, Retail, and Salon/Beauty businesses.
Always structure your answers with clarity:
1. OBSERVE (Factual data observations)
2. EXPLAIN (Underlying causes/insights)
3. RECOMMEND (Specific, prioritized, actionable suggestions)
4. ACTION PROPOSAL (If any dangerous mutation like price change, refund, restock, or staff role change is suggested, explicitly require Owner Approval).
Keep language professional, concise, calm, and supportive in Thai.`;

    const prompt = `Context:
- Sales: ${params.salesSummary}
- Low Stock Items: ${params.lowStockItems}
- Appointments/Bookings: ${params.pendingAppointments}

Question/Command: ${params.userQuestion}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    return response.text || 'ไม่สามารถวิเคราะห์ข้อมูลได้ในขณะนี้';
  } catch (error: any) {
    console.warn('Gemini API query error:', error);
    return `[ระบบ AI วิเคราะห์ในเครื่อง] จากข้อมูลปัจจุบัน:
1. ข้อเท็จจริง: ${params.salesSummary}
2. สต๊อกที่ต้องตรวจ: ${params.lowStockItems || 'ปกติ'}
3. คิวบริการ: ${params.pendingAppointments}
คำแนะนำ: ควรเปิดรอบกะเงินสดให้ถูกต้อง และตรวจสต๊อกสินค้าที่ใกล้ถึง Reorder point`;
  }
}
