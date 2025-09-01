import React, { useState, useRef } from 'react';
import { PRESETS, ProductPreset } from '@/data/presets';

export type TemplateBrowserProps = {
  onTemplateSelect: (preset: ProductPreset) => void;
  onImageUpload: (file: File) => void;
  currentPreset?: ProductPreset;
};

export default function TemplateBrowser({ onTemplateSelect, onImageUpload, currentPreset }: TemplateBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('business-cards');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'business-cards', label: 'Business Cards', icon: '📇' },
    { id: 'flyers', label: 'Flyers', icon: '📄' },
    { id: 'posters', label: 'Posters', icon: '📋' },
    { id: 'banners', label: 'Banners', icon: '🏴' },
  ];

  const filteredPresets = PRESETS.filter(preset => preset.size.widthMm === currentPreset?.size.widthMm && preset.size.heightMm === currentPreset?.size.heightMm);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="template-browser">
      <div className="template-browser-header">
        <h3 className="template-browser-title">Templates & Upload</h3>
        <div className="template-browser-actions">
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Size-matched templates */}
      {filteredPresets.length > 0 && (
        <div className="template-section">
          <h4 className="template-section-title">Matching Templates</h4>
          <div className="template-grid">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className={`template-card ${currentPreset?.id === preset.id ? 'active' : ''}`}
                onClick={() => onTemplateSelect(preset)}
              >
                <div className="template-preview">
                  <div className="template-size">
                    {preset.size.widthMm}×{preset.size.heightMm}mm
                  </div>
                </div>
                <div className="template-info">
                  <h5 className="template-name">{preset.label}</h5>
                  <div className="template-details">
                    Bleed: {preset.size.bleedMm}mm | Safe: {preset.size.safeMm}mm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category browser */}
      <div className="template-section">
        <h4 className="template-section-title">Browse by Category</h4>
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>

        <div className="template-grid">
          {PRESETS.filter(preset => preset.size.widthMm !== currentPreset?.size.widthMm || preset.size.heightMm !== currentPreset?.size.heightMm)
                  .map((preset) => (
            <div
              key={preset.id}
              className="template-card"
              onClick={() => onTemplateSelect(preset)}
            >
              <div className="template-preview">
                <div className="template-size">
                  {preset.size.widthMm}×{preset.size.heightMm}mm
                </div>
              </div>
              <div className="template-info">
                <h5 className="template-name">{preset.label}</h5>
                <div className="template-details">
                  Bleed: {preset.size.bleedMm}mm | Safe: {preset.size.safeMm}mm
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}
