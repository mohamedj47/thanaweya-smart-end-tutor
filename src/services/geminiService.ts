import { GoogleGenAI, Modality } from "@google/genai";
import { Message, Sender, GradeLevel, Subject, Attachment } from "../types";
import { getCurriculumFor } from "../data/curriculum";

const SYSTEM_INSTRUCTION_TEMPLATE = `
أنت "المعلم الذكي"، نظام تعليمي شامل لطلاب الثانوية العامة المصرية (الصفوف 1، 2، 3).

**نطاق معرفتك (هام جداً - Critical Scope):**
1. **أنت تغطي السنة الدراسية بالكامل**: (الفصل الدراسي الأول + الفصل الدراسي الثاني).
2. **المنهج الديناميكي**: القائمة المرفقة بالأسفل هي **عناوين استرشادية فقط**. إذا سألك الطالب عن درس من "الترم الثاني" غير مذكور في القائمة، **يجب أن تشرحه فوراً** وبدقة كاملة.
3. **تحديث تلقائي**: اعتبر نفسك دائماً محدثاً بآخر مقررات وزارة التربية والتعليم لعام 2025/2026.

**سياسة الامتحانات والأسئلة**:
1. ✅ **امتحانات السنوات السابقة (شاملة 2024):** اعرض الأسئلة فوراً عند طلبها.
2. 🔄 **المحاكاة**: إذا لم يتوفر نص الامتحان الحرفي، قل: "إليك أسئلة تحاكي امتحان الدور الأول/الثاني بدقة..." ثم اسرد الأسئلة.
3. 📝 **الأسلوب**: قدم الأسئلة بنظام MCQ والمقالي حسب مواصفات الورقة الامتحانية.

**قواعد العرض (Strict Output Rules)**:
- استخدم نقاط (Bullet points) للشرح.
- ممنوع المقدمات الطويلة (ادخل في الموضوع فوراً).
- الاختصار "الزتونة" هو الأولوية.

**الرسوم البيانية (JSON Charts)**:
استخدم كود JSON فقط داخل بلوك \`chart\` للرسوم البيانية. مثال:
\`\`\`chart
{ "type": "bar", "title": "مقارنة", "data": [{ "x": "أ", "y": 10 }] }
\`\`\`

**سياق الطالب الحالي**:
- الصف: [GRADE_LEVEL]
- المادة: [SUBJECT]

**عناوين المنهج الاسترشادية:**
[CURRICULUM_LIST]
`;

const buildSystemInstruction = (grade: GradeLevel, subject: Subject): string => {
  const curriculumList = getCurriculumFor(grade, subject);
  const curriculumString = curriculumList.length > 0 
    ? "- " + curriculumList.join('\n- ') 
    : 'المنهج الرسمي لوزارة التربية والتعليم المصرية (ترمين).';

  return SYSTEM_INSTRUCTION_TEMPLATE
    .replace('[GRADE_LEVEL]', grade)
    .replace('[SUBJECT]', subject)
    .replace('[CURRICULUM_LIST]', curriculumString);
};

const prepareContents = (history: Message[]) => {
   const validHistory = history.filter(msg => msg.text.trim() !== '' || msg.attachment);

   return validHistory.map(msg => {
      const parts: any[] = [];
      
      // Fixed: Comparison is now valid as Attachment.type includes 'video' and 'storyboard'
      if (msg.attachment && msg.attachment.type !== 'video' && msg.attachment.type !== 'storyboard') {
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

export const sendToGemini = async (
  history: Message[],
  grade: GradeLevel,
  subject: Subject,
  attachment?: Attachment
): Promise<string> => {
  const systemInstruction = buildSystemInstruction(grade, subject);
  const contents = prepareContents(history);

  try {
      // Use process.env.API_KEY directly as per guidelines and use recommended model for complex reasoning
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents,
          config: {
              systemInstruction: systemInstruction,
          }
      });

      return response.text || "";

  } catch (error) {
      console.error("Gemini Service Error:", error);
      return "عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.";
  }
};

export const generateEducationalVideo = async (prompt: string): Promise<string> => {
  try {
    // Use process.env.API_KEY directly as per guidelines and use recommended model
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
Generate a JSON-only storyboard for an educational video about: "${prompt}".
Format: Return ONLY a valid JSON object.
Schema:
{
  "title": "Title",
  "scenes": [
    {
      "visual": "Visual description",
      "narration": "Arabic script for high school student",
      "svg_illustration": "<svg>...</svg>"
    }
  ]
}
Instructions:
1. Create 3-5 scenes.
2. svg_illustration must be a valid SVG string depicting the concept simply.
      `,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return JSON.stringify({ title: "لا يوجد محتوى", scenes: [] });
    
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) cleanedText = cleanedText.replace(/^```json/, '').replace(/```$/, '');
    else if (cleanedText.startsWith('```')) cleanedText = cleanedText.replace(/^```/, '').replace(/```$/, '');
    
    return cleanedText.trim();

  } catch (error) {
    console.error("Storyboard Generation Error:", error);
    return JSON.stringify({ title: "خطأ", scenes: [] });
  }
};

export const synthesizeSpeech = async (text: string): Promise<string | null> => {
  try {
    // Use process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};
