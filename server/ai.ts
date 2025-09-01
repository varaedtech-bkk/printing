import OpenAI from "openai";

// Choose model based on needs: gpt-4o (best quality), gpt-4o-mini (cheaper), gpt-3.5-turbo (fastest)
const MODEL_TO_USE = process.env.AI_MODEL || "gpt-4o-mini"; // Default to cheaper option

// Check if we have a valid API key
const hasValidApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  const isValid = apiKey && apiKey !== "default_key" && apiKey.length > 10;
  console.log(`🔑 API Key Check: key="${apiKey ? '***' + apiKey.slice(-4) : 'undefined'}", isValid=${isValid}`);
  return isValid;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

// Cost optimization settings
const AI_CONFIG = {
  maxTokens: 1000, // Limit response length to save costs
  temperature: 0.7, // Balance creativity and consistency
  enableCaching: process.env.ENABLE_AI_CACHE === 'true', // Enable caching for repeated requests
};

// Simple in-memory cache for AI responses (in production, use Redis)
const aiResponseCache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Cache utility functions
function getCacheKey(prompt: string, type: string, additionalData?: any): string {
  return `${type}:${prompt}:${JSON.stringify(additionalData || {})}`.slice(0, 200);
}

function getCachedResponse(cacheKey: string): any | null {
  if (!AI_CONFIG.enableCaching) return null;

  const cached = aiResponseCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    aiResponseCache.delete(cacheKey);
    return null;
  }

  return cached.response;
}

function setCachedResponse(cacheKey: string, response: any): void {
  if (!AI_CONFIG.enableCaching) return;
  aiResponseCache.set(cacheKey, { response, timestamp: Date.now() });
}

export interface AIDesignSuggestion {
  layout: string;
  colors: string[];
  fonts: string[];
  elements: {
    type: 'text' | 'image' | 'shape';
    content: string;
    position: { x: number; y: number };
    style: Record<string, any>;
  }[];
  reasoning: string;
}

export interface AIColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string[];
  reasoning: string;
}

