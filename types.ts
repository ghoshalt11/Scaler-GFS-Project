
export interface SaleTransaction {
  id: string;
  date: string;
  serviceType: 'Spa' | 'Dining' | 'MICE' | 'Parking' | 'Retail' | 'Wellness';
  revenue: number;
  cost: number;
  location: string;
}

export interface MarketInsight {
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  sourceUrl?: string;
}

export interface StrategicRecommendation {
  type: 'Renovation' | 'NewService' | 'Optimization';
  service: string;
  rationale: string;
  estimatedROI: string;
  actionPriority: 'High' | 'Medium' | 'Low';
}

export interface BreakEvenPoint {
  month: number;
  cumulativeProfit: number;
  label: string;
}

export interface ServiceUsageDemand {
  service: string;
  actualUsage: number;
  marketDemand: number;
}

export interface SimulationResult {
  judgment: string;
  forecastedRevenueImpact: string;
  forecastedProfitImpact: string;
  breakEvenMonths: number;
  roiPercentage: number;
  breakEvenData: BreakEvenPoint[];
  confidenceScore: number;
  dataIntegrity: number;
  recommendationStability: 'High' | 'Moderate' | 'Volatile';
}

export interface WhatIfRecommendation {
  action: string;
  expectedOutcome: string;
  feasibilityScore: number;
}

export interface BusinessAnalysis {
  historicalSummary: string;
  marketTrends: MarketInsight[];
  recommendations: StrategicRecommendation[];
  sources: { title: string; uri: string }[];
  simulation?: SimulationResult;
  whatIfActions?: WhatIfRecommendation[];
  usageVsDemand?: ServiceUsageDemand[];
}

export interface AppState {
  transactions: SaleTransaction[];
  location: string;
  isLoading: boolean;
  analysis: BusinessAnalysis | null;
  budgetINR: number;
  targetMonthlyProfit: number;
  targetROI: number;
  displayCurrency: 'USD' | 'INR';
  selectedMonth: string; // YYYY-MM
}
