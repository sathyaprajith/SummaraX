// Gemini API Integration
// Multiple API keys for load balancing and fallback
const GEMINI_API_KEYS = [
  process.env.REACT_APP_GEMINI_API_KEY,
  process.env.REACT_APP_GEMINI_API_KEY_2,
  process.env.REACT_APP_GEMINI_API_KEY_3,
  process.env.REACT_APP_GEMINI_API_KEY_4,
].filter(key => key && key !== "your_gemini_api_key_here"); // Remove empty/placeholder keys

let currentKeyIndex = 0; // Track which key we're using
const GEMINI_MODEL = "gemini-2.5-flash"; // Gemini 2.5 Flash
const API_VERSION = "v1beta"; // API version

/**
 * Build prompts for different task types
 */
function buildPrompt(type, input) {
  const maxInput = input.length > 15000 ? input.slice(0, 15000) + "..." : input;
  
  switch (type) {
    case "summary":
      return `You are an expert study assistant. Generate three levels of summary from the following educational content.

Return ONLY valid JSON in this exact format:
{
  "short": "A concise 50-word summary with key points",
  "medium": "A comprehensive 120-word summary with main concepts and supporting details",
  "detailed": "An in-depth 250-word summary covering all important aspects, examples, and conclusions"
}

Educational Content:
${maxInput}`;

    case "mcq":
      return `You are an expert exam question creator. Generate 5 high-quality multiple-choice questions from the following content.

Return ONLY valid JSON in this exact format:
{
  "mcqs": [
    {
      "question": "Clear, specific question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "A",
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Educational Content:
${maxInput}`;

    case "qa":
      return `You are an expert educator. Generate practice questions with detailed answers from the following content.

Return ONLY valid JSON in this exact format:
{
  "short": [
    {"q": "Short answer question (1-2 sentences to answer)", "a": "Concise answer"}
  ],
  "long": [
    {"q": "Long answer question (paragraph-level answer)", "a": "Detailed comprehensive answer"}
  ]
}

Generate 5 short-answer and 3 long-answer questions.

Educational Content:
${maxInput}`;

    case "notes":
      return `You are an expert note-taker. Extract and organize revision notes from the following educational content.

Return ONLY valid JSON in this exact format (fill all arrays with at least 3 items each):
{
  "key_points": ["Important point 1", "Important point 2", "Important point 3"],
  "formulas": ["Formula or equation 1", "Formula or equation 2", "Formula or equation 3"],
  "terms": [
    {"term": "Important term 1", "definition": "Clear explanation"},
    {"term": "Important term 2", "definition": "Clear explanation"},
    {"term": "Important term 3", "definition": "Clear explanation"}
  ],
  "concepts": ["Core concept 1 explained", "Core concept 2 explained", "Core concept 3 explained"]
}

If the content has no formulas, include general principles or rules instead. Always provide meaningful content for each section.

Educational Content:
${maxInput}`;

    case "practice":
      return `You are an expert test creator. Generate practice questions categorized by difficulty from the following content.

Return ONLY valid JSON in this exact format:
{
  "easy": [
    {"q": "Basic recall or simple application question", "a": "Straightforward answer"}
  ],
  "medium": [
    {"q": "Questions requiring understanding and application", "a": "Detailed answer with reasoning"}
  ],
  "hard": [
    {"q": "Complex analysis or synthesis question", "a": "Comprehensive answer with multiple aspects"}
  ]
}

Generate 3 questions for each difficulty level.

Educational Content:
${maxInput}`;

    case "mindmap":
      return `You are an expert knowledge mapper. Create a comprehensive mind map from the following educational content.

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "node1",
      "label": "Central Topic",
      "level": 0,
      "citations": [{"file": "source_file.pdf", "start": 0, "end": 100}]
    },
    {
      "id": "node2", 
      "label": "Main Concept",
      "level": 1,
      "citations": [{"file": "source_file.pdf", "start": 150, "end": 250}]
    }
  ],
  "edges": [
    {
      "source": "node1",
      "target": "node2",
      "label": "relates to"
    }
  ]
}

RULES:
1. Create 10-20 nodes maximum for clarity
2. Level 0: 1 root node (main topic)
3. Level 1: 3-5 major concepts  
4. Level 2: 4-8 sub-concepts
5. Level 3: 2-6 specific details or examples
6. Keep labels concise (2-6 words max)
7. Use meaningful relationship labels: "leads to", "part of", "example of", "causes", "requires", etc.
8. Create 15-30 edges showing clear relationships
9. Extract file citations from "--- filename ---" markers in content
10. Ensure hierarchical structure flows from general to specific

Educational Content:
${maxInput}`;

    default:
      return `Analyze the following educational content and provide insights:\n\n${maxInput}`;
  }
}

