import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Layout } from 'lucide-react';
import { AILayoutSuggestion } from '@/lib/ai-service';

interface AILayoutTabProps {
  isLoading: boolean;
  layoutSuggestions: AILayoutSuggestion[];
  onGenerateLayout: () => void;
  onApplyLayoutSuggestion: (suggestion: AILayoutSuggestion) => void;
}

export function AILayoutTab({
  isLoading,
  layoutSuggestions,
  onGenerateLayout,
  onApplyLayoutSuggestion,
}: AILayoutTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Layout Optimization</Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerateLayout}
          disabled={isLoading}
          className="h-7 text-xs"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Layout className="w-3 h-3 mr-1" />
          )}
          Analyze
        </Button>
      </div>

      {layoutSuggestions.length > 0 && (
        <div className="space-y-2">
          {layoutSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-2 border rounded-md bg-gray-50"
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs">
                  {suggestion.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </div>
              <p className="text-sm">{suggestion.description}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onApplyLayoutSuggestion(suggestion)}
                className="h-6 text-xs mt-2"
              >
                Apply
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
