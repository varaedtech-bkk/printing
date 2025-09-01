import Konva from 'konva';
import jsPDF from 'jspdf';
import { PRINT_DPI, mmToPx } from './units';

export interface ExportOptions {
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMm: number;
  includeCropMarks?: boolean;
  includeBleed?: boolean;
  quality?: number; // 0-1 for PNG
  format?: 'png' | 'pdf';
}

export interface ExportResult {
  url: string;
  blob: Blob;
  filename: string;
}

/**
 * Export canvas as PNG preview (72 DPI)
 */
export async function exportAsPreview(
  stage: Konva.Stage,
  htmlElements: HTMLElement[],
  options: ExportOptions
): Promise<ExportResult> {
  const { widthMm, heightMm, bleedMm, quality = 0.9 } = options;

  // Calculate preview dimensions (72 DPI)
  const previewWidth = mmToPx(widthMm, 72);
  const previewHeight = mmToPx(heightMm, 72);

  // Create a temporary canvas for compositing
  const canvas = document.createElement('canvas');
  canvas.width = previewWidth;
  canvas.height = previewHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, previewWidth, previewHeight);

  // Draw Konva stage
  const konvaCanvas = stage.toCanvas({
    pixelRatio: 72 / stage.scaleX() // Adjust for current zoom
  });

  // Scale and draw Konva content
  const scaleX = previewWidth / konvaCanvas.width;
  const scaleY = previewHeight / konvaCanvas.height;
  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = konvaCanvas.width * scale;
  const scaledHeight = konvaCanvas.height * scale;
  const offsetX = (previewWidth - scaledWidth) / 2;
  const offsetY = (previewHeight - scaledHeight) / 2;

  ctx.drawImage(konvaCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

  // Draw HTML text elements
  for (const element of htmlElements) {
    const rect = element.getBoundingClientRect();
    const stageRect = stage.container().getBoundingClientRect();

    // Calculate position relative to stage
    const x = ((rect.left - stageRect.left) / stageRect.width) * previewWidth;
    const y = ((rect.top - stageRect.top) / stageRect.height) * previewHeight;
    const width = (rect.width / stageRect.width) * previewWidth;
    const height = (rect.height / stageRect.height) * previewHeight;

    // Draw text background if needed
    if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') {
      ctx.fillStyle = element.style.backgroundColor;
      ctx.fillRect(x, y, width, height);
    }

    // Draw text
    ctx.fillStyle = element.style.color || '#000000';
    ctx.font = `${element.style.fontSize || '16px'} ${element.style.fontFamily || 'Arial'}`;
    ctx.textAlign = (element.style.textAlign as CanvasTextAlign) || 'left';
    ctx.textBaseline = 'top';

    // Handle multiline text
    const lines = element.innerText.split('\n');
    const lineHeight = parseFloat(element.style.lineHeight) || 1.2;
    const fontSize = parseFloat(element.style.fontSize || '16');

    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + (fontSize * lineHeight * index));
    });
  }

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve({
          url,
          blob,
          filename: `preview-${widthMm}x${heightMm}mm.png`
        });
      }
    }, 'image/png', quality);
  });
}

/**
 * Export for print production (300 DPI) with bleed and crop marks
 */
