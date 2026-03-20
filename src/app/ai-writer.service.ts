import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({
  providedIn: 'root'
})
export class AiWriterService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize Gemini API. Assumes GEMINI_API_KEY is available in the environment.
    // In a real app, ensure this is securely handled or proxied if needed,
    // but for AI Studio preview, it's injected.
    // GEMINI_API_KEY es una constante global inyectada por esbuild en tiempo de build
    // Se configura en angular.json > build > options > define
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiKey = (typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '') ||
                   (typeof (globalThis as any)['GEMINI_API_KEY'] !== 'undefined' ? (globalThis as any)['GEMINI_API_KEY'] : '');
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Generates an initial draft based on a prompt and optional files.
   */
  async generateDraft(prompt: string, files: File[] = []): Promise<string> {
    try {
      const parts: {text?: string, inlineData?: {data: string, mimeType: string}}[] = [
        { text: `You are an expert, thoughtful writing collaborator. Write a draft based on the following request. Keep the tone engaging and natural. Do not include markdown formatting like bolding or headers unless explicitly asked, just return clean text paragraphs.\n\nRequest: ${prompt}` }
      ];

      for (const file of files) {
        const base64Data = await this.fileToBase64(file);
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.type
          }
        });
      }

      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: { parts }
      });
      return response.text || '';
    } catch (error) {
      console.error('Error generating draft:', error);
      throw error;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/jpeg;base64, part
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Iterates on a specific selection of text.
   */
  async inlineEdit(selectedText: string, instruction: string, fullContext: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `You are an expert editor helping a writer refine their work. 
        
        Original selected text to change:
        "${selectedText}"
        
        Writer's instruction for this text:
        "${instruction}"
        
        Surrounding document context (for tone and flow):
        "${fullContext.substring(0, 2000)}" // Limit context length
        
        Task: Rewrite ONLY the selected text based on the instruction. Ensure it flows well with the context.
        Return ONLY the rewritten text. Do not include quotes around it, do not include explanations.`,
      });
      return response.text?.trim() || selectedText;
    } catch (error) {
      console.error('Error performing inline edit:', error);
      throw error;
    }
  }

  /**
   * Proactively analyzes the text and provides suggestions.
   */
  async getProactiveSuggestions(fullText: string): Promise<{ quote: string, suggestion: string, reason: string }[]> {
    if (!fullText || fullText.trim().length < 50) return [];

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Review the following text as a thoughtful editor. Identify up to 3 specific areas that could be improved (e.g., clunky phrasing, weak verbs, unclear logic, or opportunities to be more engaging).
        
        Text to review:
        "${fullText}"
        `,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: "A list of specific editorial suggestions.",
            items: {
              type: Type.OBJECT,
              properties: {
                quote: {
                  type: Type.STRING,
                  description: "The exact short quote from the original text that needs improvement."
                },
                suggestion: {
                  type: Type.STRING,
                  description: "Your suggested rewrite for that specific quote."
                },
                reason: {
                  type: Type.STRING,
                  description: "A brief, encouraging explanation of why this change improves the text."
                }
              },
              required: ["quote", "suggestion", "reason"]
            }
          }
        }
      });

      const jsonStr = response.text || '[]';
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }
}
