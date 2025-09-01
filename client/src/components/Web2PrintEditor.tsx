import React, { useRef, useState, useCallback } from 'react';
import EditorStage, { EditorStageRef } from './designer/EditorStage';
import TemplateBrowser from './TemplateBrowser';
import ExportPanel from './ExportPanel';
import { PRESETS, ProductPreset } from '@/data/presets';

export default function Web2PrintEditor() {
  const editorRef = useRef<EditorStageRef>(null);
  const [currentPreset, setCurrentPreset] = useState<ProductPreset>(PRESETS[0]);

  const handleTemplateSelect = useCallback((preset: ProductPreset) => {
    setCurrentPreset(preset);
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    if (editorRef.current) {
      // Create object URL for the uploaded image
      const imageUrl = URL.createObjectURL(file);
      await editorRef.current.addImage(imageUrl, 50, 50);
    }
  }, []);

  const handleAddText = useCallback(() => {
    editorRef.current?.addText();
  }, []);

  const handleDelete = useCallback(() => {
    editorRef.current?.deleteSelected();
  }, []);

  const handleClear = useCallback(() => {
    editorRef.current?.clearCanvas();
  }, []);

  // Get HTML elements for export (this would need to be passed from SelectionManager)
  const getHtmlElements = useCallback(() => {
    // This is a simplified version - in practice, you'd get this from SelectionManager
    return Array.from(document.querySelectorAll('.text-div')) as HTMLElement[];
  }, []);

  return (
    <div className="web2print-editor">
      <div className="editor-header">
        <h1 className="editor-title">CognitoSphere Web2Print Editor</h1>
        <div className="editor-actions">
          <button onClick={handleAddText} className="action-btn">
            ➕ Add Text
          </button>
          <button onClick={handleDelete} className="action-btn">
            🗑️ Delete
          </button>
          <button onClick={handleClear} className="action-btn">
            🧹 Clear All
          </button>
        </div>
      </div>

      <div className="editor-layout">
        <div className="editor-sidebar">
          <TemplateBrowser
            onTemplateSelect={handleTemplateSelect}
            onImageUpload={handleImageUpload}
            currentPreset={currentPreset}
          />
        </div>

        <div className="editor-canvas">
          <EditorStage
            ref={editorRef}
            widthMm={currentPreset.size.widthMm}
            heightMm={currentPreset.size.heightMm}
            bleedMm={currentPreset.size.bleedMm}
            safeMm={currentPreset.size.safeMm}
          />
        </div>

        <div className="editor-export">
          <ExportPanel
            stage={null} // This would come from EditorStage ref
            htmlElements={getHtmlElements()}
            widthMm={currentPreset.size.widthMm}
            heightMm={currentPreset.size.heightMm}
            bleedMm={currentPreset.size.bleedMm ?? 3}
            safeMm={currentPreset.size.safeMm ?? 3}
          />
        </div>
      </div>


    </div>
  );
}
