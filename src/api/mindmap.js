// Advanced Mind Map API with Claude Sonnet 4.5
import Anthropic from '@anthropic-ai/sdk';
import { generateContent as geminiGenerate } from './gemini';

// Initialize Anthropic client (will use from backend/proxy)
const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY || '';
const USE_CLAUDE = CLAUDE_API_KEY && CLAUDE_API_KEY !== 'your_claude_api_key_here';

/**
 * Generate mind map using Claude Sonnet 4.5
 */
async function generateWithClaude(text) {
  if (!USE_CLAUDE) {
    console.warn('Claude API not configured, falling back to Gemini');
    return await geminiGenerate('mindmap', text);
  }

  try {
    const anthropic = new Anthropic({
      apiKey: CLAUDE_API_KEY,
      dangerouslyAllowBrowser: true // For demo only - use backend proxy in production
    });

    const prompt = `You are an expert knowledge mapper. Create a comprehensive, interactive mind map from the following content.

CRITICAL: Return ONLY valid JSON, no other text. Follow this exact structure:

{
  "root": {
    "id": "root",
    "title": "Main Topic (2-5 words)",
    "summary": "One sentence overview",
    "key_points": ["point 1", "point 2", "point 3"],
    "relations": [],
    "source": "document_name",
    "type": "root",
    "children": []
  }
}

Each child node must have:
{
  "id": "unique_id",
  "title": "Concept Name (2-6 words)",
  "summary": "Brief explanation (1-2 sentences)",
  "key_points": ["important detail 1", "important detail 2"],
  "relations": ["id_of_related_node"],
  "source": "document_name",
  "type": "concept" | "definition" | "example" | "process",
  "children": [nested_children]
}

RULES:
1. Create 15-30 total nodes (including all levels)
2. Max depth: 4 levels
3. Root has 3-6 main children
4. Each main child has 2-5 sub-children
5. Use type field: "root", "concept", "definition", "example", "process"
6. Relations array: IDs of nodes that connect across branches
7. Keep titles concise (2-6 words)
8. Summaries: 1-2 sentences max
9. Key points: 2-4 items per node
10. Extract source from "--- filename ---" markers

Content:
${text.substring(0, 25000)}

Return ONLY the JSON object, nothing else.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    console.log('Claude response:', responseText);

    // Extract JSON from response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const mindMapData = JSON.parse(jsonMatch[0]);
    
    // Convert Claude format to our internal format
    return convertClaudeToMindMap(mindMapData);

  } catch (error) {
    console.error('Claude API error:', error);
    console.log('Falling back to Gemini...');
    return await geminiGenerate('mindmap', text);
  }
}

/**
 * Convert Claude's hierarchical format to flat nodes + edges
 */
function convertClaudeToMindMap(claudeData) {
  const nodes = [];
  const edges = [];
  const relationMap = new Map(); // Track cross-branch relations

  function traverse(node, level = 0, parentId = null) {
    // Add node
    nodes.push({
      id: node.id,
      label: node.title,
      summary: node.summary,
      keyPoints: node.key_points || [],
      level: level,
      type: node.type || 'concept',
      source: node.source || '',
      citations: node.source ? [{ file: node.source }] : []
    });

    // Add edge from parent
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        label: getEdgeLabel(node.type, level),
        type: 'hierarchy'
      });
    }

    // Store relations for cross-branch connections
    if (node.relations && node.relations.length > 0) {
      relationMap.set(node.id, node.relations);
    }

    // Traverse children
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => traverse(child, level + 1, node.id));
    }
  }

  // Start traversal from root
  if (claudeData.root) {
    traverse(claudeData.root);
  } else {
    traverse(claudeData); // If root is the data itself
  }

  // Add cross-branch relation edges
  relationMap.forEach((relatedIds, nodeId) => {
    relatedIds.forEach(relatedId => {
      if (nodes.find(n => n.id === relatedId)) {
        edges.push({
          id: `rel-${nodeId}-${relatedId}`,
          source: nodeId,
          target: relatedId,
          label: 'relates to',
          type: 'relation',
          style: 'dashed'
        });
      }
    });
  });

  return { nodes, edges };
}

/**
 * Get appropriate edge label based on node type
 */
function getEdgeLabel(nodeType, level) {
  const labels = {
    concept: ['explores', 'includes', 'contains'],
    definition: ['defines', 'explains', 'clarifies'],
    example: ['demonstrates', 'shows', 'illustrates'],
    process: ['leads to', 'results in', 'produces']
  };

  const labelSet = labels[nodeType] || labels.concept;
  return labelSet[Math.min(level - 1, labelSet.length - 1)] || 'relates to';
}

/**
 * Get API keys with rotation support
 */
const GEMINI_API_KEYS = [
  process.env.REACT_APP_GEMINI_API_KEY,
  process.env.REACT_APP_GEMINI_API_KEY_2,
  process.env.REACT_APP_GEMINI_API_KEY_3,
  process.env.REACT_APP_GEMINI_API_KEY_4,
  process.env.REACT_APP_GEMINI_API_KEY_5,
  process.env.REACT_APP_GEMINI_API_KEY_6,
  process.env.REACT_APP_GEMINI_API_KEY_7
].filter(key => key && key !== 'your_second_api_key_here' && key !== 'your_third_api_key_here' && 
         key !== 'your_fourth_api_key_here' && key !== 'your_fifth_api_key_here' && 
         key !== 'your_sixth_api_key_here' && key !== 'your_seventh_api_key_here');

let currentKeyIndex = 0;

function getNextApiKey() {
  if (GEMINI_API_KEYS.length === 0) {
    throw new Error('No valid Gemini API keys configured');
  }
  const key = GEMINI_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

/**
 * Generate mind map directly with Gemini (optimized for token limits)
 */
async function generateMindMapWithGemini(text, maxNodes = 25, maxDepth = 4) {
  const model = 'gemini-2.5-flash';
  const prompt = `Create a mind map from this content. Return valid JSON only (no markdown, no extra text).

Required structure:
{
  "nodes": [
    {"id": "1", "label": "Main Topic", "level": 0, "type": "root", "summary": "Brief overview", "keyPoints": ["point1", "point2"]},
    {"id": "2", "label": "Subtopic", "level": 1, "type": "concept", "summary": "Details", "keyPoints": ["detail1"]}
  ],
  "edges": [
    {"source": "1", "target": "2", "label": "explores"}
  ]
}

CRITICAL: 
- Return ONLY valid JSON (no trailing commas, no extra text)
- Max ${maxNodes} nodes, depth ${maxDepth}
- Types: root, concept, definition, example, process
- Root at level 0

Content:
${text}

Return JSON:`;

  let lastError = null;
  
  // Try each API key in rotation
  for (let attempt = 0; attempt < GEMINI_API_KEYS.length; attempt++) {
    try {
      const apiKey = getNextApiKey();
      console.log(`Mind map generation attempt ${attempt + 1}/${GEMINI_API_KEYS.length}`);
      
      // Add delay after 503 errors to let servers recover
      if (attempt > 0 && lastError?.message?.includes('503')) {
        const delay = 1000 * attempt; // 1s, 2s, 3s...
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3, // Even lower for more deterministic output
              topP: 0.8,
              topK: 20,
              maxOutputTokens: 8192, // Increase to handle thinking tokens
              candidateCount: 1,
              responseMimeType: "application/json" // Request JSON format
            }
          })
        }
      );
      
      // Check HTTP response
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data?.error) {
        throw new Error(`API Error: ${data.error.message || 'Unknown error'}`);
      }
      
      // Check for MAX_TOKENS finish reason
      const finishReason = data?.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('MAX_TOKENS hit - thinking tokens exhausted output budget');
        throw new Error('MAX_TOKENS - model used too many thinking tokens');
      }
      
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        // Log full response for debugging
        console.error('Empty response from Gemini:', JSON.stringify(data, null, 2));
        throw new Error('No content generated');
      }

      // Extract JSON - try to find the most complete JSON object
      let jsonString = null;
      
      // First try: exact match between { and }
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      } else {
        throw new Error('No JSON found in response');
      }

      // Comprehensive JSON cleanup
      // 1. Remove trailing commas before closing brackets/braces
      jsonString = jsonString.replace(/,(\s*[\]}])/g, '$1');
      
      // 2. Fix multiple commas
      jsonString = jsonString.replace(/,+/g, ',');
      
      // 3. Remove commas after closing brackets/braces
      jsonString = jsonString.replace(/([\]}])(\s*),(\s*)([\]}])/g, '$1$2$4');
      
      // 4. Try parsing, if it fails, try more aggressive fixes
      let result;
      try {
        result = JSON.parse(jsonString);
      } catch (parseError) {
        console.warn('Initial parse failed, trying aggressive cleanup...', parseError);
        
        // More aggressive: remove all trailing commas more carefully
        // Match comma followed by optional whitespace and then ] or }
        jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
        
        // Try again
        result = JSON.parse(jsonString);
      }
      
      // Ensure proper structure
      if (!result.nodes || !Array.isArray(result.nodes)) {
        throw new Error('Invalid nodes structure');
      }
      if (!result.edges) {
        result.edges = [];
      }

      console.log(`Mind map generated successfully with ${result.nodes.length} nodes using ${model}`);
      result.model = model; // Track which model was used
      return result;
      
    } catch (error) {
      console.error(`Mind map generation attempt ${attempt + 1} failed:`, error);
      lastError = error;
      
      // Retry on these errors:
      const shouldRetry = 
        error.message?.includes('quota') || 
        error.message?.includes('RESOURCE_EXHAUSTED') ||
        error.message?.includes('503') ||  // Server overloaded
        error.message?.includes('UNAVAILABLE') ||
        error.message?.includes('MAX_TOKENS') ||
        error.message?.includes('No content generated') ||
        error.message?.includes('API Error') ||
        error.name === 'SyntaxError' ||
        error.message?.includes('JSON');
      
      if (shouldRetry) {
        console.log(`Error encountered, trying next API key... (${attempt + 1}/${GEMINI_API_KEYS.length})`);
        
        // If not the last attempt, continue to next key
        if (attempt < GEMINI_API_KEYS.length - 1) {
          continue;
        }
      }
      
      // For other errors or if it's the last attempt, throw
      if (attempt === GEMINI_API_KEYS.length - 1) {
        throw error;
      }
    }
  }
  
  // If all attempts failed
  throw new Error(`All ${GEMINI_API_KEYS.length} API keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

/**
 * Main mind map generation function
 */
export async function generateMindMap(text, options = {}) {
  const {
    preferClaude = true,
    maxNodes = 30,
    maxDepth = 4
  } = options;

  console.log('Generating mind map...', { preferClaude, textLength: text.length });

  try {
    let result;
    
    // Truncate input for mind maps to avoid MAX_TOKENS
    // Reduced from 15k to 10k because Gemini uses 4k+ tokens for thinking
    const truncatedText = text.length > 10000 
      ? text.substring(0, 10000) + '\n\n[Content truncated for mind map generation]'
      : text;
    
    if (preferClaude && USE_CLAUDE) {
      result = await generateWithClaude(truncatedText);
    } else {
      // Use Gemini 2.5 Flash (will retry with all 4 API keys automatically)
      result = await generateMindMapWithGemini(truncatedText, maxNodes, maxDepth);
    }

    // Validate and clean up result
    if (!result.nodes || result.nodes.length === 0) {
      throw new Error('No nodes generated');
    }

    // Limit nodes if necessary
    if (result.nodes.length > maxNodes) {
      console.warn(`Trimming nodes from ${result.nodes.length} to ${maxNodes}`);
      result.nodes = result.nodes.slice(0, maxNodes);
      
      // Filter edges to only include remaining nodes
      const nodeIds = new Set(result.nodes.map(n => n.id));
      result.edges = result.edges.filter(e => 
        nodeIds.has(e.source) && nodeIds.has(e.target)
      );
    }

    // Add metadata
    result.metadata = {
      generatedAt: new Date().toISOString(),
      totalNodes: result.nodes.length,
      totalEdges: result.edges.length,
      maxDepth: Math.max(...result.nodes.map(n => n.level || 0)),
      aiModel: result.model || (USE_CLAUDE ? 'Claude Sonnet 4.5' : 'Gemini Flash')
    };

    console.log('Mind map generated:', result.metadata);
    return result;

  } catch (error) {
    console.error('Mind map generation failed:', error);
    throw new Error(`Failed to generate mind map: ${error.message}`);
  }
}

/**
 * Check if Claude API is configured
 */
export function isClaudeConfigured() {
  return USE_CLAUDE;
}

/**
 * Get AI model info
 */
export function getAIModelInfo() {
  return {
    useClaude: USE_CLAUDE,
    model: USE_CLAUDE ? 'Claude Sonnet 4.5' : 'Gemini 2.5 Flash',
    provider: USE_CLAUDE ? 'Anthropic' : 'Google'
  };
}
