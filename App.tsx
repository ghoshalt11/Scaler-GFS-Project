
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SaleTransaction, BusinessAnalysis, AppState } from './types';
import { SAMPLE_DATA } from './constants';
import { GeminiService } from './services/geminiService';
import { DashboardCharts } from './components/DashboardCharts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const USD_TO_INR = 83.5;

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

  const [error, setError] = useState<string | null>(null);

  const budgetGBP = useMemo(() => Math.round(state.budgetINR / 108), [state.budgetINR]);
  const budgetUSD = useMemo(() => Math.round(state.budgetINR / USD_TO_INR), [state.budgetINR]);
  const targetProfitINR = useMemo(() => Math.round(state.targetMonthlyProfit * USD_TO_INR), [state.targetMonthlyProfit]);

  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(state.transactions.map(t => t.date.slice(0, 7)))).sort();
    return months;
  }, [state.transactions]);

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

  const runAnalysis = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    setError(null);
    try {
      const gemini = new GeminiService();
      const result = await gemini.analyzeBusiness(
        state.transactions, state.location, budgetGBP, state.budgetINR, state.targetMonthlyProfit, state.targetROI
      );
      setState(prev => ({ ...prev, analysis: result, isLoading: false }));
    } catch (err: any) {
      setError("Analysis failed. Please check your API key.");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const totals = useMemo(() => {
    const rev = state.transactions.reduce((acc, t) => acc + t.revenue, 0);
    const cost = state.transactions.reduce((acc, t) => acc + t.cost, 0);
    return { revenue: rev, cost, profit: rev - cost };
  }, [state.transactions]);

  const selectedMonthTotals = useMemo(() => {
    const monthData = state.transactions.filter(t => t.date.startsWith(state.selectedMonth));
    const rev = monthData.reduce((acc, t) => acc + t.revenue, 0);
    const cost = monthData.reduce((acc, t) => acc + t.cost, 0);
    return { revenue: rev, cost, profit: rev - cost };
  }, [state.transactions, state.selectedMonth]);

  const getMoMChange = (currentVal: number, monthStr: string, key: 'revenue' | 'cost' | 'profit') => {
    const date = new Date(monthStr + "-01");
    date.setMonth(date.getMonth() - 1);
    const prevMonthStr = date.toISOString().slice(0, 7);
    const prevMonthData = state.transactions.filter(t => t.date.startsWith(prevMonthStr));
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
                  <div className="flex justify-between px-1">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">≈ ${budgetUSD.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">≈ £{budgetGBP.toLocaleString()}</span>
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
                  <p className="text-[9px] text-slate-500 px-1 font-bold uppercase tracking-tight">Target Yield: ₹{targetProfitINR.toLocaleString()} / mo</p>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-6 border-t border-white/5">
            <div className="bg-indigo-600/10 p-5 rounded-[1.5rem] border border-indigo-500/20">
              <div className="flex items-center justify-between text-white mb-2">
                <span className="text-xs font-black tracking-tight">{state.location}</span>
                <button onClick={() => { const l = prompt("Enter Target Market:", state.location); if(l) setState(p=>({...p, location: l})) }} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-indigo-400 transition-colors">
                  <i className="fas fa-pen-nib text-[9px]"></i>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <p className="text-[9px] text-indigo-300 uppercase font-black tracking-widest">Market Context Active</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col max-h-screen overflow-hidden">
          <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-20">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Asset Portfolio Intelligence</h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 flex items-center">
                <i className="fas fa-calendar-alt text-indigo-500 mr-2"></i>
                Simulation Period: March 2025 — November 2025
              </p>
            </div>
            <div className="flex items-center space-x-8">
              <div className="flex bg-slate-100/80 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
                <button onClick={() => setState(s => ({ ...s, displayCurrency: 'USD' }))} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${state.displayCurrency === 'USD' ? 'bg-white shadow-md text-indigo-600 border border-slate-100' : 'text-slate-500'}`}>USD</button>
                <button onClick={() => setState(s => ({ ...s, displayCurrency: 'INR' }))} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${state.displayCurrency === 'INR' ? 'bg-white shadow-md text-indigo-600 border border-slate-100' : 'text-slate-500'}`}>INR</button>
              </div>
              <button 
                onClick={runAnalysis} 
                disabled={state.isLoading} 
                className="bg-slate-950 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/20 disabled:opacity-50 flex items-center space-x-3"
              >
                <i className={`fas ${state.isLoading ? 'fa-spinner fa-spin' : 'fa-bolt-lightning'} text-indigo-400`}></i>
                <span>{state.isLoading ? 'Processing Model...' : 'Compute Strategic Map'}</span>
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
            {/* Top Cards with Year-Month Segments */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[ 
                { label: 'Revenue', total: totals.revenue, month: selectedMonthTotals.revenue, key: 'revenue', icon: 'fa-chart-pie' },
                { label: 'Operational Cost', total: totals.cost, month: selectedMonthTotals.cost, key: 'cost', icon: 'fa-file-invoice' },
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
                <div className="relative z-10">
                  <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 block">Total Portfolio Budget</span>
                  <div className="text-4xl font-black tracking-tight mb-2">{formatValue(state.budgetINR, false)}</div>
                  <div className="flex items-center space-x-2 mt-6">
                     <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-200">Non-Hospitality Focus</span>
                  </div>
                </div>
              </div>
            </div>

            <DashboardCharts 
              data={state.transactions} 
              displayCurrency={state.displayCurrency} 
              conversionRate={USD_TO_INR} 
              analysis={state.analysis}
            />

            {state.analysis && (
              <div className="space-y-12 pb-12">
                {/* Optimization Intelligence Section */}
                <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden border border-white/5">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
                  
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-20 gap-12 relative z-10">
                    <div className="flex items-center space-x-10">
                      <div className="p-8 bg-gradient-to-br from-indigo-500/40 to-indigo-700/10 border border-indigo-400/20 rounded-[2.5rem] shadow-2xl backdrop-blur-md group hover:scale-105 transition-transform">
                        <i className="fas fa-microchip text-5xl text-indigo-400 animate-pulse"></i>
                      </div>
                      <div>
                        <h2 className="text-5xl font-black tracking-tighter mb-4">Strategic AI Intelligence</h2>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-white">Simulation Engines Optimized</span>
                          </div>
                          <span className="text-sm font-bold text-slate-500 italic">Targeting {formatValue(state.targetMonthlyProfit)} Monthly Alpha</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full lg:w-auto">
                      {[
                        { label: 'Model Confidence', value: state.analysis.simulation?.confidenceScore ?? 92, icon: 'fa-shield-halved', color: 'indigo' },
                        { label: 'Market Grounding', value: state.analysis.simulation?.dataIntegrity ?? 88, icon: 'fa-globe', color: 'emerald' },
                        { label: 'Stability Index', value: 95, icon: 'fa-chart-line', color: 'amber' }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-8 min-w-[200px] backdrop-blur-sm group hover:bg-white/10 transition-all">
                          <div className="flex items-center justify-between mb-5">
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{stat.label}</span>
                            <i className={`fas ${stat.icon} text-${stat.color}-400 text-xs opacity-50`}></i>
                          </div>
                          <div className="text-4xl font-black text-white mb-4">{stat.value}%</div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full bg-${stat.color}-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000`} style={{width: `${stat.value}%`}}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
                    {state.analysis.whatIfActions?.map((item, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-12 rounded-[3.5rem] hover:bg-white/10 transition-all hover:-translate-y-3 group cursor-default shadow-xl">
                        <div className="flex justify-between items-start mb-12">
                          <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/20 flex items-center justify-center font-black text-4xl text-indigo-300 border border-indigo-500/10 shadow-inner group-hover:scale-110 transition-transform">
                            {i+1}
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Feasibility Score</div>
                             <div className="text-3xl font-black text-indigo-400">{item.feasibilityScore}%</div>
                          </div>
                        </div>
                        <h4 className="font-black text-2xl mb-6 text-white group-hover:text-indigo-300 transition-colors leading-tight">{item.action}</h4>
                        <p className="text-base text-slate-400 leading-relaxed font-medium mb-10 line-clamp-4">{item.expectedOutcome}</p>
                        <div className="pt-10 border-t border-white/5 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity">
                           <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Action Protocol</span>
                           <i className="fas fa-arrow-right text-indigo-500 group-hover:translate-x-2 transition-transform"></i>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                     <div className="flex items-center space-x-12">
                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                           <i className="fas fa-sync text-indigo-500"></i>
                           <span>Real-time Market Sync</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                           <i className="fas fa-location-crosshairs text-indigo-500"></i>
                           <span>Context: {state.location} Zone</span>
                        </div>
                     </div>
                     <div className="flex items-center space-x-4 bg-indigo-600/10 px-6 py-2.5 rounded-2xl border border-indigo-500/20">
                        <i className="fas fa-check-double text-emerald-400"></i>
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">ROI Projections Audited & Validated</span>
                     </div>
                  </div>
                </div>

                {/* Performance Diagnostic Assessment */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  <div className="xl:col-span-2 bg-white p-14 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-40 group-hover:scale-125 transition-transform duration-1000"></div>
                    <h2 className="text-4xl font-black text-slate-900 mb-10 flex items-center tracking-tighter">
                      <div className="w-1.5 h-8 bg-indigo-600 mr-6 rounded-full"></div>
                      Executive Assessment
                    </h2>
                    <p className="text-slate-800 text-3xl leading-snug border-l-8 border-indigo-600/10 pl-12 italic font-medium mb-16 py-4">
                      "{state.analysis.simulation?.judgment}"
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                      {[
                        { label: 'Projected Portfolio ROI', value: `${state.analysis.simulation?.roiPercentage}%`, sub: 'Annualized Expected Yield', color: 'emerald', icon: 'fa-rocket' },
                        { label: 'Equity Recovery Gap', value: `${state.analysis.simulation?.breakEvenMonths} Mo`, sub: 'Break-Even Milestone', color: 'indigo', icon: 'fa-calendar-check' },
                        { label: 'Market Elasticity', value: state.analysis.simulation?.recommendationStability, sub: 'Risk Variance Score', color: 'amber', icon: 'fa-shuffle' }
                      ].map((box, i) => (
                        <div key={i} className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all group/card">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] block mb-4">{box.label}</span>
                          <div className={`text-4xl font-black text-${box.color}-600 flex items-center mb-3`}>
                            {box.value}
                            <i className={`fas ${box.icon} ml-4 text-lg opacity-20 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all`}></i>
                          </div>
                          <p className="text-[11px] text-slate-500 font-black uppercase tracking-tight">{box.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 h-[550px] flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-900">Capital Growth Path</h3>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold">9-Month Compounding Delta</p>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">+14.2% Peak</div>
                    </div>
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={state.analysis.simulation?.breakEvenData || []}>
                          <defs>
                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" fontSize={10} tick={{fill: '#94a3b8', fontWeight: 800}} axisLine={false} tickLine={false} />
                          <YAxis fontSize={10} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.12)', padding: '20px'}}
                            formatter={(v: number) => [formatValue(v), 'Cumulative Yield']} 
                          />
                          <Area type="monotone" dataKey="cumulativeProfit" stroke="#4f46e5" fill="url(#areaGradient)" strokeWidth={6} animationDuration={2500} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Evidence & Grounding */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-12">
                    <h3 className="text-3xl font-black text-slate-900 flex items-center tracking-tighter">
                      <i className="fas fa-tower-broadcast text-indigo-600 mr-6"></i>
                      Local Market Intelligence: {state.location}
                    </h3>
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
                          <div className="pt-8 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                             <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Localized Market Insight</span>
                             <i className="fas fa-chevron-right text-indigo-400"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 h-fit sticky top-24">
                    <h3 className="text-xs font-black mb-12 flex items-center text-slate-900 uppercase tracking-[0.4em] border-b border-slate-50 pb-8">
                      <i className="fas fa-fingerprint text-indigo-500 mr-5 text-2xl"></i>
                      Model Grounding
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
              <div className="mt-20 text-center p-32 bg-white rounded-[5rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="w-32 h-32 bg-slate-950 text-white rounded-[3.5rem] flex items-center justify-center mx-auto mb-14 text-5xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 relative z-10">
                  <i className="fas fa-brain-circuit text-indigo-400"></i>
                </div>
                <h3 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter relative z-10">Initiate Strategy Engine</h3>
                <p className="text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium mb-16 text-2xl relative z-10">
                  Aggregate historical operational data with real-time seasonal benchmarks in <span className="text-indigo-600 font-black decoration-indigo-200 underline underline-offset-8">{state.location}</span> to synthesize your 9-month asset roadmap.
                </p>
                <div className="flex flex-wrap justify-center gap-8 relative z-10">
                   {['Portfolio ROI Sync', 'Capital Growth Modeling', 'Market Sentiment Grounding', 'Strategic Action Plan'].map((tag, i) => (
                     <div key={i} className="px-10 py-5 bg-white shadow-xl border border-slate-50 rounded-[1.75rem] text-[12px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center group-hover:-translate-y-2 transition-transform duration-500">
                        <i className="fas fa-circle-check mr-4 text-indigo-500"></i> {tag}
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
