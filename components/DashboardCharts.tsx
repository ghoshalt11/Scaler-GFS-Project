
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, Label
} from 'recharts';
import { SaleTransaction, BusinessAnalysis } from '../types';
import { COLORS } from '../constants';

interface Props {
  data: SaleTransaction[];
  displayCurrency: 'USD' | 'INR';
  conversionRate: number;
  analysis: BusinessAnalysis | null;
}

export const DashboardCharts: React.FC<Props> = ({ data, displayCurrency, conversionRate, analysis }) => {
  const scale = displayCurrency === 'INR' ? conversionRate : 1;
  const currencySymbol = displayCurrency === 'INR' ? '₹' : '$';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(displayCurrency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: displayCurrency,
      maximumFractionDigits: 0
    }).format(Math.round(val));
  };

  const serviceStats = useMemo(() => {
    const stats: Record<string, { revenue: number, cost: number }> = {};
    data.forEach(t => {
      if (!stats[t.serviceType]) {
        stats[t.serviceType] = { revenue: 0, cost: 0 };
      }
      stats[t.serviceType].revenue += t.revenue * scale;
      stats[t.serviceType].cost += t.cost * scale;
    });
    return Object.entries(stats).map(([name, val]) => ({
      name,
      revenue: val.revenue,
      cost: val.cost,
      profit: val.revenue - val.cost
    }));
  }, [data, scale]);

  const timelineData = useMemo(() => {
    const startYear = 2025;
    const startMonth = 2; // March (0-indexed)
    
    const months: string[] = [];
    for (let i = 0; i < 9; i++) {
      const d = new Date(startYear, startMonth + i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    return months.map(monthStr => {
      const monthData = data.filter(t => t.date.startsWith(monthStr));
      const revenue = monthData.reduce((acc, t) => acc + t.revenue, 0) * scale;
      const cost = monthData.reduce((acc, t) => acc + t.cost, 0) * scale;
      const profit = revenue - cost;
      
      const dateObj = new Date(monthStr + "-01");
      const label = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' });

      // Identify top and bottom services for this month
      const servicePerformance: Record<string, number> = {};
      monthData.forEach(t => {
        servicePerformance[t.serviceType] = (servicePerformance[t.serviceType] || 0) + (t.revenue - t.cost) * scale;
      });

      const performanceEntries = Object.entries(servicePerformance);
      const topService = performanceEntries.length > 0 
        ? performanceEntries.reduce((a, b) => (a[1] > b[1] ? a : b)) 
        : null;
      const bottomService = performanceEntries.length > 0 
        ? performanceEntries.reduce((a, b) => (a[1] < b[1] ? a : b)) 
        : null;

      return {
        label,
        revenue,
        cost,
        profit,
        monthStr,
        topService: topService ? { name: topService[0], value: topService[1] } : null,
        bottomService: bottomService ? { name: bottomService[0], value: bottomService[1] } : null
      };
    });
  }, [data, scale]);

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${currencySymbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${currencySymbol}${(value / 1000).toFixed(0)}K`;
    return `${currencySymbol}${value}`;
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pData = payload[0].payload;
      return (
        <div className="bg-white p-8 border border-slate-100 shadow-2xl rounded-[2.5rem] min-w-[320px]">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-[0.3em]">{label} Performance Drilldown</p>
          <div className="space-y-6">
            <div className="border-b border-slate-50 pb-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Gross Revenue</span>
                <span className="text-sm font-bold text-indigo-600">{formatCurrency(pData.revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Total Cost</span>
                <span className="text-sm font-bold text-rose-500">{formatCurrency(pData.cost)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                <span className="text-xs font-black text-slate-500 uppercase">Net Operating Profit</span>
                <span className="text-xl font-black text-emerald-600">{formatCurrency(pData.profit)}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.5)]"></div>
                <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Profit Driver</div>
              </div>
              <div className="flex justify-between items-center pl-6">
                <span className="text-base font-black text-slate-900">{pData.topService?.name}</span>
                <span className="text-base font-bold text-slate-500">{formatCurrency(pData.topService?.value)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"></div>
                <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency Lag</div>
              </div>
              <div className="flex justify-between items-center pl-6">
                <span className="text-base font-black text-slate-900">{pData.bottomService?.name}</span>
                <span className="text-base font-bold text-slate-500">{formatCurrency(pData.bottomService?.value)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12">
      {/* Monthly Financial Audit Table */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-12 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Market Intelligence: Financial Audit</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">Ledger Segment: 2025 Calendar Year Synthesis</p>
          </div>
          <div className="flex items-center space-x-4 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Active Market Intelligence Feedback</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-12 py-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Fiscal Segment</th>
                <th className="px-12 py-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Gross Revenue</th>
                <th className="px-12 py-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Overhead Cost</th>
                <th className="px-12 py-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Net Contribution</th>
                <th className="px-12 py-6 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Yield Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {timelineData.map((row, i) => {
                const yieldPct = ((row.profit / row.revenue) * 100).toFixed(1);
                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-12 py-8">
                      <span className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{row.label}</span>
                    </td>
                    <td className="px-12 py-8">
                      <span className="text-base font-bold text-slate-700">{formatCurrency(row.revenue)}</span>
                    </td>
                    <td className="px-12 py-8">
                      <span className="text-base font-bold text-rose-500/70">{formatCurrency(row.cost)}</span>
                    </td>
                    <td className="px-12 py-8">
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-black text-emerald-600">{formatCurrency(row.profit)}</span>
                        <div className={`flex items-center justify-center w-6 h-6 rounded-lg ${row.profit >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                          <i className={`fas fa-caret-up text-xs ${row.profit < 0 ? 'rotate-180' : ''}`}></i>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-8 text-right">
                      <div className="inline-flex items-center space-x-3 px-6 py-2 rounded-2xl bg-slate-100 text-[12px] font-black text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <span>{yieldPct}%</span>
                        <i className="fas fa-chart-line text-[10px] opacity-40"></i>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal Usage vs Demand Visual */}
      {analysis?.usageVsDemand && (
        <div className="bg-white p-14 rounded-[4rem] shadow-sm border border-slate-100 h-[550px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <i className="fas fa-umbrella-beach text-[200px] -rotate-12"></i>
          </div>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] flex items-center">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-5 shadow-[0_0_15px_rgba(79,70,229,0.6)]"></div>
                Market Intelligence: Seasonal Demand Analysis
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Localized Market Opportunity Analysis (2025 Baseline)</p>
            </div>
            <div className="flex space-x-10 mt-6 lg:mt-0">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-lg bg-slate-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Demand Index</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-lg bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Actual Utilization</span>
              </div>
            </div>
          </div>
          <div className="flex-1 h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analysis.usageVsDemand} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="service" fontSize={12} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                <YAxis domain={[0, 100]} hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.15)', padding: '24px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="marketDemand" name="Market Potential" fill="#f1f5f9" radius={[10, 10, 0, 0]} barSize={50} />
                <Line type="monotone" dataKey="actualUsage" name="Service Usage Rate" stroke="#10b981" strokeWidth={6} dot={{ r: 8, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 12, fill: '#10b981' }} animationDuration={2000} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 h-[550px] flex flex-col">
          <h3 className="text-xs font-black mb-12 text-slate-900 uppercase tracking-[0.4em] flex items-center">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-5 shadow-[0_0_15px_rgba(79,70,229,0.6)]"></div>
            Market Intelligence: Revenue Composition
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceStats} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 800 }} />
                <YAxis tickFormatter={formatYAxis} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }}>
                   <Label value={`Value (${currencySymbol})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }} offset={10} />
                </YAxis>
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(val: number) => [formatCurrency(val), 'Volume']}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 30px 60px rgba(0,0,0,0.1)', padding: '24px' }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '30px' }} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[10, 10, 0, 0]} name="Gross Revenue" barSize={36} animationDuration={1500} />
                <Bar dataKey="cost" fill="#f1f5f9" radius={[10, 10, 0, 0]} name="Operational Overhead" barSize={36} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 h-[550px] flex flex-col">
          <h3 className="text-xs font-black mb-12 text-slate-900 uppercase tracking-[0.4em] flex items-center">
            <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-5 shadow-[0_0_15px_rgba(79,70,229,0.6)]"></div>
            Market Intelligence: Contribution Synthesis
          </h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceStats}
                  dataKey="profit"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={140}
                  paddingAngle={12}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  fontSize={10}
                  stroke="none"
                >
                  {serviceStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => [formatCurrency(val), 'Net Contribution']} />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-14 rounded-[4rem] shadow-sm border border-slate-100 h-[600px] lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.4em] flex items-center">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mr-5 shadow-[0_0_15px_rgba(79,70,229,0.6)]"></div>
                Market Intelligence: 9-Month Performance Matrix
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Hover periods for high/low efficiency diagnostics</p>
            </div>
            <div className="flex space-x-12">
              <div className="flex items-center space-x-4">
                <div className="w-5 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Alpha Revenue</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-5 h-2 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Overhead Exposure</span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 10, right: 40, left: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" fontSize={12} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                <YAxis tickFormatter={formatYAxis} fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }}>
                   <Label value={`Value (${currencySymbol})`} angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }} offset={5} />
                </YAxis>
                <Tooltip content={<CustomLineTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  strokeWidth={7} 
                  dot={{ r: 9, fill: '#4f46e5', strokeWidth: 5, stroke: '#fff' }} 
                  activeDot={{ r: 12, fill: '#4f46e5', strokeWidth: 0 }}
                  name="Revenue Stream" 
                  animationDuration={3000}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#ef4444" 
                  strokeWidth={5} 
                  strokeDasharray="10 10"
                  dot={{ r: 6, fill: '#ef4444', strokeWidth: 4, stroke: '#fff' }} 
                  activeDot={{ r: 10, fill: '#ef4444' }}
                  name="Direct Costs" 
                  animationDuration={3000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
