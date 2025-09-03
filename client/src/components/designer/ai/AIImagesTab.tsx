import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { AIImageSuggestion } from '@/lib/ai-service';

interface AIImagesTabProps {
  isLoading: boolean;
  imageSuggestions: AIImageSuggestion[];
  onGenerateImages: () => void;
  canGenerate: boolean;
}

export function AIImagesTab({
  isLoading,
  imageSuggestions,
  onGenerateImages,
  canGenerate,
}: AIImagesTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Image Suggestions</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerateImages}
          disabled={isLoading || !canGenerate}
          className="h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <ImageIcon className="w-3 h-3 mr-1" />
          )}
          Find Images
        </Button>
      </div>

      {imageSuggestions.length > 0 && (
        <div className="space-y-2">
          {imageSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{suggestion.alt}</span>
                <Badge variant="outline" className="text-xs">
                  {suggestion.source}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestion.tags.map((tag, tagIndex) => (
                  <Badge key={tagIndex} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
