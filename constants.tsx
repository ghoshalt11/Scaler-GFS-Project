
import { SaleTransaction } from './types';

export const SAMPLE_DATA: SaleTransaction[] = [
  // March 2025 - Spring Cycle Start (MICE Baseline)
  { id: 'mar-1', date: '2025-03-05', serviceType: 'MICE', revenue: 45000, cost: 20000, location: 'San Francisco' },
  { id: 'mar-2', date: '2025-03-12', serviceType: 'Dining', revenue: 21000, cost: 10000, location: 'San Francisco' },
  { id: 'mar-3', date: '2025-03-22', serviceType: 'Spa', revenue: 12000, cost: 5000, location: 'San Francisco' },

  // April 2025 - Conference Peak (High MICE)
  { id: 'apr-1', date: '2025-04-10', serviceType: 'MICE', revenue: 88000, cost: 35000, location: 'San Francisco' },
  { id: 'apr-2', date: '2025-04-15', serviceType: 'Dining', revenue: 26000, cost: 12000, location: 'San Francisco' },
  { id: 'apr-3', date: '2025-04-28', serviceType: 'Wellness', revenue: 8000, cost: 3000, location: 'San Francisco' },

  // May 2025 - Expansion Phase
  { id: 'may-1', date: '2025-05-05', serviceType: 'Dining', revenue: 32000, cost: 14000, location: 'San Francisco' },
  { id: 'may-2', date: '2025-05-18', serviceType: 'Spa', revenue: 24000, cost: 9000, location: 'San Francisco' },
  { id: 'may-3', date: '2025-05-25', serviceType: 'Retail', revenue: 11000, cost: 4500, location: 'San Francisco' },

  // June 2025 - Summer Tourism Peak
  { id: 'jun-1', date: '2025-06-10', serviceType: 'Dining', revenue: 45000, cost: 19000, location: 'San Francisco' },
  { id: 'jun-2', date: '2025-06-20', serviceType: 'Spa', revenue: 29000, cost: 11000, location: 'San Francisco' },
  { id: 'jun-3', date: '2025-06-25', serviceType: 'MICE', revenue: 35000, cost: 15000, location: 'San Francisco' },

  // July 2025 - High Leisure Spend
  { id: 'jul-1', date: '2025-07-04', serviceType: 'Dining', revenue: 52000, cost: 22000, location: 'San Francisco' },
  { id: 'jul-2', date: '2025-07-15', serviceType: 'Wellness', revenue: 15000, cost: 5000, location: 'San Francisco' },
  { id: 'jul-3', date: '2025-07-28', serviceType: 'Retail', revenue: 18000, cost: 7000, location: 'San Francisco' },

  // August 2025 - Late Summer Stability
  { id: 'aug-1', date: '2025-08-12', serviceType: 'Dining', revenue: 41000, cost: 18000, location: 'San Francisco' },
  { id: 'aug-2', date: '2025-08-20', serviceType: 'Spa', revenue: 26000, cost: 10000, location: 'San Francisco' },
  { id: 'aug-3', date: '2025-08-28', serviceType: 'Wellness', revenue: 10000, cost: 4000, location: 'San Francisco' },

  // September 2025 - Shoulder Season Transition
  { id: 'sep-1', date: '2025-09-08', serviceType: 'Dining', revenue: 28000, cost: 13000, location: 'San Francisco' },
  { id: 'sep-2', date: '2025-09-15', serviceType: 'MICE', revenue: 65000, cost: 25000, location: 'San Francisco' },
  { id: 'sep-3', date: '2025-09-22', serviceType: 'Spa', revenue: 14000, cost: 6000, location: 'San Francisco' },

  // October 2025 - Autumn Business Recovery
  { id: 'oct-1', date: '2025-10-10', serviceType: 'MICE', revenue: 75000, cost: 30000, location: 'San Francisco' },
  { id: 'oct-2', date: '2025-10-18', serviceType: 'Dining', revenue: 30000, cost: 14000, location: 'San Francisco' },
  { id: 'oct-3', date: '2025-10-25', serviceType: 'Wellness', revenue: 11000, cost: 4000, location: 'San Francisco' },

  // November 2025 - Pre-Holiday Inbound
  { id: 'nov-1', date: '2025-11-05', serviceType: 'Dining', revenue: 38000, cost: 16000, location: 'San Francisco' },
  { id: 'nov-2', date: '2025-11-15', serviceType: 'Spa', revenue: 22000, cost: 9000, location: 'San Francisco' },
  { id: 'nov-3', date: '2025-11-25', serviceType: 'Retail', revenue: 14000, cost: 5500, location: 'San Francisco' },
];

export const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];
