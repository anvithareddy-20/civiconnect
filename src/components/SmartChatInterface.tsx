import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Clock, TrendingUp, Users, MessageSquare } from 'lucide-react';

interface SmartSuggestionProps {
  userStats: {
    totalIssues: number;
    pendingIssues: number;
    resolvedIssues: number;
    mostCommonCategory?: string;
  };
  onSuggestionClick: (suggestion: string) => void;
}

export const SmartChatInterface: React.FC<SmartSuggestionProps> = ({ 
  userStats, 
  onSuggestionClick 
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Generate smart suggestions based on user's complaint history
    const generateSuggestions = () => {
      const smartSuggestions = [];

      if (userStats.totalIssues === 0) {
        smartSuggestions.push(
          "How do I submit my first complaint?",
          "What information do I need to report an issue?", 
          "Can I upload photos with my complaint?"
        );
      } else {
        if (userStats.pendingIssues > 0) {
          smartSuggestions.push(
            `Track my ${userStats.pendingIssues} pending complaint${userStats.pendingIssues > 1 ? 's' : ''}`,
            "How long does resolution typically take?"
          );
        }
        
        if (userStats.resolvedIssues > 0) {
          smartSuggestions.push(
            `Show my ${userStats.resolvedIssues} resolved complaint${userStats.resolvedIssues > 1 ? 's' : ''}`
          );
        }
        
        if (userStats.mostCommonCategory) {
          smartSuggestions.push(
            `Report another ${userStats.mostCommonCategory.toLowerCase()} issue`
          );
        }
        
        smartSuggestions.push(
          "Where can I find the status tracker?",
          "How do I get notifications about updates?"
        );
      }

      // Add general helpful suggestions
      smartSuggestions.push(
        "Can I report complaints anonymously?",
        "What features does this platform have?",
        "How does voice-to-text work?"
      );

      setSuggestions(smartSuggestions.slice(0, 4)); // Show top 4 suggestions
    };

    generateSuggestions();
  }, [userStats]);

  return (
    <Card className="mt-4 bg-gradient-subtle border border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Smart Suggestions</span>
          <Badge variant="secondary" className="text-xs">AI Powered</Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion)}
              className="justify-start text-left h-auto p-3 hover-scale transition-all border-border/50 hover:border-primary/60"
            >
              <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
              <span className="text-xs">{suggestion}</span>
            </Button>
          ))}
        </div>

        {/* Quick Stats Display */}
        {userStats.totalIssues > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>{userStats.totalIssues} total</span>
              </div>
              {userStats.pendingIssues > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{userStats.pendingIssues} pending</span>
                </div>
              )}
              {userStats.resolvedIssues > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{userStats.resolvedIssues} resolved</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartChatInterface;