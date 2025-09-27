import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Bot, CheckCircle, AlertTriangle, Zap, X } from 'lucide-react';

interface AISuggestionCardProps {
  suggestions: {
    category?: string;
    subcategory?: string;
    priority?: string;
    confidence?: number;
    reasoning?: string;
  };
  isAnalyzing: boolean;
  onAcceptSuggestion: (field: string, value: string) => void;
  onDismiss: () => void;
  currentValues: {
    category: string;
    subcategory: string;
    priority: string;
  };
}

export default function AISuggestionCard({ 
  suggestions, 
  isAnalyzing, 
  onAcceptSuggestion, 
  onDismiss, 
  currentValues 
}: AISuggestionCardProps) {
  if (!suggestions.category && !isAnalyzing) return null;

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'bg-muted';
    if (confidence >= 0.8) return 'bg-success';
    if (confidence >= 0.6) return 'bg-warning';
    return 'bg-destructive';
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'medium':
        return <Zap className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-subtle backdrop-blur-sm shadow-glow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg flex items-center gap-2">
              AI Analysis
              {isAnalyzing && (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {suggestions.confidence && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Confidence: {Math.round(suggestions.confidence * 100)}%</span>
            <Badge variant="secondary" className={getConfidenceColor(suggestions.confidence)}>
              {suggestions.confidence >= 0.8 ? 'High' : 
               suggestions.confidence >= 0.6 ? 'Medium' : 'Low'}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isAnalyzing ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Bot className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground">Analyzing your complaint...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Category Suggestion */}
            {suggestions.category && suggestions.category !== currentValues.category && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex-1">
                  <p className="text-sm font-medium">Suggested Category</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{suggestions.category}</Badge>
                    {suggestions.subcategory && (
                      <Badge variant="secondary">{suggestions.subcategory}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onAcceptSuggestion('category', suggestions.category!);
                    if (suggestions.subcategory) {
                      onAcceptSuggestion('subcategory', suggestions.subcategory);
                    }
                  }}
                  className="ml-2"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            )}

            {/* Priority Suggestion */}
            {suggestions.priority && suggestions.priority !== currentValues.priority && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                <div className="flex-1">
                  <p className="text-sm font-medium">Suggested Priority</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getPriorityIcon(suggestions.priority)}
                    <Badge variant="outline" className="capitalize">
                      {suggestions.priority}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onAcceptSuggestion('priority', suggestions.priority!)}
                  className="ml-2"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            )}

            {/* Reasoning */}
            {suggestions.reasoning && (
              <div className="p-3 rounded-lg bg-muted/50 border-l-4 border-primary">
                <p className="text-sm text-muted-foreground">
                  <Bot className="h-4 w-4 inline mr-2" />
                  {suggestions.reasoning}
                </p>
              </div>
            )}

            {/* Emergency Alert */}
            {suggestions.priority === 'high' && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm font-medium text-destructive">Emergency Detected</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This issue requires immediate attention and will be prioritized.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}