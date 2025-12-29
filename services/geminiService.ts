
import { BusinessAnalysis, SaleTransaction } from "../types";

export class GeminiService {
  /**
   * Analyzes business data by calling the project's backend service.
   * This ensures the API Key remains secure on the server side.
   */
  async analyzeBusiness(
    transactions: SaleTransaction[], 
    location: string, 
    _budgetGBP: number, // Unused in prompt logic but kept for interface consistency
    budgetINR: number,
    targetMonthlyProfit: number,
    targetROI: number
  ): Promise<BusinessAnalysis> {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions,
          location,
          budgetINR,
          targetMonthlyProfit,
          targetROI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      return result as BusinessAnalysis;
    } catch (error) {
      console.error("GeminiService: Backend request failed", error);
      throw error;
    }
  }
}
