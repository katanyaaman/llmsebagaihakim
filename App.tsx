
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EvaluatedQuestion, QuestionEntry, EvaluationResult } from './types';
import { parseCSV } from './services/csvParserService';
import { parseXLSX } from './services/excelParserService';
import { evaluateAnswerWithLLM, getApiKeyStatus } from './services/geminiService';
import { generateHTMLReport } from './services/reportService';
import { DEFAULT_EVALUATION_PROMPT, API_KEY_INFO } from './constants';
import FileUpload from './components/FileUpload';
import EvaluationControls from './components/EvaluationControls';
import QuestionItem from './components/QuestionItem';
import ErrorModal from './components/ErrorModal';
import ReportInfoModal from './components/ReportInfoModal';
import BatchEvaluationModal from './components/BatchEvaluationModal';
import { TrashIcon, CheckCircleIcon, XCircleIcon, RefreshIcon, ExclamationTriangleIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [questionsData, setQuestionsData] = useState<EvaluatedQuestion[]>([]);
  const [evaluationPrompt, setEvaluationPrompt] = useState<string>(DEFAULT_EVALUATION_PROMPT);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isEvaluatingAll, setIsEvaluatingAll] = useState<boolean>(false); 
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);

  const [isCsvErrorModalOpen, setIsCsvErrorModalOpen] = useState<boolean>(false);
  const [csvErrorModalMessage, setCsvErrorModalMessage] = useState<string | null>(null);

  const [processedCount, setProcessedCount] = useState<number>(0);
  const [totalToProcess, setTotalToProcess] = useState<number>(0);

  const [isReportInfoModalOpen, setIsReportInfoModalOpen] = useState<boolean>(false);
  const [isBatchEvaluationModalOpen, setIsBatchEvaluationModalOpen] = useState<boolean>(false); 

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!getApiKeyStatus()) {
      setApiKeyMissing(true);
      setGlobalError(API_KEY_INFO);
    }
  }, []);

  const handleCloseCsvErrorModal = () => {
    setIsCsvErrorModalOpen(false);
  };

  const handleFileUpload = useCallback((fileContent: string | ArrayBuffer, fileType: 'csv' | 'xlsx') => {
    try {
      let parsedData: QuestionEntry[];
      if (fileType === 'csv') {
        parsedData = parseCSV(fileContent as string);
      } else if (fileType === 'xlsx') {
        parsedData = parseXLSX(fileContent as ArrayBuffer);
      } else {
        throw new Error("Tipe file tidak didukung untuk parsing.");
      }

      if (parsedData.length === 0 && fileContent) {
        const noDataMessage = `File ${fileType.toUpperCase()} diproses, tetapi tidak ada baris data yang valid ditemukan. Harap periksa konten file, pastikan baris sesuai struktur header, dan tidak ada baris kosong berlebihan.`;
        setCsvErrorModalMessage(noDataMessage);
        setIsCsvErrorModalOpen(true);
        setGlobalError(`Tidak ada data valid yang ditemukan di file ${fileType.toUpperCase()}. Harap periksa format.`);
        setQuestionsData([]);
        return;
      }
      setQuestionsData(parsedData.map(q => ({ ...q, isEvaluating: false })));
      setGlobalError(null);
      setCsvErrorModalMessage(null);
      if (parsedData.length > 0) {
        setIsCsvErrorModalOpen(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Gagal mem-parsing file ${fileType.toUpperCase()}.`;
      console.error(`Kesalahan Parsing ${fileType.toUpperCase()}:`, error);
      setCsvErrorModalMessage(errorMessage);
      setIsCsvErrorModalOpen(true);
      setGlobalError(null);
      setQuestionsData([]);
    }
  }, []);

  const handleEvaluateSingle = useCallback(async (id: string) => {
    if (apiKeyMissing) {
      setGlobalError(API_KEY_INFO);
      return;
    }
    setQuestionsData(prev => prev.map(q => q.id === id ? { ...q, isEvaluating: true, evaluation: undefined } : q));
    setGlobalError(null);

    const questionToEvaluate = questionsData.find(q => q.id === id);
    if (questionToEvaluate) {
      if (questionToEvaluate.previousLlmAnswer === undefined || questionToEvaluate.previousLlmAnswer.trim() === "") {
        const noLlmAnswerMsg = "Tidak ada 'Jawaban LLM' yang diberikan dalam file untuk dievaluasi pada item ini.";
        setQuestionsData(prev => prev.map(q => q.id === id ? { ...q, evaluation: {isAppropriate: false, score:0, justification: noLlmAnswerMsg, error: noLlmAnswerMsg }, isEvaluating: false } : q));
        setGlobalError(`Peringatan untuk item #${questionToEvaluate.number}: ${noLlmAnswerMsg}`);
        return;
      }
      try {
        const result = await evaluateAnswerWithLLM(
          questionToEvaluate.questionText,
          questionToEvaluate.previousLlmAnswer,
          questionToEvaluate.kbAnswer,
          evaluationPrompt
        );
        setQuestionsData(prev => prev.map(q => q.id === id ? { ...q, evaluation: result, isEvaluating: false } : q));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui selama evaluasi."
        setQuestionsData(prev => prev.map(q => q.id === id ? { ...q, evaluation: {isAppropriate: null, score:0, justification: `Evaluasi gagal: ${errorMessage}`, error: errorMessage}, isEvaluating: false } : q));
        setGlobalError(`Kesalahan evaluasi untuk item #${questionToEvaluate.number}: ${errorMessage}`);
      }
    }
  }, [questionsData, evaluationPrompt, apiKeyMissing]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const executeBulkEvaluation = useCallback(async (itemsToProcess: EvaluatedQuestion[]) => {
    if (itemsToProcess.length === 0) {
        setGlobalError("Tidak ada item dengan 'Jawaban LLM' yang valid untuk dievaluasi berdasarkan pilihan Anda.");
        setIsEvaluatingAll(false);
        setProcessedCount(0);
        setTotalToProcess(0);
        return;
    }

    abortControllerRef.current = new AbortController();
    const currentAbortSignal = abortControllerRef.current.signal;

    setIsEvaluatingAll(true); 
    setIsPaused(false);
    isPausedRef.current = false;
    setGlobalError(null);
    setTotalToProcess(itemsToProcess.length);
    setProcessedCount(0);

    setQuestionsData(prev => prev.map(q => {
        if (itemsToProcess.some(itp => itp.id === q.id)) {
            return { ...q, isEvaluating: true, evaluation: undefined };
        }
        if ((!q.previousLlmAnswer || q.previousLlmAnswer.trim() === "") && !q.evaluation) {
           return { ...q, 
                    isEvaluating: false, 
                    evaluation: { isAppropriate: false, score: 0, justification: "Tidak ada 'Jawaban LLM' yang diberikan dalam file untuk dievaluasi.", error: "Jawaban LLM kosong"} 
                  };
        }
        return q; 
    }));


    const results: { id: string, result: EvaluationResult }[] = [];
    let currentProcessed = 0;

    try {
        for (const item of itemsToProcess) {
            if (currentAbortSignal.aborted) {
                setGlobalError("Proses evaluasi semua item telah dibatalkan oleh pengguna.");
                break; 
            }

            while (isPausedRef.current && !currentAbortSignal.aborted) {
                await delay(300); 
            }

            if (currentAbortSignal.aborted) {
                setGlobalError("Proses evaluasi semua item telah dibatalkan oleh pengguna.");
                break;
            }
            
            try {
                const result = await evaluateAnswerWithLLM(
                    item.questionText,
                    item.previousLlmAnswer, 
                    item.kbAnswer,
                    evaluationPrompt
                );
                results.push({ id: item.id, result });
                setQuestionsData(prev => prev.map(q => q.id === item.id ? { ...q, evaluation: result, isEvaluating: false } : q));
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui selama evaluasi."
                const errorResult = {isAppropriate: null, score:0, justification: `Evaluasi gagal: ${errorMessage}`, error: errorMessage};
                results.push({ id: item.id, result: errorResult });
                setQuestionsData(prev => prev.map(q => q.id === item.id ? { ...q, evaluation: errorResult, isEvaluating: false } : q));
                setGlobalError(prevError => `${prevError ? prevError + '; ' : ''}Kesalahan untuk item #${item.number}: ${errorMessage}`);
            }
            currentProcessed++;
            setProcessedCount(currentProcessed);
            await delay(100); // Small delay to prevent UI freeze and allow updates
        }
    } catch (loopError) {
        console.error("Kesalahan tak terduga dalam loop evaluasi semua:", loopError);
        setGlobalError("Terjadi kesalahan tak terduga selama proses evaluasi semua.");
    } finally {
        setIsEvaluatingAll(false);
        setIsPaused(false);
        isPausedRef.current = false;
        
        setQuestionsData(prev => prev.map(q => {
            const foundResult = results.find(r => r.id === q.id);
            if (foundResult) {
                return { ...q, evaluation: foundResult.result, isEvaluating: false };
            }
            if (q.isEvaluating) { 
                return { ...q, isEvaluating: false, evaluation: q.evaluation || {isAppropriate: null, score: 0, justification: "Evaluasi dibatalkan sebelum diproses.", error: "Dibatalkan"} };
            }
            return q; 
        }));

        if (currentAbortSignal.aborted && !globalError?.includes("dibatalkan")) {
             setGlobalError(prev => {
                const cancelMsg = "Proses evaluasi telah dibatalkan oleh pengguna.";
                if (prev && !prev.includes(cancelMsg)) return `${prev} ${cancelMsg}`;
                return cancelMsg;
            });
        }
        abortControllerRef.current = null;
    }
  }, [evaluationPrompt, apiKeyMissing, globalError]);

  const handleStartBatchEvaluation = useCallback(async (
    mode: 'all' | 'range' | 'specific',
    params?: { startNumStr?: string; endNumStr?: string; specificNumStrs?: string }
  ) => {
    if (apiKeyMissing) {
      setGlobalError(API_KEY_INFO);
      return;
    }
    setIsBatchEvaluationModalOpen(false);
  
    let itemsToProcess: EvaluatedQuestion[] = [];
    const allEvaluableItems = questionsData.filter(q => q.previousLlmAnswer && q.previousLlmAnswer.trim() !== "");

    if (allEvaluableItems.length === 0) {
        setGlobalError("Tidak ada item yang memiliki 'Jawaban LLM' untuk dievaluasi dalam data yang dimuat.");
        return;
    }
  
    if (mode === 'all') {
      itemsToProcess = allEvaluableItems;
    } else if (mode === 'range' && params?.startNumStr && params?.endNumStr) {
      const startNumVal = parseInt(params.startNumStr, 10);
      const endNumVal = parseInt(params.endNumStr, 10);
  
      if (isNaN(startNumVal) || isNaN(endNumVal) || startNumVal <=0 || endNumVal <=0) {
        setGlobalError("Nomor awal atau akhir untuk rentang tidak valid (bukan angka positif).");
        return;
      }
      if (startNumVal > endNumVal) {
        setGlobalError("Nomor awal untuk rentang tidak boleh lebih besar dari nomor akhir.");
        return;
      }
  
      itemsToProcess = allEvaluableItems.filter(q => {
        const itemNumVal = parseInt(q.number, 10);
        return !isNaN(itemNumVal) && itemNumVal >= startNumVal && itemNumVal <= endNumVal;
      });
    } else if (mode === 'specific' && params?.specificNumStrs) {
      const specificNumSet = new Set(
        params.specificNumStrs.split(',')
          .map(s => s.trim())
          .filter(s => s !== '')
      );
      if (specificNumSet.size === 0) {
        setGlobalError("Tidak ada nomor spesifik yang valid dimasukkan.");
        return;
      }
      itemsToProcess = allEvaluableItems.filter(q => specificNumSet.has(q.number));
    }
  
    if (itemsToProcess.length === 0) {
      setGlobalError("Tidak ada item yang cocok dengan kriteria evaluasi yang dipilih, atau item yang cocok tidak memiliki 'Jawaban LLM'.");
      return;
    }
  
    await executeBulkEvaluation(itemsToProcess);
  }, [questionsData, apiKeyMissing, executeBulkEvaluation]);


  const handlePauseEvaluation = () => setIsPaused(true);
  const handleResumeEvaluation = () => setIsPaused(false);
  const handleCancelEvaluation = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const openReportInfoModal = useCallback(() => {
    if (questionsData.length === 0) {
      setGlobalError("Tidak ada data untuk diekspor.");
      return;
    }
    setIsReportInfoModalOpen(true);
    setGlobalError(null);
  }, [questionsData]);

  const openBatchEvaluationModalHandler = useCallback(() => {
     if (apiKeyMissing) {
      setGlobalError(API_KEY_INFO);
      return;
    }
    if (questionsData.length === 0) {
      setGlobalError("Tidak ada data yang dimuat untuk dievaluasi.");
      return;
    }
    const evaluableItemsCount = questionsData.filter(q => q.previousLlmAnswer && q.previousLlmAnswer.trim() !== "").length;
    if (evaluableItemsCount === 0) {
        setGlobalError("Tidak ada item yang memiliki 'Jawaban LLM' untuk dievaluasi dalam data yang dimuat.");
        return;
    }
    setIsBatchEvaluationModalOpen(true);
    setGlobalError(null);
  }, [questionsData, apiKeyMissing]);


  const handleConfirmAndGenerateReport = useCallback((testerName: string, projectName: string) => {
    const htmlContent = generateHTMLReport(questionsData, testerName, projectName);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'laporan_evaluasi_llm.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    setIsReportInfoModalOpen(false);
  }, [questionsData]);


  const handleClearAllData = () => {
    if (isEvaluatingAll && abortControllerRef.current) {
        abortControllerRef.current.abort(); 
    }
    setQuestionsData([]);
    setGlobalError(null);
    setCsvErrorModalMessage(null);
    setIsCsvErrorModalOpen(false);
    setProcessedCount(0);
    setTotalToProcess(0);
    setIsEvaluatingAll(false);
    setIsPaused(false);
    isPausedRef.current = false;
  };

  const handleAdoptSuggestion = useCallback((itemId: string, suggestedAnswer: string) => {
    const itemNumber = questionsData.find(q=>q.id === itemId)?.number || itemId;
    setQuestionsData(prev => prev.map(q =>
      q.id === itemId
        ? { ...q, previousLlmAnswer: suggestedAnswer, evaluation: undefined, isEvaluating: false }
        : q
    ));
    setGlobalError(`Jawaban untuk item #${itemNumber} telah diperbarui dengan saran LLM. Anda dapat mengevaluasinya kembali.`);
  }, [questionsData]);

  const isAnyItemIndividuallyEvaluating = questionsData.some(q => q.isEvaluating && !isEvaluatingAll);
  const isAnyProcessing = isAnyItemIndividuallyEvaluating || isEvaluatingAll;

  // Calculate summary counts
  const evaluatedItems = questionsData.filter(q => q.evaluation);
  const succeedCount = evaluatedItems.filter(q => q.evaluation!.isAppropriate === true).length;
  const notAppropriateCount = evaluatedItems.filter(q => q.evaluation!.isAppropriate === false).length;
  const errorCount = evaluatedItems.filter(
    q => q.evaluation!.error && 
         !q.evaluation!.justification.includes("Tidak ada 'Jawaban LLM'")
  ).length;

  const itemsWithActualErrorsForReevaluation = questionsData.filter(
      q => q.evaluation?.error &&
           q.previousLlmAnswer && q.previousLlmAnswer.trim() !== "" &&
           !q.evaluation.justification.includes("Tidak ada 'Jawaban LLM'")
  );
  const canReEvaluateErrors = itemsWithActualErrorsForReevaluation.length > 0 && !isAnyProcessing;

  const handleReEvaluateErrors = useCallback(async () => {
      if (apiKeyMissing) {
        setGlobalError(API_KEY_INFO);
        return;
      }
      if (!canReEvaluateErrors) {
        setGlobalError("Tidak ada item dengan kesalahan pemrosesan (dan memiliki jawaban LLM awal) untuk dievaluasi ulang.");
        return;
      }
      await executeBulkEvaluation(itemsWithActualErrorsForReevaluation);
  }, [apiKeyMissing, executeBulkEvaluation, itemsWithActualErrorsForReevaluation, canReEvaluateErrors]);


  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8 transition-colors duration-300">
      <div className="container mx-auto max-w-5xl">
        <header className="text-center mb-6 sm:mb-10 relative">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 pt-8 sm:pt-4">
            HAKIM LLM
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Unggah pertanyaan dan jawaban (CSV/XLSX), tentukan kriteria evaluasi, dan biarkan LLM menilai "Jawaban LLM" Anda.
          </p>
        </header>

        {globalError && !isCsvErrorModalOpen && (
          <div className={`p-4 mb-6 rounded-md text-sm ${apiKeyMissing ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : globalError.startsWith("Jawaban untuk item") ? 'bg-sky-100 border-sky-400 text-sky-800' : 'bg-red-100 border-red-400 text-red-800'} border `} role="alert">
            <p className="font-semibold">{apiKeyMissing ? "Kunci API Hilang" : globalError.startsWith("Jawaban untuk item") ? "Informasi" : globalError.includes("dibatalkan") || globalError.includes("Proses evaluasi telah dibatalkan") ? "Status Proses" : "Status Sistem"}</p>
            <p>{globalError}</p>
          </div>
        )}

        <ErrorModal
            isOpen={isCsvErrorModalOpen}
            message={csvErrorModalMessage || "Terjadi kesalahan yang tidak ditentukan dengan file."}
            onClose={handleCloseCsvErrorModal}
        />

        <ReportInfoModal
          isOpen={isReportInfoModalOpen}
          onClose={() => setIsReportInfoModalOpen(false)}
          onSubmit={handleConfirmAndGenerateReport}
        />
        
        <BatchEvaluationModal
            isOpen={isBatchEvaluationModalOpen}
            onClose={() => setIsBatchEvaluationModalOpen(false)}
            onSubmit={handleStartBatchEvaluation}
            availableItemNumbers={questionsData.map(q => q.number)}
        />

        <FileUpload onFileUpload={handleFileUpload} setErrorMessage={setCsvErrorModalMessage} />

        <EvaluationControls
          evaluationPrompt={evaluationPrompt}
          setEvaluationPrompt={setEvaluationPrompt}
          onTriggerBatchEvaluation={openBatchEvaluationModalHandler}
          onExportHTML={openReportInfoModal}
          hasData={questionsData.length > 0}
          isEvaluatingAny={isAnyProcessing}
        />

        {questionsData.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2 sm:gap-4">
            <h2 className="text-2xl font-semibold text-sky-700 flex-shrink-0 mr-auto">Antrean Evaluasi ({questionsData.length} item)</h2>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600" aria-label="Ringkasan status evaluasi">
                <span title={`Jumlah item dinilai Sesuai: ${succeedCount}`}>
                  <CheckCircleIcon className="w-4 h-4 inline mr-1 text-green-500" aria-hidden="true"/>
                  Sesuai: <span className="font-semibold text-green-600">{succeedCount}</span>
                </span>
                <span className="text-slate-300" aria-hidden="true">|</span>
                <span title={`Jumlah item dinilai Tidak Sesuai: ${notAppropriateCount}`}>
                  <XCircleIcon className="w-4 h-4 inline mr-1 text-red-500" aria-hidden="true"/>
                  Tdk Sesuai: <span className="font-semibold text-red-600">{notAppropriateCount}</span>
                </span>
                <span className="text-slate-300" aria-hidden="true">|</span>
                <span title={`Jumlah item gagal diproses (error LLM): ${errorCount}`}>
                  <ExclamationTriangleIcon className="w-4 h-4 inline mr-1 text-amber-500" aria-hidden="true"/>
                  Error: <span className="font-semibold text-amber-600">{errorCount}</span>
                </span>
              </div>

              {errorCount > 0 && (
                  <button
                    onClick={handleReEvaluateErrors}
                    disabled={!canReEvaluateErrors || isAnyProcessing}
                    className="flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md text-xs sm:text-sm shadow-sm disabled:bg-slate-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors duration-150"
                    title={!canReEvaluateErrors ? "Tidak ada item error yang valid untuk dievaluasi ulang" : `Evaluasi ulang ${errorCount} item yang mengalami error pemrosesan`}
                    aria-label={`Evaluasi ulang ${errorCount} item error`}
                  >
                    <RefreshIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" aria-hidden="true"/>
                    Ulang Error ({errorCount})
                  </button>
              )}
              
              <button
                onClick={handleClearAllData}
                disabled={isEvaluatingAll && isPaused} 
                className="flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md text-sm shadow-sm disabled:bg-slate-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors duration-150"
                title={isEvaluatingAll && isPaused ? "Harap Lanjutkan atau Batalkan proses evaluasi terlebih dahulu" : "Hapus semua data yang diunggah"}
                aria-label="Hapus semua data dan hasil evaluasi"
              >
                <TrashIcon className="w-4 h-4 mr-1.5" aria-hidden="true"/>
                Hapus Semua
              </button>
            </div>
          </div>
        )}

        {questionsData.length === 0 && !globalError && !isCsvErrorModalOpen && (
           <div className="text-center py-10">
            <p className="text-slate-500 text-lg">Tidak ada data yang dimuat. Unggah file CSV atau XLSX untuk memulai.</p>
          </div>
        )}

        <div className="space-y-6">
          {questionsData.map(item => (
            <QuestionItem
              key={item.id}
              item={item}
              onEvaluate={handleEvaluateSingle}
              onAdoptSuggestion={handleAdoptSuggestion}
            />
          ))}
        </div>
         {isEvaluatingAll && ( 
          <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex items-center justify-center z-50 p-4" aria-live="assertive" role="dialog" aria-modal="true">
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl flex flex-col items-center text-center w-full max-w-md">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4" role="status">
                   <span className="sr-only">Memuat...</span>
                </div>
                <p className="text-lg text-slate-800 mb-2" aria-label="Status evaluasi">
                  {isPaused
                    ? `Dijeda. Mengevaluasi ${processedCount} dari ${totalToProcess} item...`
                    : totalToProcess > 0
                      ? `Mengevaluasi ${processedCount} dari ${totalToProcess} item...`
                      : "Memproses evaluasi..."}
                </p>
                <p className="text-sm text-slate-600 mt-1 mb-6">Harap tunggu, ini mungkin memakan waktu beberapa saat.</p>
                <div className="flex space-x-3 w-full">
                    {isPaused ? (
                        <button
                            onClick={handleResumeEvaluation}
                            className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md shadow-sm transition-colors duration-150"
                        >
                            Lanjutkan
                        </button>
                    ) : (
                        <button
                            onClick={handlePauseEvaluation}
                            className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-medium rounded-md shadow-sm transition-colors duration-150"
                        >
                            Jeda
                        </button>
                    )}
                    <button
                        onClick={handleCancelEvaluation}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors duration-150"
                    >
                        Batalkan
                    </button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
