export interface QuestionEntry {
  id: string;
  number: string; // 'nomor'
  title: string; // 'title' (Topik/Judul singkat)
  questionText: string; // 'pertanyaan' (Teks pertanyaan lengkap)
  kbAnswer: string; // 'jawaban kb' (Jawaban dari Knowledge Base, untuk konteks/referensi)
  previousLlmAnswer?: string; // 'jawaban llm' (Jawaban LLM dari file, untuk dievaluasi)
}

export interface EvaluationResult {
  isAppropriate: boolean | null;
  score?: number; // Skor numerik dari LLM (0.0 - 1.0)
  justification: string;
  llmSuggestedAnswer?: string; // Saran jawaban BARU dari LLM setelah evaluasi
  error?: string;
}

export interface EvaluatedQuestion extends QuestionEntry {
  evaluation?: EvaluationResult;
  isEvaluating?: boolean;
}

export enum EvaluationStatus {
  Pending = 'Pending',
  Evaluating = 'Evaluating',
  Success = 'Success',
  Error = 'Error',
}