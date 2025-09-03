import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AIContextSettingsProps {
  productType: string;
  setProductType: (value: string) => void;
  style: string;
  setStyle: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
}

export function AIContextSettings({
  productType,
  setProductType,
  style,
  setStyle,
  industry,
  setIndustry,
}: AIContextSettingsProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Context for AI</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs text-gray-600">Product Type</Label>
          <Select value={productType} onValueChange={setProductType}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Business Card">Business Card</SelectItem>
              <SelectItem value="Flyer">Flyer</SelectItem>
              <SelectItem value="Poster">Poster</SelectItem>
              <SelectItem value="Brochure">Brochure</SelectItem>
              <SelectItem value="Banner">Banner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-600">Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="minimalist">Minimalist</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="elegant">Elegant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs text-gray-600">Industry (optional)</Label>
        <Input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Technology, Healthcare..."
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}
