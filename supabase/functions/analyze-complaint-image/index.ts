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
    const { image, imageType } = await req.json();

    if (!image) {
      throw new Error('Image data is required for analysis');
    }

    console.log('Analyzing complaint image...');

    const systemPrompt = `You are an AI that analyzes images of civic complaints in Telangana, India.

Look at the image and identify:
1. Category: municipal or corruption
2. Subcategory for municipal: water, potholes, streetlights, trash, drainage, parks, construction, corpse
3. Objects visible in the image
4. Condition/severity of the issue
5. Emergency level based on visual cues

Respond with JSON:
{
  "category": "municipal" or "corruption",
  "subcategory": "specific subcategory or null",
  "confidence": 0.0-1.0,
  "description": "what you see in the image",
  "detectedObjects": ["list", "of", "objects"],
  "severity": "low", "medium", or "high",
  "isEmergency": boolean
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this civic complaint image and categorize it:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${imageType};base64,${image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Vision API error:', errorData);
      throw new Error(`Image analysis API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Image Analysis Response:', aiResponse);

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback analysis
      analysis = {
        category: 'municipal',
        subcategory: null,
        confidence: 0.4,
        description: 'Unable to analyze image content clearly',
        detectedObjects: [],
        severity: 'medium',
        isEmergency: false
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-complaint-image function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Image analysis failed',
      category: 'municipal',
      subcategory: null,
      confidence: 0.3,
      description: 'Image analysis failed, please categorize manually',
      detectedObjects: [],
      severity: 'medium',
      isEmergency: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});