// Generate design suggestions from text prompt
export async function generateDesignFromText(
  prompt: string,
  productType: string,
  dimensions: { width: number; height: number }
): Promise<AIDesignSuggestion> {
  try {
    console.log(`🎨 Starting design generation for: ${prompt.substring(0, 50)}...`);

    // Check if we have a valid API key
    if (!hasValidApiKey()) {
      console.log('⚠️  No valid OpenAI API key found, using fallback design generation');
      return generateFallbackDesign(prompt, productType, dimensions);
    }

    console.log('✅ Valid API key found, proceeding with OpenAI call');

    // Check cache first
    const cacheKey = getCacheKey(prompt, 'design-from-text', { productType, dimensions });
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log('✅ Using cached AI response for design generation');
      return cachedResult;
    }

    // Make the OpenAI API call with additional error handling
    let response;
    try {
      response = await openai.chat.completions.create({
        model: MODEL_TO_USE,
        messages: [
          {
            role: "system",
            content: `You are a professional graphic designer AI specializing in Thai market print products.
            Generate creative, culturally appropriate designs that work well for printing.
            Consider Thai color preferences, font readability, and modern design trends.
            Respond with JSON in this exact format: {
              "layout": "description of layout approach",
              "colors": ["#hex1", "#hex2", "#hex3"],
              "fonts": ["font1", "font2"],
              "elements": [{"type": "text|image|shape", "content": "content", "position": {"x": 0, "y": 0}, "style": {}}],
              "reasoning": "explanation of design choices"
            }`,
          },
          {
            role: "user",
            content: `Create a professional ${productType} design (${dimensions.width}x${dimensions.height}px).
            Design request: ${prompt}
            Make it suitable for Thai market - consider cultural elements, color harmony, and print quality.
            Focus on clean typography and balanced composition.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      });
    } catch (apiError) {
      const errorMsg = (apiError as Error).message;
      console.log(`🚨 OpenAI API call failed: ${errorMsg}`);

      if (errorMsg.includes('401') || errorMsg.includes('Incorrect API key')) {
        console.log('🔑 Invalid API key detected, using fallback design');
        return generateFallbackDesign(prompt, productType, dimensions);
      } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.log('📊 Rate limit exceeded, using fallback design');
        return generateFallbackDesign(prompt, productType, dimensions);
      } else {
        console.log('❓ Unknown API error, using fallback design');
        return generateFallbackDesign(prompt, productType, dimensions);
      }
    }

    const content = response.choices[0].message.content;
    if (!content) {
      console.log('⚠️  Empty response from OpenAI, using fallback');
      return generateFallbackDesign(prompt, productType, dimensions);
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.log('⚠️  Failed to parse OpenAI response, using fallback');
      return generateFallbackDesign(prompt, productType, dimensions);
    }

    // Validate the response structure
    if (!result.layout || !result.colors || !result.fonts || !result.elements) {
      console.log('⚠️  Invalid AI response structure, using fallback');
      return generateFallbackDesign(prompt, productType, dimensions);
    }

    // Cache the result
    setCachedResponse(cacheKey, result);

    console.log(`🎨 AI design generated successfully using ${MODEL_TO_USE}`);
    return result as AIDesignSuggestion;

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.log(`❌ Unexpected error in design generation: ${errorMessage}`);

    // Always provide fallback design for any unexpected errors
    return generateFallbackDesign(prompt, productType, dimensions);
  }
}

// Fallback design generation when API is not available
function generateFallbackDesign(
  prompt: string,
  productType: string,
  dimensions: { width: number; height: number }
): AIDesignSuggestion {
  // Analyze the prompt to determine design style
  const promptLower = prompt.toLowerCase();
  const isBusiness = promptLower.includes('business') || promptLower.includes('corporate') || promptLower.includes('professional');
  const isCreative = promptLower.includes('creative') || promptLower.includes('art') || promptLower.includes('design');
  const isFood = promptLower.includes('food') || promptLower.includes('restaurant') || promptLower.includes('cafe');
  const isThai = promptLower.includes('thai') || promptLower.includes('ไทย') || promptLower.includes('asia');

  // Base design templates
  const templates = {
    business: {
      layout: "Clean corporate layout with balanced spacing and professional typography",
      colors: ["#1E40AF", "#3B82F6", "#F8FAFC", "#64748B"],
      fonts: ["Inter", "Poppins", "Noto Sans Thai"],
      elements: [
        {
          type: "text" as const,
          content: "ชื่อธุรกิจของคุณ",
          position: { x: dimensions.width * 0.5, y: dimensions.height * 0.3 },
          style: {
            fontSize: "24px",
            fontWeight: "bold",
            color: "#1E40AF",
            textAlign: "center"
          }
        },
        {
          type: "text" as const,
          content: "บริการระดับมืออาชีพ",
          position: { x: dimensions.width * 0.5, y: dimensions.height * 0.5 },
          style: {
            fontSize: "16px",
            color: "#64748B",
            textAlign: "center"
          }
        }
      ],
      reasoning: "Professional design suitable for Thai business market with clean typography and corporate colors"
    },
    creative: {
      layout: "Modern creative layout with dynamic composition and artistic elements",
      colors: ["#7C3AED", "#A855F7", "#F97316", "#FAF5FF"],
      fonts: ["Poppins", "Noto Sans Thai", "Dancing Script"],
      elements: [
        {
          type: "text" as const,
          content: "งานสร้างสรรค์",
          position: { x: dimensions.width * 0.4, y: dimensions.height * 0.25 },
          style: {
            fontSize: "28px",
            fontWeight: "bold",
            color: "#7C3AED",
            textAlign: "center"
          }
        },
        {
          type: "text" as const,
          content: "ออกแบบพิเศษ",
          position: { x: dimensions.width * 0.6, y: dimensions.height * 0.6 },
          style: {
            fontSize: "18px",
            color: "#F97316",
            textAlign: "center"
          }
        }
      ],
      reasoning: "Creative design with vibrant colors and artistic typography suitable for modern Thai brands"
    },
    food: {
      layout: "Appetizing food layout with warm colors and inviting composition",
      colors: ["#DC2626", "#EF4444", "#F59E0B", "#FEF2F2"],
      fonts: ["Poppins", "Noto Sans Thai", "Comfortaa"],
      elements: [
        {
          type: "text" as const,
          content: "ร้านอาหารไทย",
          position: { x: dimensions.width * 0.5, y: dimensions.height * 0.35 },
          style: {
            fontSize: "26px",
            fontWeight: "bold",
            color: "#DC2626",
            textAlign: "center"
          }
        },
        {
          type: "text" as const,
          content: "อาหารอร่อย สดใหม่",
          position: { x: dimensions.width * 0.5, y: dimensions.height * 0.6 },
          style: {
            fontSize: "16px",
            color: "#F59E0B",
            textAlign: "center"
          }
        }
      ],
      reasoning: "Warm and appetizing design perfect for Thai food businesses with inviting colors"
    }
  };

  // Determine which template to use
  let selectedTemplate = templates.business; // default

  if (isFood) {
    selectedTemplate = templates.food;
  } else if (isCreative) {
    selectedTemplate = templates.creative;
  } else if (isBusiness) {
    selectedTemplate = templates.business;
  }

  // Add Thai-specific elements if needed
  if (isThai || promptLower.includes('thai')) {
    selectedTemplate.elements.push({
      type: "text" as const,
      content: "🇹🇭",
      position: { x: dimensions.width * 0.1, y: dimensions.height * 0.1 },
      style: {
        fontSize: "20px",
        color: selectedTemplate.colors[0],
        textAlign: "center"
      }
    });
  }

  console.log(`🎨 Generated fallback design for ${productType} using ${selectedTemplate === templates.business ? 'business' : selectedTemplate === templates.creative ? 'creative' : 'food'} template`);
  return selectedTemplate;
}

// Generate smart color palette suggestions
export async function generateColorPalette(
  brandDescription: string,
  industry: string
): Promise<AIColorPalette> {
  try {
    // Check if we have a valid API key
    if (!hasValidApiKey()) {
      console.log('⚠️  No valid OpenAI API key found, using fallback color palette');
      return generateFallbackColorPalette(brandDescription, industry);
    }

    // Check cache first
    const cacheKey = getCacheKey(brandDescription, 'color-palette', { industry });
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log('✅ Using cached AI response for color palette');
      return cachedResult;
    }

    // Make the OpenAI API call with additional error handling
    let response;
    try {
      response = await openai.chat.completions.create({
        model: MODEL_TO_USE,
        messages: [
          {
            role: "system",
            content: `You are a professional color consultant specializing in Thai market branding.
            Generate harmonious, culturally appropriate color palettes that work well for printing.
            Consider Thai color psychology, brand identity, and visual impact.
            Respond with JSON in this exact format: {
              "primary": "#hexcode",
              "secondary": "#hexcode",
              "accent": "#hexcode",
              "neutral": ["#hex1", "#hex2", "#hex3"],
              "reasoning": "explanation of color choices and cultural considerations"
            }`,
          },
          {
            role: "user",
            content: `Create a professional color palette for a ${industry} business.
            Brand description: ${brandDescription}
            Ensure colors are suitable for Thai market, provide good contrast for print materials,
            and align with brand personality. Consider cultural color meanings in Thailand.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
      });
    } catch (apiError) {
      const errorMsg = (apiError as Error).message;
      console.log(`🚨 OpenAI API call failed: ${errorMsg}`);

      if (errorMsg.includes('401') || errorMsg.includes('Incorrect API key')) {
        console.log('🔑 Invalid API key detected, using fallback color palette');
        return generateFallbackColorPalette(brandDescription, industry);
      } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.log('📊 Rate limit exceeded, using fallback color palette');
        return generateFallbackColorPalette(brandDescription, industry);
      } else {
        console.log('❓ Unknown API error, using fallback color palette');
        return generateFallbackColorPalette(brandDescription, industry);
      }
    }

    const content = response.choices[0].message.content;
    if (!content) {
      console.log('⚠️  Empty response from OpenAI, using fallback color palette');
      return generateFallbackColorPalette(brandDescription, industry);
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.log('⚠️  Failed to parse OpenAI response, using fallback color palette');
      return generateFallbackColorPalette(brandDescription, industry);
    }

    // Validate the response structure
    if (!result.primary || !result.secondary || !result.accent || !result.neutral || !result.reasoning) {
      console.log('⚠️  Invalid AI response structure, using fallback color palette');
      return generateFallbackColorPalette(brandDescription, industry);
    }

    // Cache the result
    setCachedResponse(cacheKey, result);

    console.log(`🎨 AI color palette generated successfully using ${MODEL_TO_USE}`);
    return result as AIColorPalette;

  } catch (error) {
    const errorMessage = (error as Error).message;
    console.log(`❌ Unexpected error in color palette generation: ${errorMessage}`);

    // Always provide fallback palette for any unexpected errors
    return generateFallbackColorPalette(brandDescription, industry);
  }
}

