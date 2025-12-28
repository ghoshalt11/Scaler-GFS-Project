
import { GoogleGenAI, Type } from "@google/genai";
import { BusinessAnalysis, SaleTransaction } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  async analyzeBusiness(
    transactions: SaleTransaction[], 
    location: string, 
    budgetGBP: number, 
    budgetINR: number,
    targetMonthlyProfit: number,
    targetROI: number
  ): Promise<BusinessAnalysis> {
    const dataSummary = transactions.map(t => ({
      date: t.date,
      type: t.serviceType,
      rev: t.revenue,
      cost: t.cost
    }));

    const systemDate = new Date().toISOString().split('T')[0];

    const prompt = `
      As a senior hotel business strategist, analyze the provided historical sales data for non-hospitality services specifically for the location: ${location}.
      
      Historical Data Summary: ${JSON.stringify(dataSummary)}
      Current System Date: ${systemDate}
      
      Strategic Context:
      - Proposed Investment Budget: ₹${budgetINR.toLocaleString()}
      - Stakeholder Targets: Target Monthly Profit contribution of $${targetMonthlyProfit} and Target ROI of ${targetROI}%
      
      Tasks:
      1. Summarize historical performance relative to the last 9 months (Mar-Nov 2025).
      2. Research REAL-TIME market trends in ${location}.
      3. Strategic Investment Analysis with confidence metrics.
      4. Seasonal Analysis: Provide a mapping of services to 'Actual Usage' (normalized 0-100 from data) vs 'Market Demand' (normalized 0-100 based on city trends).
      5. "What-If" Analysis: Recommend 3-5 high-impact actions to achieve the profit target.

      Structure your response according to the provided schema.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            historicalSummary: { type: Type.STRING },
            marketTrends: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            },
            usageVsDemand: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  service: { type: Type.STRING },
                  actualUsage: { type: Type.NUMBER },
                  marketDemand: { type: Type.NUMBER }
                }
              }
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  service: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  estimatedROI: { type: Type.STRING },
                  actionPriority: { type: Type.STRING }
                }
              }
            },
            simulation: {
              type: Type.OBJECT,
              properties: {
                judgment: { type: Type.STRING },
                forecastedRevenueImpact: { type: Type.STRING },
                forecastedProfitImpact: { type: Type.STRING },
                breakEvenMonths: { type: Type.NUMBER },
                roiPercentage: { type: Type.NUMBER },
                confidenceScore: { type: Type.NUMBER },
                dataIntegrity: { type: Type.NUMBER },
                recommendationStability: { type: Type.STRING },
                breakEvenData: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      month: { type: Type.NUMBER },
                      cumulativeProfit: { type: Type.NUMBER },
                      label: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            whatIfActions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING },
                  expectedOutcome: { type: Type.STRING },
                  feasibilityScore: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["historicalSummary", "marketTrends", "recommendations", "simulation", "whatIfActions", "usageVsDemand"]
        }
      }
    });

    const result = JSON.parse(response.text);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Market Source",
        uri: chunk.web?.uri || "#"
      })) || [];

    return { ...result, sources };
  }
}
