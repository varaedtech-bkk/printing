import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Palette } from 'lucide-react';
import { AIColorPalette } from '@/lib/ai-service';

interface AIColorsTabProps {
  isLoading: boolean;
  colorPalettes: AIColorPalette[];
  onGenerateColors: () => void;
  onApplyColorPalette: (palette: AIColorPalette) => void;
}

export function AIColorsTab({
  isLoading,
  colorPalettes,
  onGenerateColors,
  onApplyColorPalette,
}: AIColorsTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Color Palettes</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerateColors}
          disabled={isLoading}
          className="h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Palette className="w-3 h-3 mr-1" />
          )}
          Generate
        </Button>
      </div>

      {colorPalettes.length > 0 && (
        <div className="space-y-2">
          {colorPalettes.map((palette, index) => (
            <div
              key={index}
              className="p-2 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onApplyColorPalette(palette)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{palette.name}</span>
                <Badge variant="outline" className="text-xs">
                  {palette.description}
                </Badge>
              </div>
              <div className="flex gap-1">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: palette.primary }}
                  title="Primary"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: palette.secondary }}
                  title="Secondary"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: palette.accent }}
                  title="Accent"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: palette.background }}
                  title="Background"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: palette.text }}
                  title="Text"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
