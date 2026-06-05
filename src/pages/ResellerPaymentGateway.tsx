import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Clock, 
  Copy, 
  Check, 
  AlertCircle, 
  Wallet, 
  Coins, 
  Bitcoin, 
  Sparkles, 
  Gem, 
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CryptoLink {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  amountUsd: number;
  cryptoType: string;
  cryptoAddress: string;
  cryptocurrencyAmount: number;
  status: 'pending' | 'completed';
  txHash?: string;
  createdAt: string;
}

export default function ResellerPaymentGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentInvoiceId = searchParams.get("id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<CryptoLink | null>(null);

  const [countdown, setCountdown] = useState<number>(15 * 60);
  const [faucetLoading, setFaucetLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Custom reseller brand branding extracted from cache
  const [brandName, setBrandName] = useState<string>("Lumen Host Billing");
  const [brandEmail, setBrandEmail] = useState<string>("support@lumenhost.pro");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load whitelabel brand parameters from cache if stored
    try {
      const cached = localStorage.getItem("lumen_reseller_config");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.resellerName) setBrandName(`${parsed.resellerName} Billing`);
        if (parsed.supportEmail) setBrandEmail(parsed.supportEmail);
      }
    } catch (e) {
      console.warn("Could not retrieve custom branding, fallback used.");
    }

    if (!currentInvoiceId) {
      setError('Invoice identification parameter "id" is missing in URL.');
      setLoading(false);
      return;
    }

    const fetchInvoiceDetails = async () => {
      try {
        const response = await fetch(`/api/crypto/link-info/${currentInvoiceId}`);
        if (!response.ok) {
          throw new Error(`Failed to find dynamic invoice details associated with ID ${currentInvoiceId}`);
        }
        const data = await response.json();
        setInvoice(data);
        
        // Compute remaining countdown seconds if pending
        if (data.status !== "completed") {
          const createdTime = new Date(data.createdAt).getTime();
          const expireTime = createdTime + 15 * 60 * 1000;
          const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
          setCountdown(remaining > 0 ? remaining : 0);
        }
      } catch (err: any) {
        setError(err.message || "Error occurred during dynamic lookup.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [currentInvoiceId]);

  // Handle ticking countdown clock
  useEffect(() => {
    if (loading || error || !invoice || invoice.status === "completed") return;

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setError("This invoice transaction window has expired. Please initiate a new billing checkout.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, invoice]);

  const copyAddress = () => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice.cryptoAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const simulatePaymentApproval = async () => {
    if (!invoice || !currentInvoiceId) return;
    setFaucetLoading(true);

    try {
      const response = await fetch(`/api/crypto/pay-simulate/${currentInvoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error("On-chain simulation faucet returned error check status.");
      }

      const result = await response.json();
      
      // Attempt to sync local storage models for smooth integration
      try {
        const localCacheStr = localStorage.getItem("lumen_reseller_config");
        if (localCacheStr && result.link) {
          const config = JSON.parse(localCacheStr);
          
          // Check if order already added to prevent duplicates
          const orderId = `ord-${result.link.id}`;
          const exists = config.simulatedOrders.some((o: any) => o.id === orderId);
          if (!exists) {
            const newOrderObj = {
              id: orderId,
              clientName: result.link.clientName,
              planName: result.link.serviceName,
              cost: parseFloat((result.link.amountUsd * 0.5).toFixed(2)),
              revenue: result.link.amountUsd,
              date: new Date().toISOString().split("T")[0],
              status: "provisioned"
            };
            
            // Increment service counts or add client
            const cExists = config.simulatedClients.some((c: any) => c.email === result.link.clientEmail);
            if (!cExists) {
              config.simulatedClients.unshift({
                id: `c-${Math.floor(100 + Math.random() * 900)}`,
                name: result.link.clientName,
                email: result.link.clientEmail,
                activeServices: 1,
                status: "active",
                joined: new Date().toISOString().split("T")[0]
              });
            } else {
              const cIdx = config.simulatedClients.findIndex((c: any) => c.email === result.link.clientEmail);
              if (cIdx !== -1) {
                config.simulatedClients[cIdx].activeServices++;
              }
            }

            config.simulatedOrders.unshift(newOrderObj);
            localStorage.setItem("lumen_reseller_config", JSON.stringify(config));
            
            // Dispatch storage event to keep tabs parallel
            window.dispatchEvent(new Event("storage"));
          }
        }
      } catch (cacheErr) {
        console.error("Local storage sync error:", cacheErr);
      }

      // Transition visual presentation slowly
      setTimeout(() => {
        setInvoice(result.link);
        setFaucetLoading(false);
      }, 1200);

    } catch (err: any) {
      setFaucetLoading(false);
      alert(err.message || "On-chain faucet error.");
    }
  };

  const closeGateway = () => {
    try {
      window.close();
    } catch (e) {}
    // Fallback safe redirect to panel router
    navigate("/reseller-panel");
  };

  const formatCountdown = () => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getCryptoIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "BTC":
        return <Bitcoin className="w-5 h-5 text-amber-500 animate-pulse" />;
      case "ETH":
        return <Gem className="w-5 h-5 text-[#8c8cfa] animate-pulse" />;
      case "SOL":
        return <Sparkles className="w-5 h-5 text-[#3effe6] animate-pulse" />;
      default:
        return <Coins className="w-5 h-5 text-emerald-400 animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#06080b] text-slate-100 flex items-center justify-center p-4 relative sm:p-8 overflow-hidden select-none">
      {/* Decorative Blur Halos */}
      <div className="fixed top-[-15%] left-[-15%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-[-15%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black font-display tracking-tight text-white m-0 uppercase leading-none">{brandName}</h1>
          <p className="text-[11px] text-zinc-500 m-0 uppercase tracking-widest font-mono font-bold">On behalf of your Whitelabel Admin</p>
        </div>

        {/* Content Panel Frame */}
        <div className="bg-[#0e121b]/80 backdrop-blur-3xl border border-white/5 p-6 sm:p-8 rounded-[36px] min-h-[480px] relative overflow-hidden shadow-2xl flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* Loading Cover */}
            {loading && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-zinc-950/95 flex flex-col justify-center items-center space-y-4 z-20 rounded-[36px]"
              >
                <div className="w-10 h-10 border-t-2 border-r-2 border-indigo-500 rounded-full animate-spin" />
                <p className="text-xs text-zinc-500 font-mono tracking-wider">Loading secure escrow checkout parameters...</p>
              </motion.div>
            )}

            {/* Error Overlay */}
            {error && (
              <motion.div 
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-zinc-950/98 p-8 flex flex-col justify-center items-center text-center space-y-5 z-20 rounded-[36px]"
              >
                <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-500">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-md font-bold text-white uppercase tracking-wider font-display mb-1">Payment Session Halted</h3>
                  <p className="text-xs text-zinc-500 max-w-xs leading-normal">{error}</p>
                </div>
                <button 
                  onClick={() => navigate("/reseller-panel")} 
                  className="px-5 py-2.5 bg-zinc-900 border border-white/10 text-xs font-semibold rounded-xl text-white hover:bg-zinc-800 transition flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Workspace</span>
                </button>
              </motion.div>
            )}

            {/* Main Interactive Stage */}
            {!loading && !error && invoice && (
              <motion.div 
                key={invoice.status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 flex-1 flex flex-col justify-between"
              >
                {invoice.status === "completed" ? (
                  /* Settled Success View */
                  <div className="space-y-6 flex-1 flex flex-col justify-center py-4">
                    <div className="text-center space-y-2">
                       <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <Check size={22} />
                      </div>
                      <h3 className="text-lg font-bold text-white font-display tracking-tight uppercase leading-none mt-1">Invoice Settled Successfully</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Payment of <strong className="text-emerald-400 font-mono text-[11px] font-bold">{invoice.cryptocurrencyAmount} {invoice.cryptoType}</strong> confirmed on cryptocurrency blockchain.
                      </p>
                    </div>

                    <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-2xl space-y-2.5 text-left">
                      <p className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-extrabold leading-none">Smart Pool Transaction Hash (TXID)</p>
                      <p className="text-[9px] text-indigo-400 font-mono break-all font-semibold leading-relaxed mb-1 selection:bg-indigo-500/20">{invoice.txHash || "0x98f844b24eedda855cd1..."}</p>
                      <div className="border-t border-white/[0.04] pt-2 flex justify-between items-center text-[10px] text-zinc-400 font-mono">
                        <span>Status: <strong className="text-emerald-400 font-bold">Settled & Locked</strong></span>
                        <span className="text-[9px] uppercase font-bold text-zinc-500">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center pt-2">
                      <button 
                        onClick={closeGateway} 
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl text-white transition active:scale-[0.99]"
                      >
                        Close Checkout
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Pending Secure Parameters View */
                  <>
                    {/* 1. Invoice Overview */}
                    <div className="flex justify-between items-start border-b border-white/[0.06] pb-5">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-extrabold">Billable Item</p>
                        <h2 className="text-[15px] font-bold text-white tracking-tight leading-tight">{invoice.serviceName}</h2>
                        <p className="text-xs text-zinc-400">Client: {invoice.clientName} ({invoice.clientEmail})</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 font-extrabold block mb-1">Escrow Due</span>
                        <span className="text-2xl font-black text-white tracking-tight font-display block">${invoice.amountUsd.toFixed(2)}</span>
                        <span className="text-[10px] uppercase font-mono text-indigo-400 font-bold block mt-0.5">{invoice.cryptocurrencyAmount} {invoice.cryptoType}</span>
                      </div>
                    </div>

                    {/* 2. Parameters Block */}
                    <div className="space-y-4 flex-1 py-1 flex flex-col justify-center">
                      <div className="flex justify-between items-center bg-white/[0.015] border border-white/5 px-4 py-3 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500 font-mono">CODE:</span>
                          <span className="font-mono font-bold text-white uppercase tracking-wider">{invoice.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                          <span>Expires in:</span>
                          <span className="font-mono font-extrabold text-indigo-400">{formatCountdown()}</span>
                        </div>
                      </div>

                      {/* QR Core Box & Wallet Card */}
                      <div className="flex flex-col items-center py-5 bg-zinc-950/70 rounded-2xl border border-white/[0.04] space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl" />
                        
                        {/* Fake High fidelity QR SVG */}
                        <div className="w-32 h-32 bg-white p-2.5 rounded-xl flex items-center justify-center relative shadow-xl">
                          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                            <rect width="100" height="100" fill="white" />
                            <rect x="5" y="5" width="22" height="22" fill="#0e121b" />
                            <rect x="9" y="9" width="14" height="14" fill="white" />
                            <rect x="11" y="11" width="10" height="10" fill="#0e121b" />

                            <rect x="73" y="5" width="22" height="22" fill="#0e121b" />
                            <rect x="77" y="77" width="14" height="14" fill="white" />
                            <rect x="79" y="79" width="10" height="10" fill="#0e121b" />

                            <rect x="5" y="73" width="22" height="22" fill="#0e121b" />
                            <rect x="9" y="77" width="14" height="14" fill="white" />
                            <rect x="11" y="79" width="10" height="10" fill="#0e121b" />

                            <path d="M 32 8 H 40 V 16 M 48 5 H 56 M 64 8 H 68 M 32 16 H 36 M 44 20 H 52 M 60 16 H 68 M 8 32 H 16 M 24 36 H 28 M 40 32 H 56 M 64 32 H 72 M 5 44 H 16 M 20 48 H 28 M 36 44 H 48 M 64 48 H 80 M 8 60 H 16 M 24 64 H 36 M 44 60 H 56" stroke="#0e121b" strokeWidth="2" strokeLinecap="round" />
                            <path d="M 52 72 H 56 V 76 M 60 76 H 64 V 84 M 68 80 H 72 M 52 84 H 60 M 36 84 V 92 M 44 92 H 56" stroke="#0e121b" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          
                          {/* Sub-icon overlap overlay */}
                          <div className="absolute inset-0 m-auto w-9 h-9 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                            {getCryptoIcon(invoice.cryptoType)}
                          </div>
                        </div>

                        <div className="text-center space-y-1">
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold font-mono">Exact Value To Disburse</p>
                          <p className="text-lg font-mono font-black text-white">{invoice.cryptocurrencyAmount} {invoice.cryptoType}</p>
                          <p className="text-[9px] text-zinc-400 font-mono">To secure multi-sig custody pool address:</p>
                        </div>

                        {/* Copier box */}
                        <div className="w-full px-5">
                          <div className="flex items-center bg-zinc-900 border border-white/5 p-1 rounded-xl text-xs justify-between max-w-sm mx-auto">
                            <span className="font-mono text-[10px] text-zinc-400 truncate pl-2 pr-4 flex-1 select-all">{invoice.cryptoAddress}</span>
                            <button 
                              onClick={copyAddress} 
                              className={`px-3.5 py-1.5 font-bold text-white rounded-lg transition text-[10px] flex items-center gap-1.5 shrink-0 select-none ${copied ? "bg-emerald-600 hover:bg-emerald-500" : "bg-zinc-800 hover:bg-zinc-700"}`}
                            >
                              {copied ? <Check size={11} /> : <Copy size={11} />}
                              <span>{copied ? "Copied" : "Copy"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Real cryptocurrency payment check message */}
                    <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-center text-[10px] text-emerald-400 font-mono mt-2 animate-pulse">
                      Uplink actively monitoring on-chain transaction ledger...
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info links */}
        <p className="text-center text-[10px] text-zinc-500 leading-relaxed justify-center flex flex-col gap-1 select-none">
          <span>Secured multi-sig checkout processed automatically via smart pool gateways.</span>
          <span>For billing discrepancies or customer assistance, contact: <strong className="text-zinc-400 font-mono">{brandEmail}</strong></span>
        </p>
      </div>
    </div>
  );
}
