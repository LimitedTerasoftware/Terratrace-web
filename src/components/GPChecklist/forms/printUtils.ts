export const toBase64 = async (source: File | string): Promise<string> => {
  try {
    if (source instanceof File) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(source);
      });
    }
    const response = await fetch(source, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error(`Failed to fetch: ${source}`);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Base64 conversion failed:', source, err);
    return typeof source === 'string' ? source : '';
  }
};

export const addImageAttachment = async (
  img: {
    id: string;
    file?: File;
    preview: string;
    watermarkedPreview?: string;
  },
  label: string,
  attachmentPages: string[],
): Promise<string> => {
  let src = img.watermarkedPreview || img.preview;
  try {
    src = img.file ? await toBase64(img.file) : await toBase64(src);
  } catch {
    /* ignore */
  }
  const name = img.file?.name || label;
  attachmentPages.push(`
    <div class="attachment-page">
      <div class="attachment-label">${name}</div>
      <img src="${src}" alt="${name}" />
    </div>
  `);
  return `<div class="image-thumb"><img src="${src}" alt="${name}" crossorigin="anonymous"/></div>`;
};

export const createPrintStyles = (): string => `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 14mm 16mm 18mm 16mm; }
  .report-header {
    display: flex; align-items: center; justify-content: space-between;
    padding-bottom: 14px; border-bottom: 3px solid #1565c0; margin-bottom: 22px;
  }
  .report-header h1 { font-size: 17pt; font-weight: 700; color: #0d47a1; }
  .report-header p { font-size: 9pt; color: #5f6b8c; margin-top: 2px; }
  .section-card {
    border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 16px;
    overflow: hidden; break-inside: auto; page-break-inside: auto;
  }
  .section-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
    font-size: 11pt; font-weight: 700; color: #1d4ed8;
  }
  .section-body { padding: 12px 14px; }
  .field-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 9.5pt;
  }
  .field-label { color: #475569; font-weight: 500; }
  .field-value { color: #1e293b; font-weight: 600; }
  .badge-yes { background: #dcfce7; color: #166534; padding: 2px 10px; border-radius: 99px; font-size: 9pt; font-weight: 600; }
  .badge-no { background: #fee2e2; color: #991b1b; padding: 2px 10px; border-radius: 99px; font-size: 9pt; font-weight: 600; }
  .badge-pending { background: #f1f5f9; color: #64748b; padding: 2px 10px; border-radius: 99px; font-size: 9pt; font-weight: 600; }
  .badge-na { background: #fef9c3; color: #854d0e; padding: 2px 10px; border-radius: 99px; font-size: 9pt; font-weight: 600; }
  .images-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-top: 10px; }
  .image-thumb { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; aspect-ratio: 4/3; }
  .image-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .remark-box {
    background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;
    padding: 8px 12px; margin-top: 8px; font-size: 9pt; color: #78350f;
  }
  .text-value { color: #1e293b; font-size: 9.5pt; padding: 4px 0; }
  .file-info {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; background: #f0fdf4; border: 1px solid #86efac;
    border-radius: 6px; margin-top: 6px; font-size: 9pt; color: #166534;
  }
  .signature-section { margin-top: 28px; padding-top: 18px; border-top: 2px solid #e2e8f0; page-break-inside: avoid; }
  .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .signature-block { text-align: center; }
  .signature-line { border-bottom: 1px solid #94a3b8; margin-bottom: 6px; height: 40px; }
  .signature-label { font-size: 8.5pt; color: #64748b; }
  .report-footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8pt; color: #94a3b8; }
  .subsection-title { font-size: 10pt; font-weight: 600; color: #374151; margin: 12px 0 8px; padding: 6px 10px; background: #f1f5f9; border-radius: 6px; }
  .attachment-page {
    page-break-before: always;
    break-before: page;
    page-break-inside: avoid;
    break-inside: avoid;
    height: 245mm;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .attachment-label {
    flex: 0 0 auto;
    padding: 7px 10px;
    font-size: 8.5pt;
    font-weight: 700;
    color: #1e293b;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    word-break: break-word;
  }
  .attachment-page img {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
    background: #fff;
  }
  .appendix-header {
    page-break-before: always;
    break-before: page;
    padding: 20px 0 10px;
    font-size: 14pt;
    font-weight: 700;
    color: #0d47a1;
    text-align: center;
  }
`;

export const buildPrintPage = (
  title: string,
  subtitle: string,
  bodySections: string,
  attachmentPages?: string[],
  blockName?: string,
): string => {
  const now = new Date().toLocaleString();
  const attachments =
    attachmentPages && attachmentPages.length > 0
      ? `<div class="appendix-header">Photo Appendix</div>${attachmentPages.join('')}`
      : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>${createPrintStyles()}</style>
</head>
<body>
  <div class="report-header">
    <div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      ${blockName ? `<p style="font-size:8pt;color:#94a3b8;margin-top:2px;">Block: ${blockName}</p>` : ''}
      <p style="font-size:8pt;color:#94a3b8;margin-top:2px;">Generated: ${now}</p>
    </div>
  </div>
  ${bodySections}
  <div class="signature-section">
    <div class="signature-grid">
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">Prepared By</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">Reviewed By</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">Approved By</div></div>
    </div>
  </div>
  <div class="report-footer">
    <span>GP Checklist — ${title}</span>
    <span>Confidential — Internal Use Only</span>
  </div>
  ${attachments}
</body>
</html>`;
};
