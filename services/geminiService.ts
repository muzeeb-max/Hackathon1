
import { GoogleGenAI, Type } from "@google/genai";
import { ComplaintAnalysis, Sentiment, UrgencyLevel } from "../types";

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: "Category of the complaint (e.g., Billing, Technical Issue, Service Quality, Delivery, Product Defect, Account Issue).",
    },
    sentiment: {
      type: Type.STRING,
      description: "Customer sentiment: Very Angry, Angry, Neutral, Slightly Dissatisfied, or Satisfied.",
    },
    urgency: {
      type: Type.STRING,
      description: "Urgency level: Low, Medium, High, or Critical.",
    },
    key_issues: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of key issues extracted as bullet points.",
    },
    recommended_action: {
      type: Type.STRING,
      description: "Recommended action (e.g., Standard customer support response, Technical team investigation, Billing correction, Escalation to senior support, Immediate manual intervention).",
    },
    automated_response: {
      type: Type.STRING,
      description: "A polite, professional, and empathetic response draft.",
    },
    summary: {
      type: Type.STRING,
      description: "A brief 1-sentence executive summary.",
    },
    rootCause: {
      type: Type.STRING,
      description: "The suspected primary cause of the issue.",
    },
  },
  required: ["category", "sentiment", "urgency", "key_issues", "recommended_action", "automated_response", "summary", "rootCause"],
};

export const analyzeComplaint = async (text: string): Promise<Omit<ComplaintAnalysis, 'id' | 'originalText' | 'timestamp'>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following customer complaint and return the response in JSON format.

Customer Complaint: "${text}"

CRITICAL INSTRUCTIONS:
1. SENTIMENT: Detect and classify as: Very Angry, Angry, Neutral, Slightly Dissatisfied, or Satisfied.
2. URGENCY: Determine level (Low, Medium, High, Critical) based on:
   - Financial loss (High/Critical)
   - Repeated complaints (High)
   - Strong negative language (Angry/Very Angry increases urgency)
   - Service disruption (Critical)
3. KEY ISSUES: Extract the main concerns as a list of bullet points.
4. RECOMMENDED ACTION: Suggest the best next step from: Standard customer support response, Technical team investigation, Billing correction, Escalation to senior support, or Immediate manual intervention.
5. AUTOMATED RESPONSE: Generate a response that is:
   - Polite, professional, and empathetic.
   - Acknowledges the specific issue.
   - Apologizes sincerely.
   - Reassures the customer without blaming.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      category: result.category,
      sentiment: result.sentiment as Sentiment,
      urgency: result.urgency as UrgencyLevel,
      key_issues: result.key_issues,
      recommended_action: result.recommended_action,
      automated_response: result.automated_response,
      summary: result.summary,
      rootCause: result.rootCause,
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze the complaint. Please try again.");
  }
};
