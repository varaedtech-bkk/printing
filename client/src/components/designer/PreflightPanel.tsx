import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle, 
  Eye, 
  EyeOff,
  RefreshCw,
  Download,
  Settings,
  FileText,
  Image as ImageIcon,
  Palette,
  Type,
  Accessibility
} from 'lucide-react';
import { 
  PreflightResult, 
  PreflightIssue, 
  PreflightChecker,
  DesignElement,
  PrintProduct 
} from '@/lib/preflight-checks';

interface PreflightPanelProps {
  elements: DesignElement[];
  product: PrintProduct;
  onRunChecks?: () => void;
  className?: string;
}

const categoryIcons = {
  resolution: ImageIcon,
  bleed: FileText,
  fonts: Type,
  colors: Palette,
  accessibility: Accessibility,
  content: FileText
};

const severityColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
};

const typeColors = {
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200'
};

export function PreflightPanel({ 
  elements, 
  product, 
  onRunChecks,
  className = '' 
}: PreflightPanelProps) {
  const [preflightResult, setPreflightResult] = useState<PreflightResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showFixed, setShowFixed] = useState(true);

  // Run preflight checks
  const runPreflightChecks = async () => {
    setIsRunning(true);
    try {
      const checker = new PreflightChecker(product, elements);
      const result = await checker.runChecks();
      setPreflightResult(result);
    } catch (error) {
      console.error('Preflight check failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run checks when elements change
  useEffect(() => {
    if (elements.length > 0) {
      runPreflightChecks();
    }
  }, [elements, product]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Group issues by category
  const groupedIssues = preflightResult?.issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, PreflightIssue[]>) || {};

  // Get category summary
  const getCategorySummary = (category: string) => {
    const issues = groupedIssues[category] || [];
    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;
    const info = issues.filter(i => i.type === 'info').length;
    
    return { errors, warnings, info, total: issues.length };
  };

  // Get status icon
  const getStatusIcon = (type: PreflightIssue['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!preflightResult) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Preflight Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Running preflight checks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Preflight Check
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runPreflightChecks}
              disabled={isRunning}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            {preflightResult.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className={`font-medium ${preflightResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
              {preflightResult.isValid ? 'Ready for Print' : 'Issues Found'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {preflightResult.summary.errors > 0 && (
              <Badge variant="destructive" className="text-xs">
                {preflightResult.summary.errors} Errors
              </Badge>
            )}
            {preflightResult.summary.warnings > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                {preflightResult.summary.warnings} Warnings
              </Badge>
            )}
            {preflightResult.summary.info > 0 && (
              <Badge variant="outline" className="text-xs">
                {preflightResult.summary.info} Info
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Recommendations */}
        {preflightResult.recommendations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {preflightResult.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issues by Category */}
        <div className="space-y-3">
          {Object.entries(groupedIssues).map(([category, issues]) => {
            const summary = getCategorySummary(category);
            const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || FileText;
            const isExpanded = expandedCategories.has(category);

            if (summary.total === 0) return null;

            return (
              <div key={category} className="border rounded-lg">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 text-gray-600" />
                    <span className="font-medium capitalize">
                      {category.replace('-', ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      {summary.errors > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {summary.errors}
                        </Badge>
                      )}
                      {summary.warnings > 0 && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          {summary.warnings}
                        </Badge>
                      )}
                      {summary.info > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {summary.info}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t bg-gray-50">
                    <div className="p-3 space-y-2">
                      {issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${typeColors[issue.type]}`}
                        >
                          <div className="flex items-start gap-3">
                            {getStatusIcon(issue.type)}
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-1">
                                {issue.message}
                              </p>
                              {issue.suggestion && (
                                <p className="text-xs text-gray-600 mb-2">
                                  💡 {issue.suggestion}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${severityColors[issue.severity]}`}
                                >
                                  {issue.severity}
                                </Badge>
                                {issue.elementId && (
                                  <Badge variant="outline" className="text-xs">
                                    Element: {issue.elementId}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* No Issues State */}
        {preflightResult.issues.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium text-green-700 mb-2">
              All Checks Passed!
            </h3>
            <p className="text-gray-600">
              Your design is ready for professional printing.
            </p>
          </div>
        )}

        {/* Export Actions */}
        <Separator />
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {preflightResult.isValid ? (
              <span className="text-green-600">✅ Ready to export</span>
            ) : (
              <span className="text-red-600">⚠️ Fix issues before export</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!preflightResult.isValid}
          >
            <Download className="w-4 h-4 mr-2" />
            Export for Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
