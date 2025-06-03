import { EvaluatedQuestion } from '../types';

const getScoreCellStyle = (score?: number): string => {
  if (score === undefined || score === null) return 'color: #777;';
  if (score >= 0.8) return 'color: #16a34a; font-weight: bold;'; // green (Tailwind green-600)
  if (score >= 0.5) return 'color: #eab308; font-weight: bold;'; // yellow (Tailwind yellow-500)
  return 'color: #ef4444; font-weight: bold;'; // red (Tailwind red-500)
}

export const generateHTMLReport = (
  evaluatedQuestions: EvaluatedQuestion[], 
  testerName: string, 
  projectName: string
): string => {
  const rows = evaluatedQuestions.map(item => {
    const evaluation = item.evaluation;
    const scoreDisplay = (evaluation?.score !== undefined && evaluation.score !== null)
        ? evaluation.score.toFixed(2)
        : (evaluation?.error && evaluation.justification.includes("Tidak ada 'Jawaban LLM'"))
        ? 'N/A (Kosong)'
        : (evaluation?.error ? 'Error' : 'N/E');

    const appropriatenessText = evaluation?.isAppropriate === true
        ? 'Sesuai'
        : evaluation?.isAppropriate === false
        ? 'Tidak Sesuai'
        : (evaluation?.error && evaluation.justification.includes("Tidak ada 'Jawaban LLM'"))
        ? 'N/A (Kosong)'
        : (evaluation?.error ? 'Error' : 'Belum Dievaluasi');

    const appropriatenessClass = evaluation?.isAppropriate === true
        ? 'sesuai'
        : evaluation?.isAppropriate === false
        ? 'tidak-sesuai'
        : (evaluation?.error ? 'error-text' : ''); 

    return `
    <tr>
      <td>${escapeHtml(item.number)}</td>
      <td>${escapeHtml(item.title)}</td>
      <td><div class="content-cell">${escapeHtml(item.questionText)}</div></td>
      <td><div class="content-cell">${escapeHtml(item.kbAnswer)}</div></td>
      <td><div class="content-cell">${escapeHtml(item.previousLlmAnswer || (item.evaluation?.error && item.evaluation.justification.includes("Tidak ada 'Jawaban LLM'") ? '(Tidak ada jawaban LLM diberikan)' : 'N/A'))}</div></td>
      <td style="${getScoreCellStyle(evaluation?.score)}">${scoreDisplay}</td>
      <td class="${appropriatenessClass}">${appropriatenessText}</td>
      <td><div class="content-cell justification">${escapeHtml(evaluation?.justification || (evaluation?.error ? `Error: ${evaluation.error}` : 'N/A'))}</div></td>
    </tr>
  `}).join('');
  
  const excelHeaders = ["Nomor", "Title/Topik", "Pertanyaan", "Jawaban KB (Konteks)", "Jawaban LLM (Dievaluasi)", "Skor (0-1)", "Penilaian", "Justifikasi"];

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLM sebagai Hakim - Laporan Evaluasi</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f0f4f8;
      color: #1a202c;
      line-height: 1.6;
    }
    .container {
      max-width: 95%;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px 25px;
      border-radius: 8px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.07);
      border: 1px solid #e2e8f0;
    }
    h1 {
      color: #1e40af;
      text-align: center;
      margin-bottom: 8px;
      font-size: 1.8em;
      font-weight: 700;
    }
    .report-meta {
      text-align: center;
      margin-bottom: 25px;
      font-size: 0.9em;
      color: #4a5568;
    }
    .report-meta p {
      margin: 4px 0;
    }
    .report-meta strong {
      color: #2d3748;
    }
    p.timestamp {
      text-align: center;
      font-size: 0.85em;
      color: #4a5568;
      margin-bottom: 5px; /* Adjusted margin */
    }
    .controls {
      text-align: center;
      margin-bottom: 25px;
    }
    .controls button {
      background-color: #2563eb;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.95em;
      font-weight: 500;
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .controls button:hover {
      background-color: #1d4ed8;
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-top: 15px;
      border: 1px solid #d1dce5;
      border-radius: 6px;
      overflow: hidden;
    }
    th, td {
      border-bottom: 1px solid #d1dce5;
      padding: 10px 14px;
      text-align: left;
      vertical-align: top;
    }
    td { border-left: 1px solid #d1dce5; }
    td:first-child { border-left: none; }
    th {
      background-color: #3b82f6;
      color: white;
      font-weight: 600;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-left: 1px solid #5aa2f8;
    }
    th:first-child { border-left: none; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) { background-color: #f8fafc; }
    tr:hover { background-color: #eef2ff; }

    .sesuai { color: #16a34a; font-weight: 500; }
    .tidak-sesuai { color: #ef4444; font-weight: 500; }
    .error-text { color: #d97706; font-style: italic; }

    td { font-size: 0.88em; color: #374151; }
    .content-cell {
      max-height: 180px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      padding: 5px;
      background-color: rgba(239, 246, 255, 0.5);
      border-radius: 4px;
    }
    .justification {
        min-width: 180px;
    }
    .content-cell::-webkit-scrollbar { width: 6px; height: 6px; }
    .content-cell::-webkit-scrollbar-track { background: #e0e6ed; border-radius: 8px;}
    .content-cell::-webkit-scrollbar-thumb { background: #a0aec0; border-radius: 8px;}
    .content-cell::-webkit-scrollbar-thumb:hover { background: #718096; }

    @media print {
      body { background-color: #fff; padding: 0; margin: 0; }
      .container { box-shadow: none; padding: 0; max-width: 100%; border: none; }
      .controls button { display: none; }
      .report-meta { text-align: left; margin-bottom: 15px; }
      th {
        background-color: #3b82f6 !important;
        color: white !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .content-cell { max-height: none; overflow-y: visible; background-color: transparent !important; }
      table { border: 1px solid #ccc; }
      th, td { border-color: #ccc; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>LLM sebagai Hakim - Laporan Evaluasi</h1>
    <div class="report-meta">
      <p class="timestamp">Laporan Dihasilkan pada: ${new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' })}</p>
      <p><strong>Nama Tester:</strong> ${escapeHtml(testerName)}</p>
      <p><strong>Project:</strong> ${escapeHtml(projectName)}</p>
    </div>
    <div class="controls">
      <button id="downloadExcelBtn">Unduh Laporan sebagai Excel</button>
    </div>
    <table id="evaluationReportTable">
      <thead>
        <tr>
          ${excelHeaders.map(header => `<th>${escapeHtml(header)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  <script>
    document.getElementById('downloadExcelBtn').addEventListener('click', function() {
      const table = document.getElementById("evaluationReportTable");
      const wb = XLSX.utils.book_new();

      const jsHeaders = ${JSON.stringify(excelHeaders)};

      const tBody = table.querySelector("tbody");
      const data = [];
      if (tBody) {
        tBody.querySelectorAll("tr").forEach(tr => {
          const rowData = [];
          tr.querySelectorAll("td").forEach(td => {
            const contentCell = td.querySelector(".content-cell");
            rowData.push(contentCell ? contentCell.innerText.trim() : td.innerText.trim());
          });
          data.push(rowData);
        });
      }

      const ws_data = [jsHeaders, ...data];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);

      const colWidths = jsHeaders.map((_, i) => ({
        wch: Math.max(
          jsHeaders[i].length,
          ...data.map(row => (row[i] ? String(row[i]).length : 0))
        ) + 2
      }));
      ws['!cols'] = colWidths.map(col => ({ wch: Math.min(col.wch, 60) }));

      XLSX.utils.book_append_sheet(wb, ws, "Laporan Evaluasi");

      const now = new Date();
      const timestamp = now.getFullYear().toString() +
                        String(now.getMonth() + 1).padStart(2, '0') +
                        String(now.getDate()).padStart(2, '0') + "_" +
                        String(now.getHours()).padStart(2, '0') +
                        String(now.getMinutes()).padStart(2, '0') +
                        String(now.getSeconds()).padStart(2, '0');
      const fileName = \`laporan_evaluasi_llm_\${timestamp}.xlsx\`;

      XLSX.writeFile(wb, fileName);
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
