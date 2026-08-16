import { GoogleGenAI, Type, Modality } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION } from '../constants';
import { AnalysisResult } from '../types';

// Models
const ANALYZER_MODEL = 'gemini-3-pro-preview'; 
const CODER_MODEL = 'gemini-3-pro-preview';
const CHAT_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const MAPS_MODEL = 'gemini-2.5-flash';

let ai: GoogleGenAI | null = null;

export const getAIClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("Google Gemini API Key missing. Please set process.env.API_KEY.");
    }
    
    // Explicitly check for Groq keys to give a helpful error
    if (apiKey.trim().startsWith("gsk_")) {
        throw new Error("Groq API Key detected. This application is built with the Google GenAI SDK and requires a Google API Key (usually starting with 'AIza'). Please obtain a key from aistudio.google.com.");
    }

    ai = new GoogleGenAI({ apiKey: apiKey });
  }
  return ai;
};

export const analyzeProjectStructure = async (structureText: string, description: string): Promise<AnalysisResult> => {
  try {
    const client = getAIClient();
    
    // JSON Schema for Gemini
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        seniorityBracket: { type: Type.STRING },
        score: { type: Type.NUMBER },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING },
        techStackDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
        installationCommand: { type: Type.STRING }
      },
      required: ["seniorityBracket", "score", "strengths", "weaknesses", "summary", "techStackDetected"]
    };

    const prompt = `
      ${INITIAL_SYSTEM_INSTRUCTION}
      
      Project Description: ${description}
      
      Directory Structure:
      ${structureText}
    `;

    const response = await client.models.generateContent({
      model: ANALYZER_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        thinkingConfig: { thinkingBudget: 32768 } // Max thinking budget for deep analysis
      }
    });

    const responseText = response.text;
    
    if (!responseText) throw new Error("No response from Gemini");
    
    return JSON.parse(responseText) as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw new Error(error.message || "Analysis failed due to an unknown error.");
  }
};

export const generateFileContent = async (fileName: string, fileContext: string, projectDescription: string): Promise<string> => {
    try {
        const client = getAIClient();
        const prompt = `
            You are an expert software engineer. Write the implementation code for the file: "${fileName}".
            
            Context:
            - Project Description: ${projectDescription}
            - Path/Context: ${fileContext}
            
            Requirements:
            - Provide ONLY the code. No markdown formatting (no \`\`\`), no conversational text.
            - Include necessary imports based on the filename.
            - If it's a CSV, provide dummy headers and 1 row of data.
            - If it's a generic file, provide a robust skeleton.
        `;

        const response = await client.models.generateContent({
            model: CODER_MODEL,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const content = response.text;
        if (!content) throw new Error("Empty response");
        // Strip markdown code blocks if present
        return content.replace(/^```\w*\n/g, '').replace(/\n```$/g, '');
    } catch (error: any) {
        console.error("Code Generation Error:", error);
        throw new Error(error.message || "Code generation failed.");
    }
};

export const chatWithArchitect = async (history: { role: string, text: string }[], newMessage: string, projectContext?: string): Promise<string> => {
    try {
        const client = getAIClient();
        
        const historyContent = history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.text }]
        }));

        const systemInstruction = `You are a helpful software architect assistant called 'Antigravity Architect'. 
        
        Context about the user's project:
        ${projectContext || "No specific project context provided."}
        
        If the user asks where features are (like buttons), explain that they are in the 'Run App' preview mode which simulates the app.py code.
        Discuss the user's project structure, suggesting improvements or explaining concepts found in their file tree.`;

        const chat = client.chats.create({
            model: CHAT_MODEL,
            history: historyContent,
            config: {
                systemInstruction: systemInstruction
            }
        });

        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "I couldn't generate a response.";
    } catch (error: any) {
        console.error("Chat Error:", error);
        return `Error: ${error.message || "Connection failed"}`;
    }
};

export const performForensicAnalysis = async (filename: string, csvContent: string, sensitivity: number): Promise<any> => {
    try {
        const client = getAIClient();
        
        const prompt = `
            Act as a high-precision forensic accounting AI. 
            
            Analyze the following CSV Data from file "${filename}" with anomaly sensitivity set to ${sensitivity}.
            
            CSV DATA:
            ${csvContent.slice(0, 300000)} 
            (Data truncated if over 300k chars for performance)

            Task:
            Perform a statistical and rule-based analysis on this data to find potential fraud or errors.
            Look for:
            1. Benford's Law violations in the leading digits of amounts.
            2. "Round Number" anomalies (e.g., £50,000.00 exactly).
            3. Weekend or Holiday transaction dates.
            4. Duplicate payments (same amount, same entity, close date).
            5. Split invoices (smurfing) - multiple small payments to same vendor just under thresholds.

            Output JSON Format:
            {
              "Total Records Scanned": number,
              "Anomalies Found": number,
              "Risk Score": number (0-100),
              "Top 3 Suspicious Transactions": [
                { "Date": string, "Entity": string, "Amount": string, "Reason": string }
              ]
            }
            
            Return ONLY valid JSON.
        `;

        const response = await client.models.generateContent({
            model: ANALYZER_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 } 
            }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (error: any) {
        console.error("Forensic Analysis Error:", error);
        throw new Error("Analysis failed: " + error.message);
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const client = getAIClient();
        const response = await client.models.generateContent({
            model: TTS_MODEL,
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        
        const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64) throw new Error("Audio generation failed");
        return base64;
    } catch (error: any) {
        console.error("TTS Error:", error);
        throw new Error(error.message || "Failed to generate speech");
    }
};

export const verifyEntityLocation = async (entityName: string): Promise<{ text: string, maps: any[] }> => {
    try {
        const client = getAIClient();
        const response = await client.models.generateContent({
            model: MAPS_MODEL,
            contents: `Find the official headquarters or main office for ${entityName}. Verify its address and provide a brief summary of its location.`,
            config: {
                tools: [{ googleMaps: {} }]
            }
        });
        
        return {
            text: response.text || "No location found.",
            maps: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    } catch (error: any) {
        console.error("Maps Error:", error);
        throw new Error(error.message || "Failed to verify location");
    }
};