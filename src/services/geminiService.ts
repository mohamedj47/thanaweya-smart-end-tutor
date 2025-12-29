
import { GoogleGenAI, Modality } from "@google/genai";
import { Message, Sender, GradeLevel, Subject, Attachment } from "../types";
import { getCurriculumFor } from "../data/curriculum";

const SYSTEM_INSTRUCTION_TEMPLATE = `
أنت "المعلم الذكي"، نظام تعليمي شامل لطلاب الثانوية العامة المصرية (الصفوف 1، 2، 3).
أنت تغطي السنة الدراسية بالكامل (ترمين).
قدم الشرح بأسلوب "الزتونة" المختصر والمفيد.
`;

const buildSystemInstruction = (grade: GradeLevel, subject: Subject): string => {
  const curriculumList = getCurriculumFor(grade, subject);
  const curriculumString = curriculumList.length > 0 
    ? "- " + curriculumList.join('\n- ') 
    : 'المنهج الرسمي لوزارة التربية والتعليم المصرية.';

  return SYSTEM_INSTRUCTION_TEMPLATE
    .replace('[GRADE_LEVEL]', grade)
    .replace('[SUBJECT]', subject)
    .replace('[CURRICULUM_LIST]', curriculumString);
};

const prepareContents = (history: Message[]) => {
   return history.filter(msg => msg.text.trim() !== '' || msg.attachment).map(msg => {
      const parts: any[] = [];
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY ?? "" });
      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents,
          config: { systemInstruction }
      });
      return response.text ?? "";
  } catch (error) {
      console.error("Gemini Error:", error);
      return "حدث خطأ في الاتصال.";
  }
};

export const generateEducationalVideo = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY ?? "" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a JSON storyboard for: "${prompt}". Return ONLY valid JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return response.text ?? "{}";
  } catch (error) {
    console.error("Video Gen Error:", error);
    return JSON.stringify({ title: "Error", scenes: [] });
  }
};

export const synthesizeSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY ?? "" });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
