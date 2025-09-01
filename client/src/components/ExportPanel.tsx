import React, { useState } from 'react';
import { exportAsPreview, exportForPrint, downloadExport, ExportOptions } from '@/utils/exportUtils';

export type ExportPanelProps = {
  stage: any; // Konva Stage
  htmlElements: HTMLElement[];
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMm: number;
};

export default function ExportPanel({
  stage,
  htmlElements,
  widthMm,
  heightMm,
  bleedMm,
  safeMm
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  const handlePreviewExport = async () => {
    setIsExporting(true);
    setExportProgress('Generating preview...');

    try {
      const options: ExportOptions = {
        widthMm,
        heightMm,
        bleedMm,
        safeMm,
        format: 'png',
        quality: 0.9
      };

      const result = await exportAsPreview(stage, htmlElements, options);
      downloadExport(result);
      setExportProgress('Preview downloaded!');
    } catch (error) {
      console.error('Preview export failed:', error);
      setExportProgress('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(''), 3000);
    }
  };

  const handlePrintExport = async (format: 'png' | 'pdf') => {
    setIsExporting(true);
    setExportProgress(`Generating ${format.toUpperCase()} for print...`);

    try {
      const options: ExportOptions = {
        widthMm,
        heightMm,
        bleedMm,
        safeMm,
        format,
        includeCropMarks: true,
        includeBleed: true
      };

      const result = await exportForPrint(stage, htmlElements, options);
      downloadExport(result);
      setExportProgress(`${format.toUpperCase()} downloaded!`);
    } catch (error) {
      console.error('Print export failed:', error);
      setExportProgress('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(''), 3000);
    }
  };

  return (
    <div className="export-panel">
      <h3 className="export-panel-title">Export Design</h3>

      <div className="export-section">
        <h4 className="export-section-title">Preview (Screen)</h4>
        <p className="export-description">
          Low-resolution PNG for quick preview and sharing
        </p>
        <button
          className="export-button preview-button"
          onClick={handlePreviewExport}
          disabled={isExporting}
        >
          {isExporting ? '⏳' : '📱'} Export Preview PNG
        </button>
      </div>

      <div className="export-section">
        <h4 className="export-section-title">Print Production</h4>
        <p className="export-description">
          High-resolution files with bleed and crop marks for professional printing
        </p>

        <div className="export-options">
          <button
            className="export-button print-button png-button"
            onClick={() => handlePrintExport('png')}
            disabled={isExporting}
          >
            {isExporting ? '⏳' : '🖼️'} PNG (300 DPI)
          </button>

          <button
            className="export-button print-button pdf-button"
            onClick={() => handlePrintExport('pdf')}
            disabled={isExporting}
          >
            {isExporting ? '⏳' : '📄'} PDF (Print-Ready)
          </button>
        </div>
      </div>

      <div className="export-info">
        <div className="info-item">
          <strong>Dimensions:</strong> {widthMm} × {heightMm} mm
        </div>
        <div className="info-item">
          <strong>Bleed:</strong> {bleedMm} mm
        </div>
        <div className="info-item">
          <strong>Safe Zone:</strong> {safeMm} mm
        </div>
        <div className="info-item">
          <strong>Print DPI:</strong> 300
        </div>
      </div>

      {exportProgress && (
        <div className="export-progress">
          {exportProgress}
        </div>
      )}


    </div>
  );
}
