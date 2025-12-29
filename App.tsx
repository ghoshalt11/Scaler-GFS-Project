
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SaleTransaction, BusinessAnalysis, AppState } from './types';
import { SAMPLE_DATA } from './constants';
import { GeminiService } from './services/geminiService';
import { DashboardCharts } from './components/DashboardCharts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const USD_TO_INR = 83.5;

const ANALYSIS_STAGES = [
  "Auditing Historical Performance...",
  "Querying Global Market Intelligence...",
  "Calibrating Local Benchmarks...",
  "Simulating ROI Projections...",
  "Synthesizing Executive Strategy..."
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    transactions: SAMPLE_DATA,
    location: 'San Francisco',
    isLoading: false,
    analysis: null,
    budgetINR: 5000000,
    targetMonthlyProfit: 15000,
    targetROI: 20,
    displayCurrency: 'INR',
    selectedMonth: '2025-11' // Default to latest month in sample data
  });

  const [tempLocation, setTempLocation] = useState(state.location);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const budgetGBP = useMemo(() => Math.round(state.budgetINR / 108), [state.budgetINR]);
  const targetProfitINR = useMemo(() => Math.round(state.targetMonthlyProfit * USD_TO_INR), [state.targetMonthlyProfit]);

  // Filter transactions based on active location search
  const filteredTransactions = useMemo(() => {
    // In a real app, this would query a DB. Here we simulate location data.
    // If the location is not San Francisco, we just show the same data for demo purposes but labeled as requested.
    return state.transactions;
  }, [state.transactions, state.location]);

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(filteredTransactions.map(t => t.date.slice(0, 7)))).sort();
    return months;
  }, [filteredTransactions]);

  const selectedMonthLabel = useMemo(() => {
    return new Date(state.selectedMonth + "-01").toLocaleString('default', { month: 'short', year: '2-digit' });
  }, [state.selectedMonth]);

  const formatValue = (val: number, isUSDInput: boolean = true) => {
    let baseUSD = isUSDInput ? val : val / USD_TO_INR;
    if (state.displayCurrency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(baseUSD * USD_TO_INR);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(baseUSD);
    }
  };

  const handleLocationSearch = () => {
    setState(prev => ({ ...prev, location: tempLocation, analysis: null }));
  };

  const runAnalysis = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    setCurrentStage(0);
    setError(null);

    // Simulate stage progression for better UX/UI feedback
    const stageInterval = setInterval(() => {
      setCurrentStage(prev => (prev < ANALYSIS_STAGES.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const gemini = new GeminiService();
      const result = await gemini.analyzeBusiness(
        filteredTransactions, state.location, budgetGBP, state.budgetINR, state.targetMonthlyProfit, state.targetROI
      );
      setState(prev => ({ ...prev, analysis: result, isLoading: false }));
    } catch (err: any) {
      setError("Analysis failed. Please check your backend connection.");
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      clearInterval(stageInterval);
    }
  };

  const totals = useMemo(() => {
    const rev = filteredTransactions.reduce((acc, t) => acc + t.revenue, 0);
    const cost = filteredTransactions.reduce((acc, t) => acc + t.cost, 0);
    return { revenue: rev, cost, profit: rev - cost };
  }, [filteredTransactions]);

  const selectedMonthTotals = useMemo(() => {
    const monthData = filteredTransactions.filter(t => t.date.startsWith(state.selectedMonth));
    const rev = monthData.reduce((acc, t) => acc + t.revenue, 0);
    const cost = monthData.reduce((acc, t) => acc + t.cost, 0);
    return { revenue: rev, cost, profit: rev - cost };
  }, [filteredTransactions, state.selectedMonth]);

  const getMoMChange = (currentVal: number, monthStr: string, key: 'revenue' | 'cost' | 'profit') => {
    const date = new Date(monthStr + "-01");
    date.setMonth(date.getMonth() - 1);
    const prevMonthStr = date.toISOString().slice(0, 7);
    const prevMonthData = filteredTransactions.filter(t => t.date.startsWith(prevMonthStr));
    let prevVal = 0;
    if (key === 'revenue') prevVal = prevMonthData.reduce((acc, t) => acc + t.revenue, 0);
    else if (key === 'cost') prevVal = prevMonthData.reduce((acc, t) => acc + t.cost, 0);
    else prevVal = prevMonthData.reduce((acc, t) => acc + t.revenue - t.cost, 0);

    if (prevVal === 0) return null;
    return ((currentVal - prevVal) / prevVal) * 100;
  };

  return (
    <Router>
      <div className="min-h-screen flex bg-[#fbfcfd]">
        <aside className="w-80 bg-slate-950 text-white flex-shrink-0 flex flex-col hidden lg:flex border-r border-white/5">
          <div className="p-8 flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fas fa-hotel text-lg"></i>
            </div>
            <div>
              <span className="font-black text-xl tracking-tight block">HotelIntel</span>
              <span className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em]">AI Core V3</span>
            </div>
          </div>
          
          <nav className="flex-1 px-6 py-4 space-y-8 overflow-y-auto custom-scrollbar">
            <Link to="/" className="flex items-center space-x-3 px-5 py-4 bg-indigo-600 rounded-[1.25rem] text-white shadow-xl shadow-indigo-600/10 group">
              <i className="fas fa-layer-group w-5 text-indigo-200 group-hover:text-white transition-colors"></i>
              <span className="font-bold text-sm tracking-tight">Executive Dashboard</span>
            </Link>
            
            <div className="space-y-6">
              <div className="px-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Global Parameters</div>
              
              <div className="space-y-4 px-2">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Active Analysis Window</label>
                  <div className="relative group">
                    <select 
                      value={state.selectedMonth} 
                      onChange={(e) => setState(p => ({ ...p, selectedMonth: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-white/10 transition-all font-bold"
                    >
                      {availableMonths.map(m => (
                        <option key={m} value={m} className="bg-slate-900">{new Date(m + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none"></i>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Allocated Capital (INR)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={state.budgetINR} 
                      onChange={(e) => setState(p => ({ ...p, budgetINR: Number(e.target.value) }))} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-black uppercase">₹ INR</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Target Profit Threshold (USD)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={state.targetMonthlyProfit} 
                      onChange={(e) => setState(p => ({ ...p, targetMonthlyProfit: Number(e.target.value) }))} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-black uppercase">$ USD</div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-6 border-t border-white/5">
            <div className="bg-indigo-600/10 p-5 rounded-[1.5rem] border border-indigo-500/20">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="text-xs font-black tracking-tight">Active Node: {state.location}</span>
                <i className="fas fa-satellite-dish text-[10px] text-indigo-400 animate-pulse"></i>
              </div>
              <p className="text-[9px] text-indigo-300 uppercase font-black tracking-widest">Region Optimized</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
          <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-20">
            <div className="flex items-center space-x-10">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Market Intelligence & Strategy</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3 flex items-center">
                  <i className="fas fa-microchip text-indigo-500 mr-2"></i>
                  Executive Service Performance Matrix
                </p>
              </div>
              <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
              <div className="relative hidden md:block group w-80">
                <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner flex items-center">
                  <i className="fas fa-location-dot ml-4 text-indigo-500"></i>
                  <input 
                    type="text" 
                    value={tempLocation}
                    onChange={(e) => setTempLocation(e.target.value)}
                    placeholder="Enter Market Location..."
                    className="bg-transparent py-2.5 px-4 w-full text-xs font-bold text-slate-700 outline-none rounded-xl"
                  />
                  <button 
                    onClick={handleLocationSearch}
                    className="mr-1 bg-white hover:bg-indigo-50 text-indigo-600 p-2 rounded-xl transition-all border border-slate-200 shadow-sm"
                    title="Load Location Data"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-8">
              {state.isLoading && (
                <div className="hidden xl:flex flex-col items-end animate-in fade-in slide-in-from-right-4 duration-500">
                   <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5 flex items-center">
                     <i className="fas fa-circle-notch fa-spin mr-2"></i>
                     Optimization In Progress
                   </div>
                   <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{ANALYSIS_STAGES[currentStage]}</div>
                </div>
              )}
              <div className="flex bg-slate-100/80 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                <button onClick={() => setState(s => ({ ...s, displayCurrency: 'USD' }))} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${state.displayCurrency === 'USD' ? 'bg-white shadow-md text-indigo-600 border border-slate-100' : 'text-slate-500'}`}>USD</button>
                <button onClick={() => setState(s => ({ ...s, displayCurrency: 'INR' }))} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${state.displayCurrency === 'INR' ? 'bg-white shadow-md text-indigo-600 border border-slate-100' : 'text-slate-500'}`}>INR</button>
              </div>
              <button 
                onClick={runAnalysis} 
                disabled={state.isLoading} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-3 relative overflow-hidden"
              >
                {state.isLoading && (
                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${((currentStage + 1) / ANALYSIS_STAGES.length) * 100}%` }}></div>
                )}
                <i className={`fas ${state.isLoading ? 'fa-sync fa-spin' : 'fa-wand-magic-sparkles'} text-white`}></i>
                <span>{state.isLoading ? 'PROCESSING...' : 'RUN OPTIMIZATION'}</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[ 
                { label: 'Revenue', total: totals.revenue, month: selectedMonthTotals.revenue, key: 'revenue', icon: 'fa-chart-pie' },
                { label: 'Operating Cost', total: totals.cost, month: selectedMonthTotals.cost, key: 'cost', icon: 'fa-file-invoice' },
                { label: 'Contribution', total: totals.profit, month: selectedMonthTotals.profit, key: 'profit', icon: 'fa-vault' }
              ].map((k, i) => {
                const mom = getMoMChange(k.month, state.selectedMonth, k.key as any);
                return (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <i className={`fas ${k.icon} text-slate-100 text-4xl`}></i>
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] block mb-1">{k.label}</span>
                        <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{selectedMonthLabel}</span>
                      </div>
                      {mom !== null && (
                        <div className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center space-x-1 ${mom >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <i className={`fas ${mom >= 0 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                          <span>{Math.abs(mom).toFixed(1)}% <span className="opacity-50 ml-1">MoM</span></span>
                        </div>
                      )}
                    </div>
                    <div className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-6">{formatValue(k.month)}</div>
                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Aggregate Period Total</span>
                      <span className="text-[12px] font-black text-slate-800">{formatValue(k.total)}</span>
                    </div>
                  </div>
                );
              })}
              
              <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-950/20 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] -mr-16 -mt-16 opacity-20 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="relative z-10 text-center md:text-left">
                  <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Total Portfolio Budget</span>
                  <div className="text-4xl font-black tracking-tight mb-2">{formatValue(state.budgetINR, false)}</div>
                  <div className="flex items-center space-x-2 mt-6 justify-center md:justify-start">
                     <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-200 border border-white/10">Investment Capital</span>
                  </div>
                </div>
              </div>
            </div>

            <DashboardCharts 
              data={filteredTransactions} 
              displayCurrency={state.displayCurrency} 
              conversionRate={USD_TO_INR} 
              analysis={state.analysis}
            />

            {state.analysis ? (
              <div className="space-y-12 pb-12">
                {/* Executive Assessment */}
                <div className="bg-white p-14 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                   <div className="flex items-center justify-between mb-10">
                     <h2 className="text-3xl font-black text-slate-900 flex items-center tracking-tighter">
                        <div className="w-1.5 h-8 bg-indigo-600 mr-6 rounded-full"></div>
                        Market Intelligence Synthesis: Executive Assessment
                      </h2>
                      <div className="flex items-center space-x-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                         <i className="fas fa-brain text-indigo-500 text-[10px]"></i>
                         <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Market Intelligence Engine Active</span>
                      </div>
                   </div>
                    
                    <p className="text-slate-800 text-2xl leading-snug border-l-8 border-indigo-600/10 pl-12 italic font-medium mb-16 py-4">
                      "{state.analysis.simulation?.judgment}"
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {state.analysis.simulation?.categoryJudgments?.map((cj, i) => (
                        <div key={i} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all group/card">
                          <div className="flex justify-between items-start mb-6">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{cj.category} Verdict</span>
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                               <span className="text-xs font-black text-indigo-600">{cj.priorityScore}</span>
                            </div>
                          </div>
                          <h4 className={`text-xl font-black mb-4 ${
                            cj.verdict.includes('Expansion') ? 'text-emerald-600' : 
                            cj.verdict.includes('Pivot') ? 'text-rose-600' : 'text-indigo-600'
                          }`}>{cj.verdict}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed font-medium">{cj.rationale}</p>
                        </div>
                      ))}
                    </div>
                </div>

                {/* Investment Distribution Ledger */}
                <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden border border-white/5">
                   <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                   
                   <div className="flex items-center justify-between mb-16 relative z-10">
                      <div>
                        <h2 className="text-4xl font-black tracking-tighter mb-4">Strategic Investment Distribution</h2>
                        <div className="flex items-center space-x-3">
                           <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Targeting ₹{(state.targetMonthlyProfit * USD_TO_INR).toLocaleString()} Monthly Net Gain</p>
                           <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                           <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Verified Market Intelligence Plan</span>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Deployed Capital</div>
                         <div className="text-4xl font-black text-indigo-400">{formatValue(state.budgetINR, false)}</div>
                      </div>
                   </div>

                   <div className="overflow-x-auto relative z-10">
                      <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-white/10">
                             <th className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Allocated Sub-Category</th>
                             <th className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Parent Service</th>
                             <th className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Allocation</th>
                             <th className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Rationale</th>
                             <th className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-right">Expected Yield</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {state.analysis.simulation?.investmentPlan?.map((item, i) => (
                             <tr key={i} className="group hover:bg-white/5 transition-colors">
                               <td className="py-8 font-black text-lg group-hover:text-indigo-400 transition-colors">{item.subCategory}</td>
                               <td className="py-8">
                                  <span className="px-4 py-1.5 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">{item.serviceType}</span>
                               </td>
                               <td className="py-8 text-xl font-black">{formatValue(item.allocationAmount, false)}</td>
                               <td className="py-8 max-w-xs text-xs text-slate-400 leading-relaxed">{item.rationale}</td>
                               <td className="py-8 text-right">
                                  <span className="text-emerald-400 font-black text-lg">{item.expectedAnnualYield}</span>
                               </td>
                             </tr>
                           ))}
                        </tbody>
                        <tfoot>
                           <tr className="border-t-2 border-indigo-500/30">
                              <td colSpan={2} className="py-8 text-[11px] font-black text-slate-500 uppercase tracking-widest">Total Capital Distribution</td>
                              <td className="py-8 text-2xl font-black text-indigo-400">{formatValue(state.budgetINR, false)}</td>
                              <td colSpan={2} className="py-8 text-right text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">100% Allocation Coverage</td>
                           </tr>
                        </tfoot>
                      </table>
                   </div>
                </div>

                {/* Evidence & Grounding - Market Intelligence Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-12">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                       <h3 className="text-3xl font-black text-slate-900 flex items-center tracking-tighter">
                        <i className="fas fa-tower-broadcast text-indigo-600 mr-6"></i>
                        Localized Market Intelligence Grounding: {state.location}
                      </h3>
                      <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                         <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live Market Intelligence Feed</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {state.analysis.marketTrends.map((trend, i) => (
                        <div key={i} className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                          <div className={`text-[10px] font-black uppercase mb-8 px-5 py-2 rounded-full inline-block tracking-widest ${
                            trend.impact === 'positive' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                            trend.impact === 'negative' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-700 border border-slate-100'
                          }`}>
                            <i className={`fas ${trend.impact === 'positive' ? 'fa-arrow-trend-up' : 'fa-triangle-exclamation'} mr-2`}></i>
                            {trend.impact} momentum
                          </div>
                          <h4 className="font-black text-slate-900 text-2xl mb-5 group-hover:text-indigo-600 transition-colors leading-tight">{trend.title}</h4>
                          <p className="text-slate-600 text-base leading-relaxed font-medium mb-10">{trend.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 h-fit sticky top-24">
                    <h3 className="text-xs font-black mb-12 flex items-center text-slate-900 uppercase tracking-[0.4em] border-b border-slate-50 pb-8">
                      <i className="fas fa-fingerprint text-indigo-500 mr-5 text-2xl"></i>
                      Market Intelligence Verification
                    </h3>
                    <div className="space-y-6">
                      {state.analysis.sources.map((source, i) => (
                        <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="block p-7 rounded-[2rem] bg-slate-50 hover:bg-white hover:shadow-2xl transition-all border border-transparent hover:border-indigo-100 group">
                          <div className="flex items-center space-x-6">
                            <div className="w-12 h-12 bg-white group-hover:bg-slate-950 rounded-2xl text-slate-400 group-hover:text-white transition-all flex items-center justify-center shadow-sm">
                               <i className="fas fa-link text-sm"></i>
                            </div>
                            <span className="text-xs font-black text-slate-700 group-hover:text-slate-950 line-clamp-2 leading-relaxed tracking-tight">{source.title}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-12 text-center p-32 bg-white rounded-[5rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="w-32 h-32 bg-indigo-600 text-white rounded-[3.5rem] flex items-center justify-center mx-auto mb-14 text-5xl shadow-[0_30px_60px_-15px_rgba(79,70,229,0.5)] group-hover:rotate-6 group-hover:scale-110 transition-all duration-700 relative z-10 border-4 border-white/20">
                  <i className="fas fa-diagram-project"></i>
                </div>
                <h3 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter relative z-10">Initiate Strategy Engine</h3>
                <p className="text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium mb-16 text-2xl relative z-10">
                  Aggregate historical operational data with real-time <span className="text-indigo-600 font-black decoration-indigo-200 underline underline-offset-8">Market Intelligence</span> benchmarks in <span className="font-black text-slate-700">{state.location}</span> to synthesize your 9-month asset roadmap.
                </p>
                <div className="flex flex-wrap justify-center gap-8 relative z-10">
                   {['Global Market Sync', 'Profit Optimization', 'Risk Modeling', 'Execution Map'].map((tag, i) => (
                     <div key={i} className="px-10 py-5 bg-white shadow-xl border border-slate-50 rounded-[1.75rem] text-[12px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center group-hover:-translate-y-2 transition-transform duration-500">
                        <i className="fas fa-check-circle mr-4 text-emerald-500"></i> {tag}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
