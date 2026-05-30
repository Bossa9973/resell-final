import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Cpu, 
  Database, 
  Globe, 
  TrendingUp, 
  ExternalLink, 
  Download, 
  Coins, 
  Settings, 
  Server,
  ArrowRight,
  CheckCircle,
  Copy,
  Terminal
} from "lucide-react";
import { motion } from "framer-motion";

export function ResellerHub() {
  const [resellerConfig, setResellerConfig] = useState<any>(null);
  const [markupSlider, setMarkupSlider] = useState<number>(40);
  const [clientsSlider, setClientsSlider] = useState<number>(30);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Read current reseller config from static file or localstorage
    const fetchConfig = async () => {
      try {
        const cached = localStorage.getItem('lumen_reseller_config');
        if (cached) {
          setResellerConfig(JSON.parse(cached));
        } else {
          const response = await fetch('/reseller-panel/config.json');
          if (response.ok) {
            const data = await response.json();
            setResellerConfig(data);
          }
        }
      } catch (err) {
        console.error("[ResellerHub] Failed to fetch reseller config:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();

    // Listen to localstorage updates for live synchronization
    const handleStorageChange = () => {
      const cached = localStorage.getItem('lumen_reseller_config');
      if (cached) {
        setResellerConfig(JSON.parse(cached));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading || !resellerConfig) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-zinc-400">
        <Server className="animate-pulse mr-2" size={20} />
        <span className="text-sm font-mono">Querying Whitelabel Configurations...</span>
      </div>
    );
  }

  // Calculate dynamic average finances
  const plans = resellerConfig.preconfiguredPlans || [];
  const activePlans = plans.filter((p: any) => p.active);
  const avgCost = activePlans.length > 0 
    ? activePlans.reduce((acc: number, p: any) => acc + p.parentCost, 0) / activePlans.length 
    : 5;

  const simulatedMarkupFactor = 1 + (markupSlider / 100);
  const projectedAvgRevenue = avgCost * simulatedMarkupFactor;

  const monthlyCostBytes = avgCost * clientsSlider;
  const monthlyGrossRevenue = projectedAvgRevenue * clientsSlider;
  const netMonthlyProfit = monthlyGrossRevenue - monthlyCostBytes;

  const copyDeployCommand = () => {
    navigator.clipboard.writeText("npx vercel deploy --prod");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 p-6 md:p-8 font-sans bg-[#06080a] text-zinc-100 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden"
    >
      {/* Graphic Ornaments */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-bold tracking-widest font-mono">
              Lumen Whitelabel v2.2
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Reseller Workspace</h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Configure standalone storefront plans, set custom pricing thresholds, adapt nameservers, and copy clean integrations to host your reseller portal on external custom domains.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <a 
            href="/reseller-panel/index.html" 
            target="_blank" 
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition duration-150 shadow-lg shadow-indigo-600/20 glow-button"
          >
            <ExternalLink size={14} />
            <span>Open Standalone Reseller Panel</span>
          </a>
        </div>
      </div>

      {/* Main Overview Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Section (2/3): Sliders & Forecasts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Live Interactive Profit Model */}
          <div className="p-6 bg-[#0b0f14] rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              <span>Yield Forecaster Model</span>
            </h3>

            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-zinc-400">Target Customer Volume</span>
                  <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-lg">
                    {clientsSlider} Accounts
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="500" 
                  value={clientsSlider} 
                  onChange={(e) => setClientsSlider(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-zinc-400">Average Profit Markup</span>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg">
                    {markupSlider}% Markup
                  </span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  value={markupSlider} 
                  onChange={(e) => setMarkupSlider(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                />
              </div>
            </div>

            {/* Calculated Outcome Display Card */}
            <div className="grid grid-cols-3 gap-4 bg-zinc-950/40 p-5 rounded-2xl border border-white/5">
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Wholesale Cost</p>
                <p className="text-sm font-bold text-white">${monthlyCostBytes.toFixed(2)}</p>
              </div>
              <div className="text-center border-x border-white/10 px-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Selling Income</p>
                <p className="text-sm font-bold text-indigo-400">${monthlyGrossRevenue.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold mb-1">Monthly Yield</p>
                <p className="text-sm font-black text-emerald-400">${netMonthlyProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins size={16} className="text-indigo-400" />
              <span>Configured Active Plans ({activePlans.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((p: any) => {
                const isVps = p.type === 'vps';
                return (
                  <div key={p.id} className="p-5 bg-[#0b0f14] rounded-2xl border border-white/5 relative flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-white text-xs">{p.name}</h4>
                        <span className="text-[9px] uppercase font-mono font-bold bg-white/5 text-indigo-400 border border-white/5 px-1.5 py-0.5 rounded mt-1 inline-block">
                          {p.type}
                        </span>
                      </div>
                      <span className="font-mono text-zinc-500 text-[10px]">Cost: ${p.parentCost.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-between items-center mt-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-zinc-500 block">Selling price</span>
                        <span className="font-mono text-white text-xs font-semibold">${p.sellingPrice.toFixed(2)}</span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="text-[10px] text-zinc-500 block">Est. Profit</span>
                        <span className="font-mono text-emerald-400 text-xs font-semibold">
                          +${(p.sellingPrice - p.parentCost).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Section (1/3): Deployment Guide & Whitelabel Details */}
        <div className="space-y-8">
          
          {/* Branded Metadata info */}
          <div className="p-6 bg-[#0b0f14] rounded-3xl border border-white/5 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings size={16} className="text-indigo-400" />
              <span>Storefront Branding</span>
            </h3>

            <div className="space-y-3.5 text-xs text-zinc-400">
              <div className="flex justify-between border-b border-light/5 pb-2">
                <span>Reseller Brand:</span>
                <span className="font-semibold text-white">{resellerConfig.resellerName}</span>
              </div>
              <div className="flex justify-between border-b border-light/5 pb-2">
                <span>Support Mail:</span>
                <span className="font-semibold text-white">{resellerConfig.supportEmail}</span>
              </div>
              <div className="flex justify-between border-b border-light/5 pb-2">
                <span>Preferred Currency:</span>
                <span className="font-semibold text-white uppercase">{resellerConfig.currency}</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 block text-[10px]">Active Nameservers:</span>
                <div className="bg-zinc-950/40 p-2 rounded-xl text-[10px] font-mono border border-white/5 space-y-1">
                  {resellerConfig.customNameservers?.map((ns: string, idx: number) => (
                    <div key={idx} className="flex justify-between text-zinc-300">
                      <span>NS{idx + 1}:</span>
                      <span>{ns}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Deployment Commands Box */}
          <div className="p-6 bg-[#0b0f14] rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal size={16} className="text-indigo-400" />
              <span>External Host Guide</span>
            </h3>
            
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              We generated your entire reseller configuration inside the <code className="text-indigo-400 font-mono text-[10px]">/reseller-panel</code> folder. It includes static configuration layers and dynamic interfaces.
            </p>

            <div className="relative bg-zinc-950 p-3.5 rounded-2xl border border-white/5 font-mono text-[10px] text-zinc-300">
              <span className="text-zinc-500 block text-[9px] mb-1.5">RUN THIS IN /reseller-panel:</span>
              <code>npx vercel deploy --prod</code>
              <button 
                onClick={copyDeployCommand} 
                className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white transition"
                title="Copy deploy command"
              >
                {copiedCode ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal">
              Copy command or Drag-and-Drop the <code className="text-zinc-400 font-mono">/reseller-panel</code> folder directly into <b>Netlify Drop</b> to host for free on any custom domain.
            </p>
          </div>

        </div>

      </div>

    </motion.div>
  );
}
