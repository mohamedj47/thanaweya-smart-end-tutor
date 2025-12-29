
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, Sender, GradeLevel, Subject, Attachment } from "../types";
import { getCurriculumFor } from "../data/curriculum";

const SYSTEM_INSTRUCTION_TEMPLATE = `
أنت "المعلم الذكي"، نظام تعليمي شامل لطلاب الثانوية العامة المصرية (الصفوف 1، 2، 3).
أنت تغطي السنة الدراسية بالكامل (ترم أول وترم ثاني).
القائمة المرفقة استرشادية، اشرح أي درس يطلبه الطالب فوراً.
`;

const buildSystemInstruction = (grade: GradeLevel, subject: Subject): string => {
  const curriculumList = getCurriculumFor(grade, subject);
  const curriculumString = curriculumList.length > 0 ? "- " + curriculumList.join('\n- ') : 'المنهج الرسمي.';
  return SYSTEM_INSTRUCTION_TEMPLATE.replace('[GRADE_LEVEL]', grade).replace('[SUBJECT]', subject).replace('[CURRICULUM_LIST]', curriculumString);
};

export const sendToGemini = async (history: Message[], grade: GradeLevel, subject: Subject, attachment?: Attachment): Promise<string> => {
  const systemInstruction = buildSystemInstruction(grade, subject);
  try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: history.map(msg => ({
            role: msg.sender === Sender.USER ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          config: { systemInstruction }
      });
      return response.text || "";
  } catch (error) {
      return "عذراً، حدث خطأ في الاتصال.";
  }
};

export const synthesizeSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    return null;
  }
};