// Fallback color palette generation when API is not available
function generateFallbackColorPalette(
  brandDescription: string,
  industry: string
): AIColorPalette {
  // Analyze the brand description and industry to determine palette style
  const descLower = brandDescription.toLowerCase();
  const industryLower = industry.toLowerCase();

  const isBusiness = industryLower.includes('business') || industryLower.includes('corporate') || descLower.includes('professional');
  const isCreative = industryLower.includes('creative') || industryLower.includes('design') || industryLower.includes('art') || descLower.includes('creative');
  const isFood = industryLower.includes('food') || industryLower.includes('restaurant') || industryLower.includes('cafe') || descLower.includes('food');
  const isTech = industryLower.includes('tech') || industryLower.includes('software') || industryLower.includes('digital');
  const isThai = descLower.includes('thai') || descLower.includes('asia') || descLower.includes('traditional');

  // Professional fallback palettes
  const palettes = {
    business: {
      primary: "#1E40AF",
      secondary: "#3B82F6",
      accent: "#F59E0B",
      neutral: ["#F8FAFC", "#E2E8F0", "#64748B"],
      reasoning: "Professional blue palette with warm accent, suitable for Thai business market. Blue represents trust and stability, common in corporate branding."
    },
    creative: {
      primary: "#7C3AED",
      secondary: "#A855F7",
      accent: "#F97316",
      neutral: ["#FAF5FF", "#E2E8F0", "#64748B"],
      reasoning: "Creative purple and orange combination for modern Thai brands. Purple conveys creativity and luxury, orange adds energy and warmth."
    },
    food: {
      primary: "#DC2626",
      secondary: "#EF4444",
      accent: "#F59E0B",
      neutral: ["#FEF2F2", "#E2E8F0", "#64748B"],
      reasoning: "Appetizing red and orange palette perfect for Thai food businesses. Red stimulates appetite and represents good fortune in Thai culture."
    },
    tech: {
      primary: "#059669",
      secondary: "#10B981",
      accent: "#3B82F6",
      neutral: ["#ECFDF5", "#E2E8F0", "#64748B"],
      reasoning: "Modern green palette for tech companies. Green represents growth and innovation, with blue for trust and technology."
    },
    thai: {
      primary: "#DC2626",
      secondary: "#F59E0B",
      accent: "#7C3AED",
      neutral: ["#FEF2F2", "#FEF3C7", "#64748B"],
      reasoning: "Traditional Thai-inspired palette with red (good fortune), gold (prosperity), and purple (royalty). Reflects Thai cultural values and aesthetics."
    }
  };

  // Determine which palette to use
  let selectedPalette = palettes.business; // default

  if (isThai) {
    selectedPalette = palettes.thai;
  } else if (isFood) {
    selectedPalette = palettes.food;
  } else if (isTech) {
    selectedPalette = palettes.tech;
  } else if (isCreative) {
    selectedPalette = palettes.creative;
  } else if (isBusiness) {
    selectedPalette = palettes.business;
  }

  console.log(`🎨 Generated fallback color palette for ${industry} using ${selectedPalette === palettes.business ? 'business' : selectedPalette === palettes.creative ? 'creative' : selectedPalette === palettes.food ? 'food' : selectedPalette === palettes.tech ? 'tech' : 'thai'} template`);
  return selectedPalette;
}

