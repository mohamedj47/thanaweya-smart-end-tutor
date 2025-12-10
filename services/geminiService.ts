
import { GoogleGenAI } from "@google/genai";
import { Message, Sender, GradeLevel, Subject, Attachment } from "../types";
import { getCurriculumFor } from "../data/curriculum";

const SYSTEM_INSTRUCTION_TEMPLATE = `
أنت نظام تعليم ذكي متخصص لطلاب الثانوية العامة المصرية (الصفوف: الأول، الثاني، والثالث).

**فلسفة العمل**: "الزتونة" (المفيد المختصر).
مهمتك هي تقديم المعلومات الدراسية بشكل **كبسولات مركزة جداً**.

**سياسة الامتحانات والأسئلة (هام جداً - Strict Policy)**:
1. ✅ **امتحانات السنوات السابقة (بما فيها 2024):** هذه **معلومات عامة ومتاحة** للتدريب وليست سرية. عند طلبها، **يجب** عرض الأسئلة فوراً.
2. 🚫 **ممنوع الرفض**: لا تقل "لا أستطيع توفير الامتحان" أو "هذا غير مصرح به".
3. 🔄 **المحاكاة الذكية**: إذا لم يكن لديك نص الامتحان الحرفي (صورة طبق الأصل)، قل: "إليك نماذج أسئلة تحاكي امتحان 2024 الرسمي بنفس الأفكار ونواتج التعلم" ثم ابدأ في سرد الأسئلة فوراً.
4. 📝 **نمط الأسئلة**: قدم الأسئلة بنظام (MCQ) الجديد أو المقالي حسب المادة، مع الإجابة النموذجية.

**تعليمات صارمة للعرض**:
1. 🚫 **لا تكتب فقرات طويلة**: أي شرح يجب أن يكون في شكل نقاط (Bullet points).
2. ⚡ **الاختصار الشديد**: المعلومة التي يمكن قولها في سطر، لا تقلها في ثلاثة.
3. 🎯 **بدون مقدمات**: ادخل في صلب الموضوع (شرح أو أسئلة) فوراً.

**الرسوم البيانية (JSON Charts)**:
عندما يتطلب الشرح رسماً بيانياً، اكتب كود JSON فقط داخل بلوك \`chart\`.
**هام جداً**: يجب أن يكون الـ JSON صالحاً تماماً (Valid JSON) وفي سطر واحد للقيم النصية.
- 🚫 ممنوع نهائياً استخدام فواصل الأسطر (Newlines) داخل القيم النصية (String Values).
- ✅ اكتب النص كله في سطر واحد داخل علامات التنصيص.
- استخدم علامات التنصيص المزدوجة " فقط.

مثال صحيح:
\`\`\`chart
{ "type": "line", "title": "العلاقة بين الزمن والسرعة", "xAxisLabel": "الزمن", "yAxisLabel": "السرعة", "data": [{"x":0,"y":0},{"x":1,"y":2}] }
\`\`\`

**سياق الطالب**:
- الصف: [GRADE_LEVEL]
- المادة: [SUBJECT]

[CURRICULUM_LIST]
`;

// Helper to construct the system prompt
const buildSystemInstruction = (grade: GradeLevel, subject: Subject): string => {
  const curriculumList = getCurriculumFor(grade, subject);
  const curriculumString = curriculumList.length > 0 
    ? curriculumList.join('\n- ') 
    : 'المنهج الرسمي لوزارة التربية والتعليم المصرية.';

  return SYSTEM_INSTRUCTION_TEMPLATE
    .replace('[GRADE_LEVEL]', grade)
    .replace('[SUBJECT]', subject)
    .replace('[CURRICULUM_LIST]', curriculumString);
};

// Helper to prepare contents
const prepareContents = (history: Message[]) => {
   // Remove the last message if it's an empty/loading bot message
   const validHistory = history.filter(msg => msg.text.trim() !== '' || msg.attachment);

   return validHistory.map(msg => {
      const parts: any[] = [];
      
      if (msg.attachment) {
        parts.push({
          inlineData: {
            mimeType: msg.attachment.mimeType,
            data: msg.attachment.data
          }
        });
      }

      if (msg.text) {
        parts.push({ text: msg.text });
      }
      
      return {
        role: msg.sender === Sender.USER ? 'user' : 'model',
        parts: parts
      };
    });
};

/**
 * Direct Client-Side SDK Function
 */
export const sendToGemini = async (
  history: Message[],
  grade: GradeLevel,
  subject: Subject,
  attachment?: Attachment
): Promise<string> => {
  const systemInstruction = buildSystemInstruction(grade, subject);
  const contents = prepareContents(history);

  try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key not found");

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
              systemInstruction: systemInstruction,
          }
      });

      return response.text || "";

  } catch (error) {
      console.error("Gemini Service Error:", error);
      return "عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى التحقق من الإنترنت والمحاولة مرة أخرى.";
  }
};

/**
 * Legacy wrapper to maintain compatibility
 */
export const generateStreamResponse = async (
  userMessage: string,
  grade: GradeLevel,
  subject: Subject,
  history: Message[],
  onChunk: (text: string) => void,
  attachment?: Attachment
): Promise<string> => {
    const fullText = await sendToGemini([...history], grade, subject, attachment);
    onChunk(fullText);
    return fullText;
};
