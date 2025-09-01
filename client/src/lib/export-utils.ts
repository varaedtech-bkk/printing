import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintProduct, getExportDimensions, mmToPixels } from './print-product-config';

// Define EditorElement interface based on Konva SelectionManager's output
export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  position: { x: number; y: number; };
  size: { width: number; height: number; };
  rotation?: number;
  scale?: { x: number; y: number; };
  opacity?: number; // Moved from style to top-level
  visible?: boolean;
  // Text specific
  content?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontWeight?: 'normal' | 'bold' | number;
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  // Image specific
  src?: string;
  url?: string; // For images that might use a direct URL
  // Shape specific
  shapeType?: 'rectangle' | 'circle' | 'ellipse' | 'triangle';
}

export interface ExportOptions {
  format: 'pdf' | 'svg' | 'png';
  quality: 'draft' | 'print' | 'high';
  includeBleed: boolean;
  includeCropMarks: boolean;
  colorMode: 'rgb' | 'cmyk';
  dpi: number;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  error?: string;
  filename?: string;
}

// Default export options
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'pdf',
  quality: 'print',
  includeBleed: true,
  includeCropMarks: true,
  colorMode: 'cmyk',
  dpi: 300
};

// Convert RGB to CMYK
function rgbToCmyk(r: number, g: number, b: number): { c: number; m: number; y: number; k: number } {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const k = 1 - Math.max(red, green, blue);
  const c = (1 - red - k) / (1 - k);
  const m = (1 - green - k) / (1 - k);
  const y = (1 - blue - k) / (1 - k);

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
}

// Parse hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Generate crop marks SVG
function generateCropMarks(width: number, height: number, bleed: number): string {
  const cropMarkLength = 10;
  const cropMarkWidth = 1;
  
  return `
    <g id="crop-marks" stroke="#000000" stroke-width="${cropMarkWidth}" fill="none">
      <!-- Top-left -->
      <line x1="0" y1="0" x2="${cropMarkLength}" y2="0" />
      <line x1="0" y1="0" x2="0" y2="${cropMarkLength}" />
      
      <!-- Top-right -->
      <line x1="${width}" y1="0" x2="${width - cropMarkLength}" y2="0" />
      <line x1="${width}" y1="0" x2="${width}" y2="${cropMarkLength}" />
      
      <!-- Bottom-left -->
      <line x1="0" y1="${height}" x2="${cropMarkLength}" y2="${height}" />
      <line x1="0" y1="${height}" x2="0" y2="${height - cropMarkLength}" />
      
      <!-- Bottom-right -->
      <line x1="${width}" y1="${height}" x2="${width - cropMarkLength}" y2="${height}" />
      <line x1="${width}" y1="${height}" x2="${width}" y2="${height - cropMarkLength}" />
    </g>
  `;
}

// Generate bleed guides SVG
function generateBleedGuides(width: number, height: number, bleed: number): string {
  return `
    <g id="bleed-guides" stroke="#ff0000" stroke-width="1" fill="none" opacity="0.3">
      <!-- Bleed area outline -->
      <rect x="0" y="0" width="${width}" height="${height}" stroke-dasharray="5,5" />
      
      <!-- Safe print area -->
      <rect x="${bleed}" y="${bleed}" width="${width - (bleed * 2)}" height="${height - (bleed * 2)}" stroke="#00ff00" stroke-dasharray="3,3" />
    </g>
  `;
}

