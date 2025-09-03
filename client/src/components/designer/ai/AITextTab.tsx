import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Type } from 'lucide-react';
import { AITextSuggestion } from '@/lib/ai-service';

interface AITextTabProps {
  isLoading: boolean;
  textSuggestions: AITextSuggestion[];
  onGenerateText: () => void;
  onApplyTextSuggestion: (suggestion: AITextSuggestion) => void;
  canGenerate: boolean;
}

export function AITextTab({
  isLoading,
  textSuggestions,
  onGenerateText,
  onApplyTextSuggestion,
  canGenerate,
}: AITextTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Text Suggestions</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerateText}
          disabled={isLoading || !canGenerate}
          className="h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-1" />
          )}
          Generate
        </Button>
      </div>

      {textSuggestions.length > 0 && (
        <div className="space-y-2">
          {textSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 border rounded-md bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onApplyTextSuggestion(suggestion)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{suggestion.text}</span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
              {suggestion.reasoning && (
                <p className="text-xs text-gray-600 mt-1">{suggestion.reasoning}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