export async function exportForPrint(
  stage: Konva.Stage,
  htmlElements: HTMLElement[],
  options: ExportOptions
): Promise<ExportResult> {
  const { widthMm, heightMm, bleedMm, safeMm, includeCropMarks = true, includeBleed = true, format = 'pdf' } = options;

  // Calculate print dimensions (300 DPI)
  const contentWidth = mmToPx(widthMm, PRINT_DPI);
  const contentHeight = mmToPx(heightMm, PRINT_DPI);
  const bleedWidth = includeBleed ? mmToPx(bleedMm, PRINT_DPI) : 0;
  const cropMarkLength = mmToPx(5, PRINT_DPI); // 5mm crop marks

  const totalWidth = contentWidth + (bleedWidth * 2);
  const totalHeight = contentHeight + (bleedWidth * 2);

  // Create canvas for print export
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw bleed area background if different
  if (includeBleed) {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(bleedWidth, bleedWidth, contentWidth, contentHeight);
  }

  // Draw content area
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bleedWidth, bleedWidth, contentWidth, contentHeight);

  // Draw Konva content
  const konvaCanvas = stage.toCanvas({ pixelRatio: PRINT_DPI / 72 });

  // Scale to fit content area
  const contentScaleX = contentWidth / konvaCanvas.width;
  const contentScaleY = contentHeight / konvaCanvas.height;
  const contentScale = Math.min(contentScaleX, contentScaleY);

  const scaledContentWidth = contentWidth;
  const scaledContentHeight = contentHeight;
  const contentOffsetX = bleedWidth;
  const contentOffsetY = bleedWidth;

  ctx.drawImage(
    konvaCanvas,
    contentOffsetX,
    contentOffsetY,
    scaledContentWidth,
    scaledContentHeight
  );

  // Draw HTML text elements
  for (const element of htmlElements) {
    const rect = element.getBoundingClientRect();
    const stageRect = stage.container().getBoundingClientRect();

    // Calculate position relative to content area
    const x = contentOffsetX + ((rect.left - stageRect.left) / stageRect.width) * contentWidth;
    const y = contentOffsetY + ((rect.top - stageRect.top) / stageRect.height) * contentHeight;
    const width = (rect.width / stageRect.width) * contentWidth;
    const height = (rect.height / stageRect.height) * contentHeight;

    // Draw text background if needed
    if (element.style.backgroundColor && element.style.backgroundColor !== 'transparent') {
      ctx.fillStyle = element.style.backgroundColor;
      ctx.fillRect(x, y, width, height);
    }

    // Draw text
    ctx.fillStyle = element.style.color || '#000000';
    ctx.font = `${element.style.fontSize || '16px'} ${element.style.fontFamily || 'Arial'}`;
    ctx.textAlign = (element.style.textAlign as CanvasTextAlign) || 'left';
    ctx.textBaseline = 'top';

    // Handle multiline text
    const lines = element.innerText.split('\n');
    const lineHeight = parseFloat(element.style.lineHeight) || 1.2;
    const fontSize = parseFloat(element.style.fontSize || '16');

    lines.forEach((line, index) => {
      ctx.fillText(line, x, y + (fontSize * lineHeight * index));
    });
  }

  // Draw crop marks
  if (includeCropMarks) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.5;

    // Horizontal crop marks
    const yPositions = [bleedWidth, totalHeight - bleedWidth];
    yPositions.forEach(y => {
      // Left crop mark
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cropMarkLength, y);
      ctx.stroke();

      // Right crop mark
      ctx.beginPath();
      ctx.moveTo(totalWidth - cropMarkLength, y);
      ctx.lineTo(totalWidth, y);
      ctx.stroke();
    });

    // Vertical crop marks
    const xPositions = [bleedWidth, totalWidth - bleedWidth];
    xPositions.forEach(x => {
      // Top crop mark
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, cropMarkLength);
      ctx.stroke();

      // Bottom crop mark
      ctx.beginPath();
      ctx.moveTo(x, totalHeight - cropMarkLength);
      ctx.lineTo(x, totalHeight);
      ctx.stroke();
    });
  }

  if (format === 'pdf') {
    return await exportAsPDF(canvas, options);
  } else {
    // Export as high-quality PNG
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve({
            url,
            blob,
            filename: `print-${widthMm}x${heightMm}mm-${PRINT_DPI}dpi.png`
          });
        }
      }, 'image/png', 1.0); // Maximum quality for print
    });
  }
}

/**
 * Export canvas as PDF with print specifications
 */
async function exportAsPDF(canvas: HTMLCanvasElement, options: ExportOptions): Promise<ExportResult> {
  const { widthMm, heightMm, bleedMm } = options;

  // Calculate PDF dimensions in points (72 DPI)
  const pdfWidth = (widthMm + bleedMm * 2) * 2.83465; // mm to points
  const pdfHeight = (heightMm + bleedMm * 2) * 2.83465;

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pdfWidth, pdfHeight]
  });

  // Convert canvas to image data
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Add image to PDF
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  // Add print metadata
  pdf.setProperties({
    title: `Print Design ${widthMm}x${heightMm}mm`,
    subject: `Print-ready PDF with ${PRINT_DPI} DPI`,
    creator: 'CognitoSphere Web2Print',
    keywords: 'print, design, pdf, bleed, crop marks',
  });

  // Convert to blob
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);

  return {
    url,
    blob: pdfBlob,
    filename: `print-${widthMm}x${heightMm}mm.pdf`
  };
}

/**
 * Download exported file
 */
export function downloadExport(result: ExportResult): void {
  const link = document.createElement('a');
  link.href = result.url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up URL object
  URL.revokeObjectURL(result.url);
}

/**
 * Auto-cleanup export URLs
 */
export function cleanupExport(result: ExportResult): void {
  URL.revokeObjectURL(result.url);
}
