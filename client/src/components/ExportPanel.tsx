import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileImage,
  FileText,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Upload
} from 'lucide-react';
import { exportAsPreview, exportForPrint, downloadExport, ExportOptions } from '@/utils/exportUtils';
import {
  exportDesign,
  ExportOptions as NewExportOptions,
  ExportResult,
  DEFAULT_EXPORT_OPTIONS,
  downloadFile
} from '@/lib/export-utils';
import { PrintProduct } from '@/lib/print-product-config';
import { EditorElement } from '@/lib/export-utils';

export type ExportPanelProps = {
  stage: any; // Konva Stage
  htmlElements: HTMLElement[];
  widthMm: number;
  heightMm: number;
  bleedMm: number;
  safeMm: number;
  selectedProduct?: PrintProduct;
  editorRef?: any;
  elements?: EditorElement[];
};

export default function ExportPanel({
  stage,
  htmlElements,
  widthMm,
  heightMm,
  bleedMm,
  safeMm,
  selectedProduct,
  editorRef,
  elements
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportProgressValue, setExportProgressValue] = useState(0);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'svg'>('pdf');
  const [exportQuality, setExportQuality] = useState<'draft' | 'print' | 'high'>('print');
  const [includeBleed, setIncludeBleed] = useState(true);
  const [includeCropMarks, setIncludeCropMarks] = useState(true);
  const [activeTab, setActiveTab] = useState('export');

  const handlePreviewExport = async () => {
    setIsExporting(true);
    setExportProgress('Generating preview...');
    setExportProgressValue(0);

    try {
      const options: ExportOptions = {
        widthMm,
        heightMm,
        bleedMm,
        safeMm,
        format: 'png',
        quality: 0.9
      };

      setExportProgressValue(25);
      const result = await exportAsPreview(stage, htmlElements, options);
      setExportProgressValue(75);
      downloadExport(result);
      setExportProgressValue(100);
      setExportProgress('Preview downloaded!');
    } catch (error) {
      console.error('Preview export failed:', error);
      setExportProgress('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress('');
        setExportProgressValue(0);
      }, 3000);
    }
  };

  const handlePrintExport = async (format: 'png' | 'pdf') => {
    setIsExporting(true);
    setExportProgress(`Generating ${format.toUpperCase()} for print...`);
    setExportProgressValue(0);

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

      setExportProgressValue(25);
      const result = await exportForPrint(stage, htmlElements, options);
      setExportProgressValue(75);
      downloadExport(result);
      setExportProgressValue(100);
      setExportProgress(`${format.toUpperCase()} downloaded!`);
    } catch (error) {
      console.error('Print export failed:', error);
      setExportProgress('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress('');
        setExportProgressValue(0);
      }, 3000);
    }
  };

  const handleAdvancedExport = async () => {
    if (!selectedProduct || !elements || elements.length === 0) {
      setExportProgress('No design elements to export');
      return;
    }

    setIsExporting(true);
    setExportProgress('Preparing export...');
    setExportProgressValue(0);

    try {
      const options: NewExportOptions = {
        format: exportFormat,
        quality: exportQuality,
        includeBleed,
        includeCropMarks,
        colorMode: 'rgb',
        dpi: exportQuality === 'high' ? 600 : exportQuality === 'print' ? 300 : 150
      };

      setExportProgressValue(25);
      setExportProgress(`Generating ${exportFormat.toUpperCase()}...`);

      const result = await exportDesign(elements, selectedProduct, options);

      if (result.success) {
        setExportProgressValue(75);
        setExportProgress('Downloading...');

        if (result.data) {
          if (typeof result.data === 'string') {
            downloadFile(result.data, result.filename || `export.${exportFormat}`);
          } else if (result.data instanceof Blob) {
            const url = URL.createObjectURL(result.data);
            downloadFile(url, result.filename || `export.${exportFormat}`);
          }
        }

        setExportProgressValue(100);
        setExportProgress(`${exportFormat.toUpperCase()} exported successfully!`);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Advanced export failed:', error);
      setExportProgress(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress('');
        setExportProgressValue(0);
      }, 5000);
    }
  };

  const handleSaveDesign = async () => {
    if (!editorRef?.current) {
      setExportProgress('Editor not available');
      return;
    }

    setIsExporting(true);
    setExportProgress('Saving design...');

    try {
      const designData = editorRef.current.getState?.();
      if (designData) {
        const dataStr = JSON.stringify(designData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const filename = `design-${Date.now()}.json`;
        downloadFile(url, filename);
        setExportProgress('Design saved!');
      } else {
        setExportProgress('No design data to save');
      }
    } catch (error) {
      console.error('Save failed:', error);
      setExportProgress('Save failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(''), 3000);
    }
  };

  const handleLoadDesign = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editorRef?.current) return;

    setIsExporting(true);
    setExportProgress('Loading design...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const designData = JSON.parse(e.target?.result as string);
        if (editorRef.current.loadState) {
          editorRef.current.loadState(designData);
          setExportProgress('Design loaded!');
        }
      } catch (error) {
        console.error('Load failed:', error);
        setExportProgress('Load failed - invalid file');
      } finally {
        setIsExporting(false);
        setTimeout(() => setExportProgress(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Design
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
              <TabsTrigger value="save" className="text-xs">Save/Load</TabsTrigger>
            </TabsList>

            {/* Export Tab */}
            <TabsContent value="export" className="space-y-4 mt-4">
              {/* Quick Export Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Export</Label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={handlePreviewExport}
                    disabled={isExporting}
                    className="justify-start h-10"
                  >
                    {isExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileImage className="w-4 h-4 mr-2" />
                    )}
                    Preview PNG (72 DPI)
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handlePrintExport('png')}
                      disabled={isExporting}
                      variant="outline"
                      className="h-10"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileImage className="w-4 h-4 mr-2" />
                      )}
                      PNG (300 DPI)
                    </Button>
                    <Button
                      onClick={() => handlePrintExport('pdf')}
                      disabled={isExporting}
                      variant="outline"
                      className="h-10"
                    >
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      PDF (Print)
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Advanced Export Options */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Advanced Export</Label>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600">Format</Label>
                    <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="svg">SVG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600">Quality</Label>
                    <Select value={exportQuality} onValueChange={(value: any) => setExportQuality(value)}>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (150 DPI)</SelectItem>
                        <SelectItem value="print">Print (300 DPI)</SelectItem>
                        <SelectItem value="high">High (600 DPI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600">Include Bleed</Label>
                    <Switch
                      checked={includeBleed}
                      onCheckedChange={setIncludeBleed}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600">Include Crop Marks</Label>
                    <Switch
                      checked={includeCropMarks}
                      onCheckedChange={setIncludeCropMarks}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAdvancedExport}
                  disabled={isExporting || !selectedProduct || !elements?.length}
                  className="w-full h-10"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export {exportFormat.toUpperCase()}
                </Button>
              </div>
            </TabsContent>

            {/* Save/Load Tab */}
            <TabsContent value="save" className="space-y-4 mt-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Design Files</Label>

                <Button
                  onClick={handleSaveDesign}
                  disabled={isExporting}
                  variant="outline"
                  className="w-full h-10 justify-start"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Design (.json)
                </Button>

                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Load Design</Label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleLoadDesign}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isExporting}
                    />
                    <Button
                      variant="outline"
                      className="w-full h-10 justify-start"
                      disabled={isExporting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Load Design File
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Design Information */}
          <Separator className="my-4" />
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <span className="font-medium">Dimensions:</span>
              <p>{widthMm} × {heightMm} mm</p>
            </div>
            <div>
              <span className="font-medium">Product:</span>
              <p>{selectedProduct?.nameEn || 'Custom'}</p>
            </div>
            <div>
              <span className="font-medium">Bleed:</span>
              <p>{bleedMm} mm</p>
            </div>
            <div>
              <span className="font-medium">Elements:</span>
              <p>{elements?.length || 0}</p>
            </div>
          </div>

          {/* Export Progress */}
          {exportProgress && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                ) : exportProgress.includes('successfully') ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">{exportProgress}</span>
              </div>
              {isExporting && (
                <Progress value={exportProgressValue} className="h-2" />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
