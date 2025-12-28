
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
      As a senior hotel business strategist, analyze the historical sales data for non-hospitality services for ${location}.
      
      Historical Data: ${JSON.stringify(dataSummary)}
      Investment Budget: ₹${budgetINR.toLocaleString()}
      Target Profit: $${targetMonthlyProfit} / month
      Target ROI: ${targetROI}%
      
      Tasks:
      1. Provide a "Verdict" for each service category (Spa, Dining, MICE, Retail, Wellness, Parking). Verdicts: 'Aggressive Expansion', 'Strategic Maintain', 'Optimization Required', 'Phased Pivot'.
      2. Distribute the EXACT investment budget of ₹${budgetINR.toLocaleString()} across specific sub-categories and services.
      3. For each investment item, provide sub-category details, the parent service type, the allocation amount (sum must equal budget), rationale, and expected yield.
      4. Simulate a 9-month ROI curve.

      Be highly specific to ${location} market conditions.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
                categoryJudgments: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      category: { type: Type.STRING },
                      verdict: { type: Type.STRING },
                      rationale: { type: Type.STRING },
                      priorityScore: { type: Type.NUMBER }
                    }
                  }
                },
                investmentPlan: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      subCategory: { type: Type.STRING },
                      serviceType: { type: Type.STRING },
                      allocationAmount: { type: Type.NUMBER },
                      rationale: { type: Type.STRING },
                      expectedAnnualYield: { type: Type.STRING }
                    }
                  }
                },
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
