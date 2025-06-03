
import React from 'react';
import { SparklesIcon, DownloadIcon } from './IconComponents';

interface EvaluationControlsProps {
  evaluationPrompt: string;
  setEvaluationPrompt: (prompt: string) => void;
  onTriggerBatchEvaluation: () => void; // Diubah dari onEvaluateAll
  onExportHTML: () => void;
  hasData: boolean;
  isEvaluatingAny: boolean;
}

const EvaluationControls: React.FC<EvaluationControlsProps> = ({
  evaluationPrompt,
  setEvaluationPrompt,
  onTriggerBatchEvaluation, // Diubah
  onExportHTML,
  hasData,
  isEvaluatingAny,
}) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-xl transition-colors duration-300">
      <h2 className="text-xl font-semibold mb-3 text-sky-700">Konfigurasi Evaluasi</h2>
      <div>
        <label htmlFor="evaluationPrompt" className="block text-sm font-medium text-slate-700 mb-1">
          Prompt Kriteria Evaluasi LLM:
        </label>
        <textarea
          id="evaluationPrompt"
          value={evaluationPrompt}
          onChange={(e) => setEvaluationPrompt(e.target.value)}
          rows={4}
          className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-900 placeholder-slate-400 text-sm transition-colors duration-300"
          placeholder="Jelaskan bagaimana LLM harus menilai jawaban..."
        />
      </div>
      <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={onTriggerBatchEvaluation} // Diubah
          disabled={!hasData || isEvaluatingAny}
          className="flex-1 flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm disabled:bg-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          aria-label="Mulai evaluasi batch"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          {isEvaluatingAny ? 'Sedang Mengevaluasi...' : 'Mulai Evaluasi Pilihan'}
        </button>
        <button
          onClick={onExportHTML}
          disabled={!hasData || isEvaluatingAny} // Juga disable jika sedang mengevaluasi
          className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm disabled:bg-slate-400 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          aria-label="Ekspor hasil sebagai HTML"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          Ekspor Hasil sebagai HTML
        </button>
      </div>
    </div>
  );
};

export default EvaluationControls;