// Export to SVG
export async function exportToSVG(
  elements: EditorElement[],
  product: PrintProduct,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<ExportResult> {
  try {
    const exportDimensions = getExportDimensions(product);
    const bleedPixels = mmToPixels(product.dimensions.bleed, product.dimensions.dpi);
    
    let svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${exportDimensions.width}" 
           height="${exportDimensions.height}" 
           viewBox="0 0 ${exportDimensions.width} ${exportDimensions.height}">
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="white" />
        
        <!-- Bleed guides (if enabled) -->
        ${options.includeBleed ? generateBleedGuides(exportDimensions.width, exportDimensions.height, bleedPixels) : ''}
        
        <!-- Crop marks (if enabled) -->
        ${options.includeCropMarks ? generateCropMarks(exportDimensions.width, exportDimensions.height, bleedPixels) : ''}
        
        <!-- Design elements -->
        <g id="design-elements">
    `;

    // Add elements to SVG
    elements.forEach(element => {
      if (element.type === 'text') {
        const { position, size, style, content } = element;
        const fontSize = (style?.fontSize || 12) * (product.dimensions.dpi / 72); // Convert from 72 DPI to export DPI
        
        svgContent += `
          <text x="${position.x}" y="${position.y + fontSize}" 
                font-family="${style?.fontFamily || 'sans-serif'}" 
                font-size="${fontSize}" 
                font-weight="${style?.fontWeight || 'normal'}" 
                fill="${options.colorMode === 'cmyk' ? '#000000' : style?.color || '#000000'}"
                text-anchor="${style?.textAlign === 'center' ? 'middle' : style?.textAlign === 'right' ? 'end' : 'start'}">
            ${content?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''}
          </text>
        `;
      } else if (element.type === 'image') {
        const { position, size, url } = element;
        svgContent += `
          <image x="${position.x}" y="${position.y}" 
                 width="${size.width}" height="${size.height}" 
                 href="${url || element.src}" />
        `;
      } else if (element.type === 'shape') {
        const { position, size, style, shapeType } = element;
        
        if (shapeType === 'rectangle') {
          svgContent += `
            <rect x="${position.x}" y="${position.y}" 
                  width="${size.width}" height="${size.height}" 
                  fill="${style?.fill || 'none'}" stroke="${style?.stroke || 'none'}" 
                  stroke-width="${style?.strokeWidth || 0}" 
                  opacity="${element.opacity || 1}" />
          `;
        } else if (shapeType === 'circle') {
          const centerX = position.x + size.width / 2;
          const centerY = position.y + size.height / 2;
          const radius = Math.min(size.width, size.height) / 2;
          
          svgContent += `
            <circle cx="${centerX}" cy="${centerY}" r="${radius}" 
                    fill="${style?.fill || 'none'}" stroke="${style?.stroke || 'none'}" 
                    stroke-width="${style?.strokeWidth || 0}" 
                    opacity="${element.opacity || 1}" />
          `;
        } else if (shapeType === 'ellipse') {
          const centerX = position.x + size.width / 2;
          const centerY = position.y + size.height / 2;
          const radiusX = size.width / 2;
          const radiusY = size.height / 2;
          
          svgContent += `
            <ellipse cx="${centerX}" cy="${centerY}" 
                     rx="${radiusX}" ry="${radiusY}" 
                     fill="${style?.fill || 'none'}" stroke="${style?.stroke || 'none'}" 
                     stroke-width="${style?.strokeWidth || 0}" 
                     opacity="${element.opacity || 1}" />
          `;
        }
      }
    });

    svgContent += `
        </g>
      </svg>
    `;

    // Create blob and download
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const filename = `${product.nameEn.replace(/\s+/g, '-')}-${Date.now()}.svg`;
    
    return {
      success: true,
      data: url,
      filename
    };
  } catch (error) {
    console.error('❌ SVG export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export to PDF
export async function exportToPDF(
  elements: EditorElement[],
  product: PrintProduct,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<ExportResult> {
  try {
    const exportDimensions = getExportDimensions(product);
    const bleedPixels = mmToPixels(product.dimensions.bleed, product.dimensions.dpi);
    
    // Create PDF with proper dimensions (convert pixels to mm)
    const pdfWidth = (exportDimensions.width * 25.4) / product.dimensions.dpi;
    const pdfHeight = (exportDimensions.height * 25.4) / product.dimensions.dpi;
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    // Set background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

    // Add bleed guides if enabled
    if (options.includeBleed) {
      pdf.setDrawColor(255, 0, 0);
      pdf.setLineWidth(0.1);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'D');
      
      // Safe print area
      const safeWidth = pdfWidth - (product.dimensions.bleed * 2);
      const safeHeight = pdfHeight - (product.dimensions.bleed * 2);
      pdf.setDrawColor(0, 255, 0);
      pdf.rect(product.dimensions.bleed, product.dimensions.bleed, safeWidth, safeHeight, 'D');
    }

    // Add crop marks if enabled
    if (options.includeCropMarks) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.1);
      
      const cropLength = 3; // 3mm crop marks
      
      // Top-left
      pdf.line(0, 0, cropLength, 0);
      pdf.line(0, 0, 0, cropLength);
      
      // Top-right
      pdf.line(pdfWidth, 0, pdfWidth - cropLength, 0);
      pdf.line(pdfWidth, 0, pdfWidth, cropLength);
      
      // Bottom-left
      pdf.line(0, pdfHeight, cropLength, pdfHeight);
      pdf.line(0, pdfHeight, 0, pdfHeight - cropLength);
      
      // Bottom-right
      pdf.line(pdfWidth, pdfHeight, pdfWidth - cropLength, pdfHeight);
      pdf.line(pdfWidth, pdfHeight, pdfWidth, pdfHeight - cropLength);
    }

    // Add design elements
    await Promise.all(elements.map(async element => {
      if (element.type === 'text') {
        const { position, style, content } = element;
        
        // Convert position from pixels to mm
        const x = (position.x * 25.4) / product.dimensions.dpi;
        const y = (position.y * 25.4) / product.dimensions.dpi;
        const fontSize = ((style?.fontSize || 12) * 25.4) / 72; // Convert from 72 DPI to mm
        
        // Set font properties
        pdf.setFontSize(fontSize);
        pdf.setTextColor(0, 0, 0); // Always black for print
        
        // Handle text alignment
        let textX = x;
        if (style?.textAlign === 'center') {
          const textWidth = pdf.getTextWidth(content || '');
          textX = x - (textWidth / 2);
        } else if (style?.textAlign === 'right') {
          const textWidth = pdf.getTextWidth(content || '');
          textX = x - textWidth;
        }
        
        pdf.text(content || '', textX, y);
        
      } else if (element.type === 'shape') {
        const { position, size, style: shapeStyle } = element;
        
        // Convert dimensions from pixels to mm
        const x = (position.x * 25.4) / product.dimensions.dpi;
        const y = (position.y * 25.4) / product.dimensions.dpi;
        const width = (size.width * 25.4) / product.dimensions.dpi;
        const height = (size.height * 25.4) / product.dimensions.dpi;
        
        if (shapeStyle?.fill && shapeStyle.fill !== 'transparent') {
          // Convert fill color to RGB for PDF
          const rgb = hexToRgb(shapeStyle.fill);
          pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        }
        
        if (shapeStyle?.stroke && shapeStyle.stroke !== 'transparent') {
          const rgb = hexToRgb(shapeStyle.stroke);
          pdf.setDrawColor(rgb.r, rgb.g, rgb.b);
          pdf.setLineWidth(((shapeStyle?.strokeWidth || 0) * 25.4) / product.dimensions.dpi);
        }
        
        if (element.shapeType === 'rectangle') {
          pdf.rect(x, y, width, height, shapeStyle?.fill !== 'transparent' ? 'F' : 'D');
        } else if (element.shapeType === 'circle') {
          pdf.circle(x + width/2, y + height/2, Math.min(width, height)/2, shapeStyle?.fill !== 'transparent' ? 'F' : 'D');
        }
      } else if (element.type === 'image') {
        const { position, size, url, src, opacity } = element;
        const imgUrl = url || src;
        
        // Convert dimensions from pixels to mm
        const x = (position.x * 25.4) / product.dimensions.dpi;
        const y = (position.y * 25.4) / product.dimensions.dpi;
        const width = (size.width * 25.4) / product.dimensions.dpi;
        const height = (size.height * 25.4) / product.dimensions.dpi;

        if (imgUrl) {
          // Load image using an async function or a promise
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = imgUrl;
          });

          // Set opacity if provided
          const currentOpacity = opacity !== undefined ? opacity : 1;
          pdf.setGState(new (jsPDF as any).GState({ opacity: currentOpacity }));

          pdf.addImage(img, 'PNG', x, y, width, height);
          pdf.setGState(new (jsPDF as any).GState({ opacity: 1 })); // Reset opacity
        }
      }
    }));

    // Generate filename
    const filename = `${product.nameEn.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
    
    // Save PDF
    pdf.save(filename);
    
    return {
      success: true,
      filename
    };
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export to PNG
export async function exportToPNG(
  elements: EditorElement[],
  product: PrintProduct,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<ExportResult> {
  try {
    // For PNG export, we'll use html2canvas to capture the current view
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    const exportDimensions = getExportDimensions(product);
    canvas.width = exportDimensions.width;
    canvas.height = exportDimensions.height;
    
    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw elements (simplified version for PNG)
    elements.forEach(element => {
      if (element.type === 'text') {
        const { position, style, content, opacity } = element;
        
        ctx.font = `${style?.fontWeight || 'normal'} ${style?.fontSize || 12}px ${style?.fontFamily || 'sans-serif'}`;
        ctx.fillStyle = style?.color || '#000000';
        ctx.textAlign = (style?.textAlign as CanvasTextAlign) || 'left';
        ctx.globalAlpha = opacity !== undefined ? opacity : 1; // Apply opacity
        ctx.fillText(content || '', position.x, position.y + (style?.fontSize || 12));
        ctx.globalAlpha = 1; // Reset global alpha
        
      } else if (element.type === 'image') {
        const { position, size, url, src, opacity } = element;
        const imgUrl = url || src;

        if (imgUrl) {
          const img = new Image();
          img.src = imgUrl;
          img.onload = () => {
            ctx.globalAlpha = opacity !== undefined ? opacity : 1; // Apply opacity
            ctx.drawImage(img, position.x, position.y, size.width, size.height);
            ctx.globalAlpha = 1; // Reset global alpha
          };
          img.onerror = (e) => {
            console.error('Error drawing image to canvas for PNG export:', e);
          };
        }
        
      } else if (element.type === 'shape') {
        const { position, size, style: shapeStyle, opacity } = element;
        
        ctx.globalAlpha = opacity !== undefined ? opacity : 1; // Apply opacity

        if (shapeStyle?.fill && shapeStyle.fill !== 'transparent') {
          ctx.fillStyle = shapeStyle.fill;
        }
        
        if (shapeStyle?.stroke && shapeStyle.stroke !== 'transparent') {
          ctx.strokeStyle = shapeStyle.stroke;
          ctx.lineWidth = shapeStyle.strokeWidth || 1;
        }
        
        if (element.shapeType === 'rectangle') {
          if (shapeStyle?.fill && shapeStyle.fill !== 'transparent') {
            ctx.fillRect(position.x, position.y, size.width, size.height);
          }
          if (shapeStyle?.stroke && shapeStyle.stroke !== 'transparent') {
            ctx.strokeRect(position.x, position.y, size.width, size.height);
          }
        } else if (element.shapeType === 'circle') {
          const centerX = position.x + size.width / 2;
          const centerY = position.y + size.height / 2;
          const radius = Math.min(size.width, size.height) / 2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          
          if (shapeStyle?.fill && shapeStyle.fill !== 'transparent') {
            ctx.fill();
          }
          if (shapeStyle?.stroke && shapeStyle.stroke !== 'transparent') {
            ctx.stroke();
          }
        }
      }
    });
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/png', 1.0);
    });
    
    const url = URL.createObjectURL(blob);
    const filename = `${product.nameEn.replace(/\s+/g, '-')}-${Date.now()}.png`;
    
    return {
      success: true,
      data: url,
      filename
    };
  } catch (error) {
    console.error('❌ PNG export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main export function
export async function exportDesign(
  elements: EditorElement[],
  product: PrintProduct,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<ExportResult> {
  console.log('🚀 Starting export:', options.format);
  
  try {
    switch (options.format) {
      case 'svg':
        return await exportToSVG(elements, product, options);
      case 'pdf':
        return await exportToPDF(elements, product, options);
      case 'png':
        return await exportToPNG(elements, product, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Download helper
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
