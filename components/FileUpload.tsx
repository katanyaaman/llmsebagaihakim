import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { UploadIcon, DownloadIcon, PlayIcon } from './IconComponents';
import { SAMPLE_CSV_CONTENT, EXPECTED_HEADERS_INDONESIAN, EXCEL_FORMAT_INFO, SAMPLE_EXCEL_DATA_ROWS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface FileUploadProps {
  onFileUpload: (content: string | ArrayBuffer, fileType: 'csv' | 'xlsx') => void;
  setErrorMessage: (message: string | null) => void; 
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, setErrorMessage }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx') {
        setSelectedFile(file);
        setFileName(file.name);
        setErrorMessage(null);
      } else {
        setErrorMessage("Format file tidak didukung. Harap unggah file .csv atau .xlsx.");
        setSelectedFile(null);
        setFileName(null);
      }
    }
    event.target.value = ''; // Allow re-uploading the same file
  }, [setErrorMessage]);

  const handleProcessFile = useCallback(async () => {
    if (!selectedFile) {
      setErrorMessage("Tidak ada file yang dipilih untuk diproses. Silakan pilih file CSV atau XLSX terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null); 

    const reader = new FileReader();
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase() as 'csv' | 'xlsx';

    reader.onload = (e) => {
      const content = e.target?.result;
      if (content) {
        onFileUpload(content, fileType); 
      } else {
        setErrorMessage("Tidak dapat membaca konten file. File mungkin kosong.");
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      setErrorMessage("Kesalahan membaca konten file. File mungkin rusak atau tidak dapat dibaca."); 
      setIsLoading(false);
    };

    if (fileType === 'csv') {
      reader.readAsText(selectedFile);
    } else if (fileType === 'xlsx') {
      reader.readAsArrayBuffer(selectedFile);
    }
  }, [selectedFile, onFileUpload, setErrorMessage]);

  const handleDownloadSampleCSV = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'contoh_format_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleDownloadSampleExcel = useCallback(() => {
    const worksheet = XLSX.utils.aoa_to_sheet(SAMPLE_EXCEL_DATA_ROWS);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contoh Data');
    XLSX.writeFile(workbook, 'contoh_format_data.xlsx');
  }, []);

  return (
    <div className="mb-6 p-6 bg-white rounded-xl shadow-xl transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-4">
        <label
          htmlFor="fileUploadInput"
          className="flex-grow flex items-center justify-center px-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-md cursor-pointer transition-colors duration-150 ease-in-out"
        >
          <UploadIcon className="w-5 h-5 mr-2" />
          <span>{selectedFile ? 'Ganti File Terpilih' : 'Pilih File (.csv/.xlsx)'}</span>
        </label>
        <input
          type="file"
          id="fileUploadInput"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          className="hidden"
          aria-label={selectedFile ? 'Ganti file .csv atau .xlsx terpilih' : 'Pilih file .csv atau .xlsx untuk diunggah'}
        />
         {selectedFile && !isLoading && (
          <button
            onClick={handleProcessFile}
            disabled={isLoading}
            className="flex-grow sm:flex-none flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Muat Data dari File
          </button>
        )}
        {isLoading && (
          <div className="flex-grow sm:flex-none flex items-center justify-center px-4 py-3 text-slate-600">
            <LoadingSpinner size="w-5 h-5" />
            <span className="ml-2">Memuat data...</span>
          </div>
        )}
      </div>

      {fileName && (
        <p className="text-sm text-slate-600 mb-3 text-center sm:text-left">
          File terpilih: <span className="font-medium text-sky-600">{fileName}</span>
        </p>
      )}

      <div className="mt-2 text-xs text-slate-500 space-y-1">
        <p>
          Header yang diharapkan: <code className="bg-slate-200 px-1 rounded text-sky-700 text-xs">{EXPECTED_HEADERS_INDONESIAN.join(', ')}</code>.
        </p>
        <p>{EXCEL_FORMAT_INFO}</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 pt-1">
            <button
              onClick={handleDownloadSampleCSV}
              className="flex items-center text-sky-600 hover:text-sky-500 hover:underline transition-colors duration-150"
              aria-label="Unduh contoh format CSV"
            >
              <DownloadIcon className="w-3.5 h-3.5 mr-1" />
              Unduh Contoh Format CSV
            </button>
            <button
              onClick={handleDownloadSampleExcel}
              className="flex items-center text-sky-600 hover:text-sky-500 hover:underline transition-colors duration-150"
              aria-label="Unduh contoh format Excel"
            >
              <DownloadIcon className="w-3.5 h-3.5 mr-1" />
              Unduh Contoh Format Excel
            </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;