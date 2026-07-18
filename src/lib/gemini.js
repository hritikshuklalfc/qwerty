import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export async function generateWorkflow(prompt, apiKey) {
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please add it in Settings.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      nodes: {
        type: SchemaType.ARRAY,
        description: "List of n8n nodes.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            name: { type: SchemaType.STRING, description: "Unique name for the node (e.g. 'Webhook', 'HTTP Request')" },
            type: { 
              type: SchemaType.STRING, 
              description: "Must be a valid n8n node type string (e.g. 'n8n-nodes-base.webhook', 'n8n-nodes-base.httpRequest', 'n8n-nodes-base.set', 'n8n-nodes-base.code')",
            },
            typeVersion: { type: SchemaType.NUMBER, description: "Usually 1" },
            position: {
              type: SchemaType.ARRAY,
              description: "[x, y] coordinates",
              items: { type: SchemaType.NUMBER }
            },
            parameters: {
              type: SchemaType.OBJECT,
              description: "Configuration parameters for the node"
            }
          },
          required: ["id", "name", "type", "typeVersion", "position", "parameters"]
        }
      },
      connections: {
        type: SchemaType.OBJECT,
        description: "n8n connections object. Keys are source node names. Values are objects mapping output types (usually 'main') to arrays of arrays of connection objects. Example: { 'Webhook': { 'main': [ [ { 'node': 'HTTP Request', 'type': 'main', 'index': 0 } ] ] } }"
      }
    },
    required: ["nodes", "connections"]
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction: "You are an AI Workflow Architect. The user will provide a prompt describing an automated process. Generate a fully valid n8n workflow JSON object containing 'nodes' and 'connections'. Use standard n8n node types like 'n8n-nodes-base.webhook', 'n8n-nodes-base.httpRequest', 'n8n-nodes-base.set', 'n8n-nodes-base.code', 'n8n-nodes-base.slack'. Space nodes logically by adding ~200px to the X coordinate for each step. The connections object MUST strictly follow n8n format: keys are source node NAMES, mapping to { 'main': [[ { 'node': 'TargetNodeName', 'type': 'main', 'index': 0 } ]] }.",
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}