/**
 * Extract JSON from Gemini response
 */
function extractJSON(text) {
  try {
    // Remove markdown code fences if present
    let cleanText = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
    
    // Try to find the first { and last }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonString = cleanText.substring(firstBrace, lastBrace + 1);
      
      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.warn("JSON parse error:", parseError.message);
        console.warn("Attempted to parse:", jsonString.substring(0, 500) + "...");
        
        // If parsing fails, try to fix common issues
        let fixedJson = jsonString
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":'); // Add quotes to unquoted keys
        
        try {
          return JSON.parse(fixedJson);
        } catch (fixError) {
          // Last resort: return raw with error
          return { raw: text, error: `Could not parse JSON: ${parseError.message}` };
        }
      }
    }
    
    // If no JSON structure found, return raw text
    return { raw: text, error: "No valid JSON structure found in response" };
  } catch (error) {
    return { raw: text, error: `JSON extraction failed: ${error.message}` };
  }
}

/**
 * Get the next API key with round-robin rotation
 */
function getNextApiKey() {
  if (GEMINI_API_KEYS.length === 0) {
    return null;
  }
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

/**
 * Make API call with automatic retry using backup keys
 */
async function callGeminiAPI(requestBody, attemptsLeft = GEMINI_API_KEYS.length) {
  if (attemptsLeft <= 0) {
    throw new Error("All API keys failed. Please check your keys or try again later.");
  }

  const currentKey = getNextApiKey();
  if (!currentKey) {
    throw new Error("No API keys configured. Please add REACT_APP_GEMINI_API_KEY to your .env file");
  }

  try {
    console.log(`Attempting API call with key #${(currentKeyIndex === 0 ? GEMINI_API_KEYS.length : currentKeyIndex)}...`);
    console.log(`Using model: ${GEMINI_MODEL} on ${API_VERSION} API`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/${API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${currentKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
      
      console.error(`API Error (${response.status}):`, errorMessage);
      
      // Check if it's a model not found error - should not retry
      if (errorMessage.includes("not found") || errorMessage.includes("not supported")) {
        throw new Error(`Model error: ${errorMessage}. Please check the model name in gemini.js`);
      }
      
      // Check if it's a rate limit or quota error - try next key
      if (response.status === 429 || response.status === 403 || errorMessage.includes("quota") || errorMessage.includes("limit")) {
        console.warn(`Key failed (rate limit/quota): ${errorMessage}. Trying next key...`);
        return await callGeminiAPI(requestBody, attemptsLeft - 1);
      }
      
      // For other errors, retry with next key
      console.warn(`Key failed: ${errorMessage}. Trying next key...`);
      return await callGeminiAPI(requestBody, attemptsLeft - 1);
    }

    console.log("✓ API call successful!");
    return response;
    
  } catch (error) {
    // If it's a network error or fetch error, try next key
    if (error.message.includes("fetch") || error.message.includes("network")) {
      console.warn(`Network error: ${error.message}. Trying next key...`);
      return await callGeminiAPI(requestBody, attemptsLeft - 1);
    }
    throw error;
  }
}

/**
 * Main function to generate content using Gemini API
 */
export async function generateContent(type, text) {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error("Gemini API key not configured. Please add REACT_APP_GEMINI_API_KEY to your .env file");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("No input text provided");
  }

  const prompt = buildPrompt(type, text);
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192, // Increased for longer responses
    }
  };

  try {
    const response = await callGeminiAPI(requestBody);

    const data = await response.json();
    
    console.log("API Response data:", data);
    
    // Extract the generated text
    const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error("Full API response:", JSON.stringify(data, null, 2));
      
      // Check for content filtering or other issues
      if (data?.candidates?.[0]?.finishReason) {
        throw new Error(`Content generation stopped: ${data.candidates[0].finishReason}`);
      }
      
      throw new Error("No content generated from API. Check console for details.");
    }

    console.log("Generated text:", generatedText);

    // Parse and return JSON
    const result = extractJSON(generatedText);
    
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

/**
 * Helper function to validate API key
 */
export function isAPIConfigured() {
  return GEMINI_API_KEYS.length > 0;
}

/**
 * Get info about configured API keys
 */
export function getAPIKeyInfo() {
  return {
    total: GEMINI_API_KEYS.length,
    current: currentKeyIndex + 1
  };
}
