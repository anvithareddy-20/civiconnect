import { supabase } from '@/integrations/supabase/client';

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface ImageAnalysisResult {
  suggestedCategory: string;
  suggestedSubcategory?: string;
  confidence: number;
  description: string;
  detectedObjects: string[];
}

// Emergency keywords for priority detection
const EMERGENCY_KEYWORDS = [
  'accident', 'dead body', 'fire', 'explosion', 'gas leak', 'heavy water leakage',
  'collapsed building', 'electric shock', 'flooding', 'burst pipe', 'sewage overflow',
  'injured', 'emergency', 'urgent', 'life threatening', 'blocked ambulance',
  'traffic jam ambulance', 'broken streetlight night', 'deep pothole accident'
];

const HIGH_PRIORITY_KEYWORDS = [
  'no water supply', 'power outage', 'road blockage', 'bridge damage',
  'signal not working', 'damaged footpath', 'overflowing drain'
];

/**
 * Classifies complaint text using AI to determine category, subcategory, and priority
 */
export const classifyComplaintText = async (
  title: string, 
  description: string
): Promise<ClassificationResult> => {
  try {
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // Check for emergency keywords first
    const hasEmergencyKeyword = EMERGENCY_KEYWORDS.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    
    const hasHighPriorityKeyword = HIGH_PRIORITY_KEYWORDS.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );

    // Call AI classification service
    const { data, error } = await supabase.functions.invoke('classify-complaint', {
      body: {
        text: `${title}. ${description}`,
        checkEmergency: true
      }
    });

    if (error) {
      console.error('AI Classification error:', error);
      return getFallbackClassification(combinedText, hasEmergencyKeyword, hasHighPriorityKeyword);
    }

    // Check if the response contains an error (e.g., API quota exceeded)
    if (data.error) {
      console.error('AI Classification service error:', data.error);
      return getFallbackClassification(combinedText, hasEmergencyKeyword, hasHighPriorityKeyword);
    }

    return {
      category: data.category || 'municipal',
      subcategory: data.subcategory,
      confidence: data.confidence || 0.7,
      priority: hasEmergencyKeyword ? 'high' : (hasHighPriorityKeyword ? 'medium' : data.priority || 'medium'),
      reasoning: data.reasoning || 'AI-based classification'
    };

  } catch (error) {
    console.error('Classification service error:', error);
    return getFallbackClassification(
      `${title} ${description}`.toLowerCase(), 
      false, 
      false
    );
  }
};

/**
 * Analyzes uploaded images to suggest complaint categories
 */
export const analyzeComplaintImage = async (imageFile: File): Promise<ImageAnalysisResult> => {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    const { data, error } = await supabase.functions.invoke('analyze-complaint-image', {
      body: {
        image: base64Image,
        imageType: imageFile.type
      }
    });

    if (error) {
      console.error('Image analysis error:', error);
      return getFallbackImageAnalysis();
    }

    return {
      suggestedCategory: data.category || 'municipal',
      suggestedSubcategory: data.subcategory,
      confidence: data.confidence || 0.6,
      description: data.description || 'Unable to analyze image content',
      detectedObjects: data.detectedObjects || []
    };

  } catch (error) {
    console.error('Image analysis service error:', error);
    return getFallbackImageAnalysis();
  }
};

/**
 * Enhanced chatbot for step-by-step complaint reporting
 */
export const getStepByStepGuidance = async (
  currentStep: 'start' | 'category' | 'description' | 'location' | 'priority',
  userInput?: string,
  context?: any
): Promise<{ message: string; suggestedActions: string[]; nextStep: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('complaint-guidance', {
      body: {
        step: currentStep,
        userInput,
        context
      }
    });

    if (error) {
      console.error('Guidance service error:', error);
      return getFallbackGuidance(currentStep);
    }

    return {
      message: data.message,
      suggestedActions: data.suggestedActions || [],
      nextStep: data.nextStep || 'description'
    };

  } catch (error) {
    console.error('Step-by-step guidance error:', error);
    return getFallbackGuidance(currentStep);
  }
};

// Utility functions
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.onerror = error => reject(error);
  });
};

const getFallbackClassification = (
  text: string, 
  hasEmergency: boolean, 
  hasHighPriority: boolean
): ClassificationResult => {
  // Simple keyword-based classification as fallback
  let category = 'municipal';
  let subcategory = 'other';

  if (text.includes('water') || text.includes('supply') || text.includes('pipe')) {
    subcategory = 'water';
  } else if (text.includes('road') || text.includes('pothole') || text.includes('street')) {
    subcategory = 'potholes';
  } else if (text.includes('light') || text.includes('street light') || text.includes('lamp')) {
    subcategory = 'streetlights';
  } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash')) {
    subcategory = 'trash';
  } else if (text.includes('drain') || text.includes('sewage') || text.includes('drainage')) {
    subcategory = 'drainage';
  } else if (text.includes('bribe') || text.includes('corrupt') || text.includes('money')) {
    category = 'corruption';
  }

  return {
    category,
    subcategory,
    confidence: 0.6,
    priority: hasEmergency ? 'high' : (hasHighPriority ? 'medium' : 'medium'),
    reasoning: 'Keyword-based fallback classification'
  };
};

const getFallbackImageAnalysis = (): ImageAnalysisResult => {
  return {
    suggestedCategory: 'municipal',
    confidence: 0.5,
    description: 'Unable to analyze image. Please select category manually.',
    detectedObjects: []
  };
};

const getFallbackGuidance = (step: string) => {
  const stepMessages = {
    start: {
      message: "Hi! I'll help you report your civic complaint. What type of issue would you like to report?",
      suggestedActions: ["Municipal issue (roads, water, waste)", "Political corruption case"],
      nextStep: "category"
    },
    category: {
      message: "Please describe your issue in detail. The more specific you are, the better I can help categorize it.",
      suggestedActions: ["Describe the problem", "Upload a photo if available"],
      nextStep: "description"
    },
    description: {
      message: "Where is this issue located? Please provide the area, district, or pincode.",
      suggestedActions: ["Enter location details", "Use current location"],
      nextStep: "location"
    },
    location: {
      message: "Based on your description, I'll help determine the priority. Is this an emergency situation?",
      suggestedActions: ["Yes, it's urgent", "No, normal priority"],
      nextStep: "priority"
    }
  };

  return stepMessages[step] || stepMessages.start;
};