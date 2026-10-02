import { TranscriptionRecord } from "../types";

// Convert seconds to SRT timestamp format: 00:00:00,000
export function formatSRTTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);
  const pad = (n: number, size = 2) => String(n).padStart(size, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

// Convert seconds to VTT timestamp format: 00:00:00.000
export function formatVTTTime(totalSeconds: number): string {
  return formatSRTTime(totalSeconds).replace(",", ".");
}

// Extract pure transcribed text only - exactly as spoken in live transcription
export function getPureTranscribedText(record: TranscriptionRecord): string {
  if (!record.paragraphs || record.paragraphs.length === 0) {
    return "";
  }
  return record.paragraphs
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

// Generate pure transcribed text only (.txt)
export function generateTXT(record: TranscriptionRecord): string {
  return getPureTranscribedText(record);
}

// Generate pure transcribed SRT subtitle file
export function generateSRT(record: TranscriptionRecord): string {
  let srt = "";
  record.paragraphs.forEach((p, index) => {
    const startTime = p.seconds;
    const nextP = record.paragraphs[index + 1];
    const endTime = nextP ? Math.max(nextP.seconds - 0.2, startTime + 1.5) : startTime + Math.max(3, p.text.length * 0.08);
    srt += `${index + 1}\n`;
    srt += `${formatSRTTime(startTime)} --> ${formatSRTTime(endTime)}\n`;
    srt += `${p.text}\n\n`;
  });
  return srt.trim();
}

// Generate pure transcribed WebVTT file
export function generateVTT(record: TranscriptionRecord): string {
  let vtt = "WEBVTT\n\n";
  record.paragraphs.forEach((p, index) => {
    const startTime = p.seconds;
    const nextP = record.paragraphs[index + 1];
    const endTime = nextP ? Math.max(nextP.seconds - 0.2, startTime + 1.5) : startTime + Math.max(3, p.text.length * 0.08);
    vtt += `${index + 1}\n`;
    vtt += `${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}\n`;
    vtt += `${p.text}\n\n`;
  });
  return vtt.trim();
}

// Generate Word Document (.doc via HTML) containing ONLY the transcribed text
export function generateWordHTML(record: TranscriptionRecord): string {
  const paragraphsHtml = record.paragraphs
    .map((p) => `<p style="margin-bottom: 16px; font-size: 13pt; line-height: 1.8; color: #111827; text-align: justify;">${p.text}</p>`)
    .join("\n");

  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${record.title}</title>
      <style>
        body {
          font-family: 'Cairo', 'Arial', 'Tahoma', sans-serif;
          direction: rtl;
          text-align: right;
          padding: 36px 44px;
          color: #111827;
          background-color: #ffffff;
        }
      </style>
    </head>
    <body>
      ${paragraphsHtml}
    </body>
    </html>
  `;
}

// Generate pure transcribed text for Notion / Google Docs / Markdown
export function generateMarkdown(record: TranscriptionRecord): string {
  return getPureTranscribedText(record);
}

// Download file trigger helper
export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Trigger real print/PDF window
export function triggerPrintPDF(record: TranscriptionRecord) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const html = generateWordHTML(record);
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 350);
}
