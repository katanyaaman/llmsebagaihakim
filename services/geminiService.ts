import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { EvaluationResult } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

let ai: GoogleGenAI | null = null;

// Langsung menggunakan variabel lingkungan sesuai panduan
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn(
    "Kunci API Gemini tidak ditemukan. Harap atur variabel lingkungan GEMINI_API_KEY. Fungsionalitas AI akan dinonaktifkan."
  );
}

export const getApiKeyStatus = (): boolean => !!process.env.GEMINI_API_KEY;

export const evaluateAnswerWithLLM = async (
  questionText: string,
  llmAnswerToEvaluate: string | undefined, 
  kbAnswerAsContext: string, 
  customEvaluationPrompt: string
): Promise<EvaluationResult> => {
  if (!ai) {
    return {
      isAppropriate: false,
      score: 0,
      justification: "Kunci API Gemini tidak dikonfigurasi. Evaluasi dinonaktifkan.",
      error: "Kunci API hilang",
      llmSuggestedAnswer: undefined,
    };
  }

  const effectiveLlmAnswer = llmAnswerToEvaluate && llmAnswerToEvaluate.trim() !== "" ? llmAnswerToEvaluate : "Tidak ada jawaban yang diberikan.";

  const systemInstruction = `Anda adalah seorang hakim ahli yang bertugas mengevaluasi 'Jawaban LLM yang Diberikan' (yang berasal dari input pengguna) terhadap 'Pertanyaan Lengkap'.
'Jawaban KB yang Diberikan' juga disediakan sebagai konteks atau pembanding kualitas.

Kriteria Evaluasi Utama untuk 'Jawaban LLM yang Diberikan' (selain kriteria di bawah dari pengguna):
- Akurasi Faktual: Apakah informasi yang diberikan benar?
- Relevansi: Apakah jawaban tersebut langsung menjawab 'Pertanyaan Lengkap'?
- Kelengkapan: Apakah jawaban tersebut mencakup aspek-aspek penting dari pertanyaan?
- Kejelasan dan Keringkasan: Apakah jawaban mudah dipahami dan langsung ke pokok permasalahan?
- Nada: Apakah nada jawaban netral dan profesional?

Kriteria Tambahan dari Pengguna:
${customEvaluationPrompt}

Detail untuk Evaluasi:
Pertanyaan Lengkap: "${questionText}"
Jawaban KB yang Diberikan (Konteks/Referensi): "${kbAnswerAsContext}"
Jawaban LLM yang Diberikan (Untuk Dievaluasi): "${effectiveLlmAnswer}"

Tugas Anda:
1.  Nilai 'Jawaban LLM yang Diberikan'. Apakah jawaban tersebut sesuai dan berkualitas tinggi untuk 'Pertanyaan Lengkap', dengan mempertimbangkan juga 'Jawaban KB yang Diberikan' sebagai konteks?
2.  Berikan skor numerik antara 0.0 (sangat buruk/tidak relevan/salah) hingga 1.0 (sangat baik/akurat/lengkap/ideal) untuk 'Jawaban LLM yang Diberikan'. Skor harus mencerminkan kualitas keseluruhan jawaban terhadap pertanyaan.
3.  Berikan justifikasi yang ringkas untuk penilaian dan skor Anda. Jelaskan mengapa 'Jawaban LLM yang Diberikan' mendapatkan skor tersebut, dan bagaimana perbandingannya dengan 'Jawaban KB yang Diberikan' jika itu relevan dalam penilaian Anda.
4.  Jika 'Jawaban LLM yang Diberikan' bisa diperbaiki atau jika Anda bisa memberikan jawaban yang lebih ideal terhadap 'Pertanyaan Lengkap', berikan saran jawaban tersebut dalam field 'llmSuggestedAnswer'. Jika 'Jawaban LLM yang Diberikan' sudah ideal atau tidak ada saran signifikan, Anda bisa mengosongkan field 'llmSuggestedAnswer' atau mengisinya dengan string kosong.

Hanya respon dengan objek JSON dengan field berikut (pastikan semua field ada):
- "isAppropriate": boolean (berikan penilaian Anda apakah 'Jawaban LLM yang Diberikan' secara umum dianggap sesuai atau dapat diterima untuk 'Pertanyaan Lengkap')
- "score": number (skor numerik antara 0.0 dan 1.0, HARUS berupa angka)
- "justification": string (penjelasan untuk penilaian dan skor Anda)
- "llmSuggestedAnswer": string (Saran perbaikan atau jawaban ideal dari LLM untuk 'Pertanyaan Lengkap'. String kosong jika tidak ada saran.)
`; 

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: systemInstruction,
        config: {
            responseMimeType: "application/json",
            temperature: 0.2, 
            topP: 0.85,
            topK: 40,
        }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr);

    if (
        typeof parsedData.score !== 'number' || 
        isNaN(parsedData.score) || 
        parsedData.score < 0 || parsedData.score > 1 || 
        typeof parsedData.justification !== 'string' ||
        typeof parsedData.llmSuggestedAnswer !== 'string' // Pastikan llmSuggestedAnswer ada sebagai string
        // typeof parsedData.isAppropriate !== 'boolean' // isAppropriate dari LLM kini bersifat saran
    ) {
      console.error("Respons LLM tidak dalam format JSON yang diharapkan atau nilai skor/suggestedAnswer tidak valid:", parsedData);
      throw new Error("Respons LLM tidak dalam format JSON yang diharapkan atau nilai skor/suggestedAnswer tidak valid.");
    }

    const clientDeterminedIsAppropriate = parsedData.score >= 0.8;

    return {
      isAppropriate: clientDeterminedIsAppropriate,
      score: parsedData.score,
      justification: parsedData.justification,
      llmSuggestedAnswer: parsedData.llmSuggestedAnswer.trim() !== "" ? parsedData.llmSuggestedAnswer : undefined, 
    };

  } catch (error) {
    console.error("Kesalahan saat mengevaluasi dengan LLM:", error);
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui selama evaluasi LLM.";
    return {
      isAppropriate: false,
      score: 0,
      justification: `Gagal mendapatkan evaluasi dari LLM. ${errorMessage}`,
      error: errorMessage,
      llmSuggestedAnswer: undefined,
    };
  }
};