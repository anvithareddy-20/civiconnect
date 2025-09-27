import { useState, useCallback } from 'react';
import { classifyComplaintText, analyzeComplaintImage, getStepByStepGuidance } from '@/services/aiClassification';
import { useToast } from '@/hooks/use-toast';

export interface ComplaintData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  images?: File[];
}

export const useAIComplaintAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    category?: string;
    subcategory?: string;
    priority?: string;
    confidence?: number;
    reasoning?: string;
  }>({});
  const [chatStep, setChatStep] = useState<'start' | 'category' | 'description' | 'location' | 'priority'>('start');
  const [chatContext, setChatContext] = useState<any>({});

  const { toast } = useToast();

  const analyzeComplaintText = useCallback(async (title: string, description: string) => {
    if (!title.trim() && !description.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await classifyComplaintText(title, description);
      setAiSuggestions({
        category: result.category,
        subcategory: result.subcategory,
        priority: result.priority,
        confidence: result.confidence,
        reasoning: result.reasoning
      });

      if (result.priority === 'high') {
        toast({
          title: "High Priority Detected",
          description: "This appears to be an urgent issue that needs immediate attention.",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      console.error('Text analysis error:', error);
      toast({
        title: "Analysis Error",
        description: "Unable to analyze text. Please select category manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [toast]);

  const analyzeUploadedImage = useCallback(async (imageFile: File) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeComplaintImage(imageFile);
      
      const updatedSuggestions = {
        ...aiSuggestions,
        category: result.suggestedCategory,
        subcategory: result.suggestedSubcategory,
        confidence: result.confidence
      };
      
      setAiSuggestions(updatedSuggestions);

      toast({
        title: "Image Analyzed",
        description: `Suggested category: ${result.suggestedCategory}${result.suggestedSubcategory ? ` - ${result.suggestedSubcategory}` : ''}`,
      });

      return result;
    } catch (error) {
      console.error('Image analysis error:', error);
      toast({
        title: "Image Analysis Error",
        description: "Unable to analyze image. Please select category manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [aiSuggestions, toast]);

  const getNextGuidance = useCallback(async (userInput?: string) => {
    try {
      const guidance = await getStepByStepGuidance(chatStep, userInput, chatContext);
      
      // Update context with new information
      if (guidance.nextStep !== chatStep) {
        setChatStep(guidance.nextStep as any);
      }
      
      // Update context based on guidance
      if (userInput) {
        setChatContext(prev => ({
          ...prev,
          [chatStep]: userInput,
          lastGuidance: guidance.message
        }));
      }

      return guidance;
    } catch (error) {
      console.error('Guidance error:', error);
      return {
        message: "I'm having trouble right now. Please continue filling out the form manually.",
        suggestedActions: ["Continue with form"],
        nextStep: chatStep
      };
    }
  }, [chatStep, chatContext]);

  const resetAIAssistant = useCallback(() => {
    setAiSuggestions({});
    setChatStep('start');
    setChatContext({});
    setIsAnalyzing(false);
  }, []);

  const acceptAISuggestion = useCallback((field: string, value: string) => {
    setAiSuggestions(prev => ({
      ...prev,
      [`accepted_${field}`]: value
    }));

    toast({
      title: "AI Suggestion Applied",
      description: `${field} has been set to: ${value}`,
    });
  }, [toast]);

  return {
    // State
    isAnalyzing,
    aiSuggestions,
    chatStep,
    chatContext,

    // Actions
    analyzeComplaintText,
    analyzeUploadedImage,
    getNextGuidance,
    resetAIAssistant,
    acceptAISuggestion,
    
    // Setters for external control
    setChatStep,
    setChatContext
  };
};