// Analyze uploaded image and suggest design improvements
export async function analyzeDesignImage(base64Image: string): Promise<{
  suggestions: string[];
  issues: string[];
  printReadiness: {
    resolution: 'low' | 'medium' | 'high';
    colorMode: 'rgb' | 'cmyk' | 'unknown';
    recommendations: string[];
  };
}> {
  try {
    // Create a hash of the image for caching (first 100 chars should be unique enough)
    const imageHash = base64Image.slice(0, 100);
    const cacheKey = getCacheKey(imageHash, 'image-analysis');
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log('✅ Using cached AI response for image analysis');
      return cachedResult;
    }

    const response = await openai.chat.completions.create({
      model: MODEL_TO_USE,
      messages: [
        {
          role: "system",
          content: `You are a print production expert. Analyze designs for print quality and provide suggestions.
          Focus on resolution, color accuracy, text readability, and print specifications.
          Keep responses concise but effective. Respond with JSON: {
            "suggestions": ["suggestion1", "suggestion2"],
            "issues": ["issue1", "issue2"],
            "printReadiness": {
              "resolution": "low|medium|high",
              "colorMode": "rgb|cmyk|unknown",
              "recommendations": ["rec1", "rec2"]
            }
          }`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this design for print quality and provide suggestions for improvement. Focus on Thai printing standards and best practices."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Cache the result
    setCachedResponse(cacheKey, result);

    return result;
  } catch (error) {
    throw new Error("Failed to analyze design image: " + (error as Error).message);
  }
}

// Background removal (using a simulated API call - in production, use a dedicated service)
export async function removeBackground(base64Image: string): Promise<{ processedImage: string }> {
  try {
    // Create a hash of the image for caching
    const imageHash = base64Image.slice(0, 100);
    const cacheKey = getCacheKey(imageHash, 'background-removal');
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log('✅ Using cached AI response for background removal');
      return cachedResult;
    }

    // In production, integrate with services like Remove.bg, PhotoRoom, or similar
    // For now, we'll simulate the API call structure
    const response = await openai.chat.completions.create({
      model: MODEL_TO_USE,
      messages: [
        {
          role: "system",
          content: `You are helping with background removal integration.
          In production, this would call a background removal API.
          Keep responses concise. Respond with JSON: {"processedImage": "base64_string_placeholder", "success": true}`,
        },
        {
          role: "user",
          content: "Process background removal for uploaded image",
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Cache the result
    setCachedResponse(cacheKey, result);

    // In production, replace this with actual background removal service
    return {
      processedImage: base64Image // Placeholder - would be processed image
    };
  } catch (error) {
    throw new Error("Failed to remove background: " + (error as Error).message);
  }
}

// Generate design variations
export async function generateDesignVariations(
  currentDesign: any,
  variationType: 'color' | 'layout' | 'typography'
): Promise<{ variations: any[]; descriptions: string[] }> {
  try {
    // Create a cache key based on design content and variation type
    const designHash = JSON.stringify(currentDesign).slice(0, 200);
    const cacheKey = getCacheKey(designHash, 'design-variations', { variationType });
    const cachedResult = getCachedResponse(cacheKey);
    if (cachedResult) {
      console.log('✅ Using cached AI response for design variations');
      return cachedResult;
    }

    const response = await openai.chat.completions.create({
      model: MODEL_TO_USE,
      messages: [
        {
          role: "system",
          content: `You are a design variation generator. Create alternative versions of designs.
          Focus on ${variationType} variations while maintaining design coherence and print quality.
          Keep responses concise but effective. Respond with JSON: {
            "variations": [{"modification": "description", "values": {}}],
            "descriptions": ["variation 1 description", "variation 2 description"]
          }`,
        },
        {
          role: "user",
          content: `Generate ${variationType} variations for this design: ${JSON.stringify(currentDesign).slice(0, 800)}
          Create 3 different variations suitable for Thai printing market.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Cache the result
    setCachedResponse(cacheKey, result);

    return result;
  } catch (error) {
    throw new Error("Failed to generate design variations: " + (error as Error).message);
  }
}

// Cost monitoring and analytics
export interface AICostMetrics {
  model: string;
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
  cachedResponses: number;
  lastUpdated: Date;
}

// Simple in-memory cost tracking (in production, use a database)
let costMetrics: AICostMetrics = {
  model: MODEL_TO_USE,
  totalRequests: 0,
  totalTokens: 0,
  estimatedCost: 0,
  cachedResponses: 0,
  lastUpdated: new Date(),
};

// Cost estimation per model (per 1M tokens)
const COST_PER_MILLION_TOKENS = {
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};

export function getCostMetrics(): AICostMetrics {
  return { ...costMetrics };
}

export function resetCostMetrics(): void {
  costMetrics = {
    model: MODEL_TO_USE,
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0,
    cachedResponses: 0,
    lastUpdated: new Date(),
  };
}

export function logAICall(tokensUsed: number, wasCached: boolean = false): void {
  if (wasCached) {
    costMetrics.cachedResponses++;
    return;
  }

  costMetrics.totalRequests++;
  costMetrics.totalTokens += tokensUsed;

  // Estimate cost based on model and token usage
  const modelCosts = COST_PER_MILLION_TOKENS[MODEL_TO_USE as keyof typeof COST_PER_MILLION_TOKENS] || COST_PER_MILLION_TOKENS['gpt-4o-mini'];
  const estimatedCostPerToken = (modelCosts.input + modelCosts.output) / 2 / 1000000; // Average cost per token
  costMetrics.estimatedCost += tokensUsed * estimatedCostPerToken;

  costMetrics.lastUpdated = new Date();
}

console.log(`🤖 AI Designer initialized with model: ${MODEL_TO_USE}`);
console.log(`💰 Cost optimization: Enabled (max ${AI_CONFIG.maxTokens} tokens, ${AI_CONFIG.temperature} temperature)`);
console.log(`📊 Caching: ${AI_CONFIG.enableCaching ? 'Enabled' : 'Disabled'}`);
