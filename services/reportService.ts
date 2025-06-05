
import { EvaluatedQuestion } from '../types';

const getScoreCellStyle = (score?: number): string => {
  if (score === undefined || score === null) return 'color: #64748b;'; // slate-500
  if (score >= 0.8) return 'color: #16a34a; font-weight: bold;'; // green-600
  if (score >= 0.5) return 'color: #ca8a04; font-weight: bold;'; // yellow-600
  return 'color: #dc2626; font-weight: bold;'; // red-600
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '00:00:00';
  let totalSeconds = Math.floor(ms / 1000);
  let hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  let minutes = Math.floor(totalSeconds / 60);
  let seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// SVGs - Colors will be largely determined by their usage context or inherent stroke colors
const successIconSvg = `
  <svg class="summary-icon" width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="#16a34a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 30C27.3137 30 30 27.3137 30 24C30 20.6863 27.3137 18 24 18C20.6863 18 18 20.6863 18 24C18 27.3137 20.6863 30 24 30Z" stroke="#16a34a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M20 28L24 22L28 28" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`; // green-600
const failedIconSvg = `
  <svg class="summary-icon" width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4L45 40H3L24 4Z" stroke="#dc2626" stroke-width="3" stroke-linejoin="round" fill="rgba(220,38,38,0.1)"/>
    <path d="M24 20V28" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 34V35" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
  </svg>`; // red-600
const totalTopicIconSvg = `
  <svg class="summary-icon" width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="36" height="36" rx="3" stroke="#0ea5e9" stroke-width="3" stroke-linejoin="round" fill="rgba(14,165,233,0.1)"/>
    <path d="M14 18L20 24L14 30" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 32H32" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round"/>
  </svg>`; // sky-500
const totalQuestionIconSvg = `
  <svg class="summary-icon" width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 16V32H10C8.89543 32 8 31.1046 8 30V18C8 16.8954 8.89543 16 10 16H15Z" stroke="#10b981" stroke-width="3" stroke-linejoin="round" fill="rgba(16,185,129,0.1)"/>
    <path d="M15 24H29.7391C30.8287 24 31.7806 23.2722 31.9579 22.1961L33.7268 10.1961C33.9563 8.77826 35.1697 7.76923 36.5995 7.9411L37.2308 8.02308C38.9775 8.23974 40 9.94027 40 11.7037V24.5C40 26.9853 37.9853 29 35.5 29H32" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`; // emerald-500
const durationIconSvg = `
  <svg class="summary-icon" width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" stroke="#f59e0b" stroke-width="3" stroke-linejoin="round" fill="rgba(245,158,11,0.1)"/>
    <path d="M24 12V24L32 28" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`; // amber-500

const searchIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 pointer-events-none group-focus-within:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>`;
const clearIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500 hover:text-slate-700 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>`;

// Updated icon to a circular download icon as per user image
const cuteCsvTableDownloadIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-5 h-5">
  <circle cx="12" cy="12" r="11" fill="#BAE6FD"/> <!-- Tailwind sky-200 for light blue circle -->
  <path fill="#FFFFFF" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/> <!-- White download symbol -->
</svg>
`;


export const generateHTMLReport = (
  evaluatedQuestions: EvaluatedQuestion[], 
  testerName: string, 
  projectName: string,
  succeedCount: number,
  notAppropriateCount: number,
  totalQuestions: number, 
  durationMs: number
): string => {
  const uniqueTopics = Array.from(new Set(evaluatedQuestions.map(item => item.title))).sort();
  const tableHeaders = ["Nomor", "Title/Topik", "Pertanyaan", "Jawaban KB (Konteks)", "Jawaban LLM (Dievaluasi)", "Skor (0-1)", "Penilaian", "Justifikasi"];
  
  const rows = evaluatedQuestions.map(item => {
    const evaluation = item.evaluation;
    const scoreDisplay = (evaluation?.score !== undefined && evaluation.score !== null)
        ? evaluation.score.toFixed(2)
        : (evaluation?.error && evaluation.justification && evaluation.justification.includes("Tidak ada jawaban LLM yang diberikan")) 
        ? 'N/A (Kosong)'
        : (evaluation?.error ? 'Error' : 'N/E');

    const appropriatenessText = evaluation?.isAppropriate === true
        ? 'Sesuai'
        : evaluation?.isAppropriate === false
        ? 'Tidak Sesuai'
        : (evaluation?.error && evaluation.justification && evaluation.justification.includes("Tidak ada jawaban LLM yang diberikan"))
        ? 'N/A (Kosong)'
        : (evaluation?.error ? 'Error' : 'Belum Dievaluasi');

    const appropriatenessClass = evaluation?.isAppropriate === true
        ? 'sesuai'
        : evaluation?.isAppropriate === false
        ? 'tidak-sesuai'
        : (evaluation?.error ? 'error-text' : ''); 

    return `
    <tr data-nomor="${escapeHtml(item.number)}" data-title="${escapeHtml(item.title)}" data-pertanyaan="${escapeHtml(item.questionText)}" data-status="${escapeHtml(appropriatenessText)}">
      <td>${escapeHtml(item.number)}</td>
      <td>${escapeHtml(item.title)}</td>
      <td><div class="content-cell">${escapeHtml(item.questionText)}</div></td>
      <td><div class="content-cell">${escapeHtml(item.kbAnswer)}</div></td>
      <td><div class="content-cell">${escapeHtml(item.previousLlmAnswer || (evaluation?.error && evaluation.justification && evaluation.justification.includes("Tidak ada jawaban LLM diberikan") ? '(Tidak ada jawaban LLM diberikan)' : 'N/A'))}</div></td>
      <td style="${getScoreCellStyle(evaluation?.score)}">${scoreDisplay}</td>
      <td class="${appropriatenessClass}">${appropriatenessText}</td>
      <td><div class="content-cell justification">${escapeHtml(evaluation?.justification || (evaluation?.error ? `Error: ${evaluation.error}` : 'N/A'))}</div></td>
    </tr>
  `}).join('');
  
  const formattedDuration = formatDuration(durationMs);

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Evaluasi HAKIM LLM</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f1f5f9; /* slate-100 */
      color: #0f172a; /* slate-900 */
      line-height: 1.6;
    }
    .container {
      max-width: 95%;
      margin: 0 auto;
      background-color: #ffffff; /* white */
      padding: 20px 25px;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0; /* slate-200 */
    }
    h1 {
      color: #0369a1; /* sky-700 */
      text-align: center;
      margin-bottom: 8px;
      font-size: 1.8em;
      font-weight: 700;
    }
    .report-meta {
      text-align: center;
      margin-bottom: 25px;
      font-size: 0.9em;
      color: #64748b; /* slate-500 */
    }
    .report-meta p { margin: 4px 0; }
    .report-meta strong { color: #334155; /* slate-700 */ }
    p.timestamp {
      text-align: center;
      font-size: 0.85em;
      color: #64748b; /* slate-500 */
      margin-bottom: 5px;
    }

    /* Summary Cards Styles */
    .summary-dashboard {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: center;
      margin-bottom: 25px;
      padding: 20px;
      background-color: #f8fafc; /* slate-50 */
      border-radius: 8px;
      border: 1px solid #e2e8f0; /* slate-200 */
    }
    .summary-card {
      background-color: #ffffff; /* white */
      background-image: linear-gradient(135deg, rgba(100, 116, 139, 0.05) 25%, transparent 25%, transparent 50%, rgba(100, 116, 139, 0.05) 50%, rgba(100, 116, 139, 0.05) 75%, transparent 75%, transparent);
      background-size: 20px 20px;
      color: #1e293b; /* slate-800 */
      padding: 15px 20px;
      border-radius: 8px;
      min-width: 180px;
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      position: relative;
      overflow: hidden;
      border: 1px solid #e2e8f0; /* slate-200 */
    }
    .summary-card::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      height: 5px;
      width: 100%;
    }
    .summary-card.success::after { background-color: #16a34a; } /* green-600 */
    .summary-card.failed::after { background-color: #dc2626; } /* red-600 */
    .summary-card.topic::after { background-color: #0ea5e9; } /* sky-500 */
    .summary-card.question::after { background-color: #10b981; } /* emerald-500 */
    .summary-card.duration::after { background-color: #f59e0b; } /* amber-500 */

    .card-header {
      font-size: 0.85em;
      color: #475569; /* slate-600 */
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .card-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .card-value {
      font-size: 2.2em;
      font-weight: 700;
      color: #0f172a; /* slate-900 */
      line-height: 1.1;
    }
    .summary-icon { opacity: 0.9; }

    /* Data Result Filter Section */
    .data-result-header {
      color: #0369a1; /* sky-700 */
      font-size: 1.5em; 
      font-weight: 600;
      margin-top: 20px;
      margin-bottom: 12px;
    }
    .filter-controls-panel {
      background-color: #f8fafc; /* slate-50 */
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr auto; 
      gap: 16px;
      align-items: end; 
      border: 1px solid #e2e8f0; /* slate-200 */
    }
    .filter-group {
      display: flex;
      flex-direction: column;
    }
    .filter-group label {
      font-size: 0.875em;
      color: #334155; /* slate-700 */
      margin-bottom: 6px;
    }
    .filter-group input[type="search"], .filter-group select {
      background-color: #ffffff; /* white */
      color: #0f172a; /* slate-900 */
      border: 1px solid #cbd5e1; /* slate-300 */
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 0.9em;
      height: 40px; 
      box-sizing: border-box;
    }
    .filter-group input[type="search"]:focus, .filter-group select:focus {
      outline: none;
      border-color: #0ea5e9; /* sky-500 */
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.3); /* sky-500 with opacity */
    }
    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input-wrapper .search-icon-svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none; 
    }
    .search-input-wrapper input[type="search"] {
      padding-left: 38px; 
      padding-right: 30px; 
      width: 100%;
    }
    .search-input-wrapper .clear-search-btn {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      display: none; 
    }
    .download-filtered-csv-btn { 
      background-color: #0ea5e9; /* sky-500 */
      color: #ffffff; /* white */
      border: none;
      padding: 0;
      width: 40px; 
      height: 40px; 
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;
    }
    .download-filtered-csv-btn svg { /* Ensure SVG inside button scales if needed, though w-5 h-5 should handle it */
        max-width: 100%;
        max-height: 100%;
    }
    .download-filtered-csv-btn:hover { 
      background-color: #0284c7; /* sky-600 */
    }
    /* Responsive grid for filter panel */
    @media (max-width: 1024px) { 
        .filter-controls-panel {
            grid-template-columns: 1fr 1fr; 
        }
        .filter-group:nth-child(1) { grid-column: 1 / 3; } 
        .filter-group:nth-child(2) { grid-column: 1 / 2; } 
        .filter-group:nth-child(3) { grid-column: 2 / 3; } 
        .download-filtered-csv-btn { grid-column: 1 / 3; justify-self: center; margin-top: 10px; width: calc(50% - 8px); } 
    }
    @media (max-width: 640px) { 
        .filter-controls-panel {
            grid-template-columns: 1fr; 
        }
        .download-filtered-csv-btn { 
            justify-self: stretch; 
            width: 100%;
            margin-top: 8px;
        }
    }
    
    table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      margin-top: 15px; border: 1px solid #e2e8f0; /* slate-200 */
      border-radius: 6px; overflow: hidden;
      margin-bottom: 25px;
    }
    th, td {
      border-bottom: 1px solid #e2e8f0; /* slate-200 */
      padding: 10px 14px;
      text-align: left; vertical-align: top;
    }
    td { border-left: 1px solid #e2e8f0; /* slate-200 */ color: #1e293b; /* slate-800 */ } 
    td:first-child { border-left: none; }
    th {
      background-color: #f1f5f9; /* slate-100 */
      color: #334155; /* slate-700 */
      font-weight: 600;
      font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em;
      border-left: 1px solid #e2e8f0; /* slate-200 */
    }
    th:first-child { border-left: none; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background-color: #f8fafc; /* slate-50 */ } 
    tr:hover { background-color: #e0f2fe; /* sky-100 */ } 

    .sesuai { color: #16a34a; font-weight: 500; } /* green-600 */
    .tidak-sesuai { color: #dc2626; font-weight: 500; } /* red-600 */
    .error-text { color: #d97706; font-style: italic; } /* amber-600 */

    td { font-size: 0.88em; }
    .content-cell {
      max-height: 180px; overflow-y: auto; white-space: pre-wrap;
      word-break: break-word; padding: 8px; 
      background-color: #f8fafc; /* slate-50 */
      border: 1px solid #e2e8f0; /* slate-200 */
      border-radius: 4px;
      color: #1e293b; /* slate-800 */
    }
    .justification { min-width: 180px; }
    .content-cell::-webkit-scrollbar { width: 6px; height: 6px; }
    .content-cell::-webkit-scrollbar-track { background: #e2e8f0; border-radius: 8px;} /* slate-200 */
    .content-cell::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 8px;} /* slate-400 */
    .content-cell::-webkit-scrollbar-thumb:hover { background: #64748b; } /* slate-500 */

    @media print {
      body { background-color: #fff; padding: 0; margin: 0; color: #000; }
      .container, .filter-controls-panel, .summary-dashboard { display: none; }
      .report-meta { text-align: left; margin-bottom: 15px; color: #333; }
      h1 { color: #000 !important; }
      .data-result-header { display: none; }
      th {
        background-color: #e2e8f0 !important; color: #000 !important;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      td, .content-cell { color: #000 !important; background-color: transparent !important; }
      .content-cell { max-height: none; overflow-y: visible; border: none !important; }
      table { border: 1px solid #ccc; }
      th, td { border-color: #ccc; }
    }
    @media (max-width: 768px) { 
      .summary-card { min-width: calc(50% - 8px); }
    }
    @media (max-width: 480px) { 
      .summary-card { min-width: calc(100% - 8px); }
      .card-value { font-size: 1.8em; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>EVALUASI HAKIM LLM - Laporan Evaluasi</h1>
    <div class="report-meta">
      <p class="timestamp">Laporan Dihasilkan pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}</p>
      <p><strong>Nama Tester:</strong> ${escapeHtml(testerName)}</p>
      <p><strong>Project:</strong> ${escapeHtml(projectName)}</p>
    </div>

    <div class="summary-dashboard">
      <div class="summary-card success">
        <div class="card-header">Success</div>
        <div class="card-body">
          <span class="card-value">${succeedCount}</span>
          ${successIconSvg}
        </div>
      </div>
      <div class="summary-card failed">
        <div class="card-header">Failed</div>
        <div class="card-body">
          <span class="card-value">${notAppropriateCount}</span>
          ${failedIconSvg}
        </div>
      </div>
      <div class="summary-card topic">
        <div class="card-header">Total Topic</div>
        <div class="card-body">
          <span class="card-value">${uniqueTopics.length}</span>
          ${totalTopicIconSvg}
        </div>
      </div>
      <div class="summary-card question">
        <div class="card-header">Total Question</div>
        <div class="card-body">
          <span class="card-value">${evaluatedQuestions.length}</span>
          ${totalQuestionIconSvg}
        </div>
      </div>
      <div class="summary-card duration">
        <div class="card-header">Duration</div>
        <div class="card-body">
          <span class="card-value">${formattedDuration}</span>
          ${durationIconSvg}
        </div>
      </div>
    </div>

    <h2 class="data-result-header">Data Result</h2>
    <div class="filter-controls-panel">
      <div class="filter-group">
        <label for="searchInput">Search:</label>
        <div class="search-input-wrapper">
          <span class="search-icon-svg">${searchIconSvg}</span>
          <input type="search" id="searchInput" placeholder="Cari pertanyaan, topik, nomor..." aria-label="Cari berdasarkan pertanyaan, topik, atau nomor">
          <span class="clear-search-btn" id="clearSearchBtn" title="Clear search">${clearIconSvg}</span>
        </div>
      </div>
      <div class="filter-group">
        <label for="statusFilter">Filter by Status:</label>
        <select id="statusFilter" aria-label="Filter berdasarkan status evaluasi">
          <option value="">All Statuses</option>
          <option value="Sesuai">Sesuai</option>
          <option value="Tidak Sesuai">Tidak Sesuai</option>
          <option value="Error">Error</option>
          <option value="N/A (Kosong)">N/A (Kosong)</option>
          <option value="Belum Dievaluasi">Belum Dievaluasi</option>
        </select>
      </div>
      <div class="filter-group">
        <label for="topicFilter">Filter by Topic:</label>
        <select id="topicFilter" aria-label="Filter berdasarkan topik">
          <option value="">All Topic</option>
          ${uniqueTopics.map(topic => `<option value="${escapeHtml(topic)}">${escapeHtml(topic)}</option>`).join('')}
        </select>
      </div>
      <button class="download-filtered-csv-btn" id="downloadFilteredCsvBtn" title="Download Filtered Data (CSV)" aria-label="Download data yang difilter sebagai CSV">
        ${cuteCsvTableDownloadIconSvg}
      </button>
    </div>
    
    <table id="evaluationReportTable">
      <thead>
        <tr>
          ${tableHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    
  </div>
  <script>
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const topicFilter = document.getElementById('topicFilter');
    const tableBody = document.getElementById('evaluationReportTable').querySelector('tbody');
    const tableRows = Array.from(tableBody.querySelectorAll('tr'));
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    function filterTable() {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const statusValue = statusFilter.value;
      const topicValue = topicFilter.value;
      
      clearSearchBtn.style.display = searchTerm ? 'block' : 'none';

      tableRows.forEach(row => {
        const numberText = row.dataset.nomor.toLowerCase();
        const titleText = row.dataset.title.toLowerCase();
        const questionText = row.dataset.pertanyaan.toLowerCase();
        const penilaianText = row.dataset.status; 

        const searchMatch = !searchTerm || 
                            numberText.includes(searchTerm) || 
                            titleText.includes(searchTerm) || 
                            questionText.includes(searchTerm);
        
        const statusMatch = !statusValue || penilaianText === statusValue;
        const topicMatch = !topicValue || row.dataset.title === topicValue;

        if (searchMatch && statusMatch && topicMatch) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    }

    searchInput.addEventListener('input', filterTable);
    statusFilter.addEventListener('change', filterTable);
    topicFilter.addEventListener('change', filterTable);
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            filterTable(); 
        });
    }
    
    filterTable();


    function escapeCsvCell(cellData) {
        if (cellData === null || cellData === undefined) {
            return '';
        }
        let cellString = String(cellData);
        if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\\n') || cellString.includes('\\r')) {
            cellString = cellString.replace(/"/g, '""');
            return '"' + cellString + '"';
        }
        return cellString;
    }

    function downloadFile(filename, content, mimeType) { 
        const blob = new Blob(['\\uFEFF' + content], { type: mimeType }); 
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
    
    const tableHeadersJS = ${JSON.stringify(tableHeaders)};

    document.getElementById('downloadFilteredCsvBtn').addEventListener('click', function() { 
        let csvContent = tableHeadersJS.map(escapeCsvCell).join(',') + '\\r\\n';
        let hasVisibleRows = false;
        tableRows.forEach(row => {
            if (row.style.display !== 'none') {
                hasVisibleRows = true;
                const rowData = Array.from(row.cells).map(cell => {
                    const contentCell = cell.querySelector(".content-cell");
                    if (contentCell) { 
                         return escapeCsvCell(contentCell.innerText.trim());
                    }
                    return escapeCsvCell(cell.innerText.trim());
                });
                csvContent += rowData.join(',') + '\\r\\n';
            }
        });
        if (!hasVisibleRows) {
            alert("Tidak ada data yang ditampilkan berdasarkan filter saat ini untuk diunduh.");
            return;
        }

        let filenameParts = ['laporan_evaluasi'];
        const searchTermVal = searchInput.value.trim().toLowerCase();
        const statusValueVal = statusFilter.value;
        const topicValueVal = topicFilter.value;
        let filterActive = false;

        if (searchTermVal) {
            filenameParts.push('cari_' + searchTermVal.replace(/\\s+/g, '_').replace(/[^\\w-]/g, ''));
            filterActive = true;
        }
        if (statusValueVal) {
            filenameParts.push('status_' + statusValueVal.replace(/\\s+/g, '_').replace(/[^\\w-]/g, ''));
            filterActive = true;
        }
        if (topicValueVal) {
            filenameParts.push('topik_' + topicValueVal.replace(/\\s+/g, '_').replace(/[^\\w-]/g, ''));
            filterActive = true;
        }
        
        if (filterActive) {
            filenameParts.push('difilter');
        } else {
            filenameParts.push('semua_difilter');
        }
        const filename = filenameParts.join('_') + '.csv'; 

        downloadFile(filename, csvContent, 'text/csv;charset=utf-8;');
    });

  </script>
</body>
</html>
  `;
};

function escapeHtml(unsafe: string | undefined): string {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
