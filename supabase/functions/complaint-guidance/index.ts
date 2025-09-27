import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { step, userInput, context } = await req.json();

    console.log('Providing guidance for step:', step, 'with input:', userInput);

    const systemPrompt = `You are a helpful AI assistant for the Civic Crowdsourced Reporting System in Telangana. 

Your role is to guide users through reporting civic complaints step by step. Be conversational, helpful, and specific to Telangana's civic issues.

Steps flow:
1. start -> category selection
2. category -> detailed description  
3. description -> location gathering
4. location -> priority assessment
5. priority -> submission

Categories:
- Municipal issues: water supply, roads/potholes, streetlights, waste management, drainage, parks, construction issues, corpse removal
- Political corruption: bribery, misuse of power, illegal activities

Always respond in JSON format:
{
  "message": "conversational response to user",
  "suggestedActions": ["action1", "action2", "action3"],
  "nextStep": "next step name",
  "categoryGuess": "if applicable",
  "priorityGuess": "if emergency detected"
}

Be encouraging and make the process feel simple. Use local context for Telangana when relevant.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Current step: ${step}. User input: "${userInput || 'None'}". Context: ${JSON.stringify(context || {})}. Provide guidance.`
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`Guidance API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Guidance Response:', aiResponse);

    // Parse JSON response
    let guidance;
    try {
      guidance = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback guidance based on step
      guidance = getFallbackGuidance(step);
    }

    return new Response(JSON.stringify(guidance), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in complaint-guidance function:', error);
    const fallback = getFallbackGuidance('start');
    return new Response(JSON.stringify({ 
      ...fallback,
      error: error.message || 'Guidance service temporarily unavailable'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getFallbackGuidance(step: string) {
  const stepGuidance = {
    start: {
      message: "Hello! I'm here to help you report your civic complaint. What type of issue would you like to report today?",
      suggestedActions: ["Municipal issue (roads, water, waste)", "Political corruption case", "Not sure - describe the problem"],
      nextStep: "category"
    },
    category: {
      message: "Great! Now please describe your issue in detail. What exactly is the problem and how is it affecting you or your community?",
      suggestedActions: ["Describe the issue", "Upload a photo", "Record voice description"],
      nextStep: "description"
    },
    description: {
      message: "Thank you for the details. Where exactly is this issue located? Please provide the area, street name, district, or pincode.",
      suggestedActions: ["Enter specific address", "Use current location", "Provide nearby landmarks"],
      nextStep: "location"
    },
    location: {
      message: "Perfect! Based on your description, I'll help assess the priority level. Is this an urgent situation that needs immediate attention?",
      suggestedActions: ["Yes, it's an emergency", "Moderately urgent", "Normal priority"],
      nextStep: "priority"
    },
    priority: {
      message: "Excellent! Your complaint is ready to be submitted. I'll make sure it reaches the right authorities for quick action.",
      suggestedActions: ["Submit complaint", "Review details", "Add more information"],
      nextStep: "submission"
    }
  };

  return stepGuidance[step] || stepGuidance.start;
}