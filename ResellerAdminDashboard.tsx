import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  setDoc, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  ShieldAlert, 
  Cpu, 
  Database, 
  Globe, 
  TrendingUp, 
  Save, 
  Trash2, 
  Plus, 
  Search, 
  Layers, 
  LayoutDashboard, 
  Coins, 
  FileText, 
  Activity, 
  ChevronRight, 
  Settings, 
  FolderPlus, 
  Zap, 
  UserPlus, 
  RefreshCw,
  ArrowRight,
  ClipboardList,
  Edit3,
  Check,
  Building,
  Menu,
  X,
  Smartphone,
  CheckCircle,
  HelpCircle,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ResellerAdminDashboard() {
  const navigate = useNavigate();
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (typeof window !== "undefined" && localStorage.getItem("lumen_theme") as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const cached = localStorage.getItem('lumen_theme') as 'dark' | 'light';
      if (cached) setTheme(cached);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Tabs state
  const [activeAdminTab, setActiveAdminTab] = useState<'resellers' | 'plans' | 'orders' | 'config'>('resellers');
  const [searchQuery, setSearchQuery] = useState("");

  // Firestore & local fallback dynamic state
  const [resellers, setResellers] = useState<any[]>([]);
  const [savedPlans, setSavedPlans] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    activeResellersCount: 14,
    totalWholesaleYield: 15420.00,
    cumulativeProfitMarkup: 24890.00,
    activeSubscribersTotal: 482
  });

  // New Reseller Form
  const [newResellerName, setNewResellerName] = useState("");
  const [newResellerEmail, setNewResellerEmail] = useState("");
  const [newResellerId, setNewResellerId] = useState("");

  // Plan Form State
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<"vps" | "dns" | "database">("vps");
  const [wholesaleCost, setWholesaleCost] = useState("4.99");
  const [retailPrice, setRetailPrice] = useState("12.99");
  const [specCpu, setSpecCpu] = useState("2 vCPU");
  const [specRam, setSpecRam] = useState("4 GB ECC");
  const [specStorage, setSpecStorage] = useState("80 GB NVMe");
  const [specBandwidth, setSpecBandwidth] = useState("2 TB");

  // Edit states for plans
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Status updates states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  const showNotification = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Seed plans helper
  const defaultSavedPlans = [
    {
      id: "vps-developer",
      name: "Developer Micro Node",
      type: "vps",
      parentCost: 1.99,
      retailPrice: 4.99,
      specs: { cpu: "1 vCPU", ram: "2 GB ECC", storage: "35 GB NVMe", bandwidth: "1 TB Burst" }
    },
    {
      id: "vps-scale",
      name: "Standard Scale Engine",
      type: "vps",
      parentCost: 4.80,
      retailPrice: 12.00,
      specs: { cpu: "2 vCPU", ram: "4 GB ECC", storage: "90 GB NVMe", bandwidth: "4 TB Burst" }
    },
    {
      id: "vps-dedicated",
      name: "Premium Dedicated Cluster",
      type: "vps",
      parentCost: 14.50,
      retailPrice: 38.00,
      specs: { cpu: "4 vCPU Dedicated", ram: "16 GB ECC", storage: "250 GB Intel NVMe", bandwidth: "10 TB Dedicated" }
    },
    {
      id: "dns-anycast",
      name: "Gold Anycast DNS Tier",
      type: "dns",
      parentCost: 0.80,
      retailPrice: 2.50,
      specs: { propagation: "Instant", ddosWaf: "Enterprise Shield", dnssec: "Enabled", connections: "Unlimited queries" }
    }
  ];

  // Load resellers, plans, logs
  useEffect(() => {
    setLoading(true);

    const checkAndInitializeData = async () => {
      try {
        // Load resellers from Firestore if present
        const resellersUnsub = onSnapshot(collection(db, "resellers"), (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (list.length > 0) {
            setResellers(list);
          } else {
            // Seed a dynamic list if database is empty
            const seedResellers = [
              {
                id: "ApexServerHosting",
                resellerName: "Apex Server Hosting",
                supportEmail: "support@apexservers.net",
                resellerWallet: 340.50,
                lumenProfit: 860.00,
                simulatedClients: [1, 2, 3, 4, 5, 6, 7, 8],
                simulatedOrders: [1, 2, 3, 4, 5],
                customNameservers: ["ns1.apexservers.net", "ns2.apexservers.net"]
              },
              {
                id: "TitanCloudService",
                resellerName: "Titan Cloud Systems",
                supportEmail: "billing@titancloud.io",
                resellerWallet: 890.10,
                lumenProfit: 1950.00,
                simulatedClients: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                simulatedOrders: [1, 2, 3, 4, 5, 6, 7, 8],
                customNameservers: ["ns1.titancloud.io", "ns2.titancloud.io"]
              },
              {
                id: "MatrixNodeProvider",
                resellerName: "Matrix Server Matrix",
                supportEmail: "matrix@lumenhost.pro",
                resellerWallet: 84.80,
                lumenProfit: 1170.00,
                simulatedClients: [1, 2, 3, 4, 5],
                simulatedOrders: [1, 2, 3],
                customNameservers: ["ns1.lumenhost.pro", "ns2.lumenhost.pro"]
              }
            ];
            setResellers(seedResellers);
          }
        });

        // Load plans
        const plansUnsub = onSnapshot(collection(db, "wholesale_plans"), (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (list.length > 0) {
            setSavedPlans(list);
          } else {
            setSavedPlans(defaultSavedPlans);
          }
        });

        // Load logs
        const logsUnsub = onSnapshot(collection(db, "reseller_system_logs"), (snap) => {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (list.length > 0) {
            setSystemLogs(list);
          } else {
            setSystemLogs([
              { id: "log-1", message: "Whitelabel Partner Apex Server Hosting registered standard plans.", timestamp: "3 minutes ago", type: "system" },
              { id: "log-2", message: "Bulk pricing adjustment compiled successfully on 4 products.", timestamp: "25 minutes ago", type: "system" },
              { id: "log-3", message: "Payout request approved & dispatched to Apex Server Hosting: 120.00 USDT.", timestamp: "1 hour ago", type: "payout" },
              { id: "log-4", message: "Anycast Core nodes distributed to 12 regional cluster datacenters.", timestamp: "6 hours ago", type: "dns" },
              { id: "log-5", message: "Matrix Server Matrix initialized customized dashboard API endpoints.", timestamp: "1 day ago", type: "system" }
            ]);
          }
        });

        return () => {
          resellersUnsub();
          plansUnsub();
          logsUnsub();
        };

      } catch (err) {
        console.warn("Could not initiate realtime listeners. Using state engines.", err);
        setResellers([
          {
            id: "ApexServerHosting",
            resellerName: "Apex Server Hosting",
            supportEmail: "support@apexservers.net",
            resellerWallet: 340.50,
            lumenProfit: 860.00,
            simulatedClients: [1, 2, 3, 4, 5, 6, 7, 8],
            simulatedOrders: [1, 2, 3, 4, 5],
            customNameservers: ["ns1.apexservers.net", "ns2.apexservers.net"]
          },
          {
            id: "TitanCloudService",
            resellerName: "Titan Cloud Systems",
            supportEmail: "billing@titancloud.io",
            resellerWallet: 890.10,
            lumenProfit: 1950.00,
            simulatedClients: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            simulatedOrders: [1, 2, 3, 4, 5, 6, 7, 8],
            customNameservers: ["ns1.titancloud.io", "ns2.titancloud.io"]
          },
          {
            id: "MatrixNodeProvider",
            resellerName: "Matrix Server Matrix",
            supportEmail: "matrix@lumenhost.pro",
            resellerWallet: 84.80,
            lumenProfit: 1170.00,
            simulatedClients: [1, 2, 3, 4, 5],
            simulatedOrders: [1, 2, 3],
            customNameservers: ["ns1.lumenhost.pro", "ns2.lumenhost.pro"]
          }
        ]);
        setSavedPlans(defaultSavedPlans);
      } finally {
        setLoading(false);
      }
    };

    checkAndInitializeData();
  }, []);

  // Financial aggregation stats
  useEffect(() => {
    if (resellers.length > 0) {
      const activeResellersCount = resellers.length;
      const totalWholesaleYield = resellers.reduce((sum, r) => sum + (Number(r.lumenProfit) || 0), 0);
      const cumulativeProfitMarkup = resellers.reduce((sum, r) => sum + (Number(r.resellerWallet) || 0), 0);
      const activeSubscribersTotal = resellers.reduce((sum, r) => sum + (r.simulatedClients?.length || 0) * 12, 482);

      setStats({
        activeResellersCount,
        totalWholesaleYield,
        cumulativeProfitMarkup,
        activeSubscribersTotal
      });
    }
  }, [resellers]);

  // Handle register reseller
  const handleRegisterReseller = async () => {
    if (!newResellerName || !newResellerEmail) {
      showNotification("Please provide a brand name and support email.", "error");
      return;
    }

    const cleanId = newResellerId.trim() || "reseller_" + Math.random().toString(36).substring(2, 7);

    const newPrv = {
      resellerName: newResellerName.trim(),
      supportEmail: newResellerEmail.trim(),
      resellerWallet: 0.00,
      lumenProfit: 0.00,
      simulatedClients: [],
      simulatedOrders: [],
      customNameservers: [`ns1.${newResellerName.toLowerCase().replace(/\s+/g, '')}.com`, `ns2.${newResellerName.toLowerCase().replace(/\s+/g, '')}.com`]
    };

    try {
      await setDoc(doc(db, "resellers", cleanId), newPrv);
      
      // Log event
      await addDoc(collection(db, "reseller_system_logs"), {
        message: `Registered brand new Whitelabel Reseller Provider: ${newResellerName}.`,
        timestamp: "Just now",
        type: "system"
      });

      setNewResellerName("");
      setNewResellerEmail("");
      setNewResellerId("");
      showNotification("Symmetric Whitelabel Provider registration completed!");
    } catch (e: any) {
      // Local fallback state
      const target = [...resellers, { id: cleanId, ...newPrv }];
      setResellers(target);
      showNotification("Reseller saved locally in active system template.");
    }
  };

  // Modify Reseller Wallet Balance
  const handleUpdateWallet = async (resId: string, currentBalance: number) => {
    const val = prompt("Enter new withdrawn markup balance ($):", currentBalance.toString());
    if (val === null) return;
    const amount = parseFloat(val);
    if (isNaN(amount) || amount < 0) {
      showNotification("Invalid numeric amount.", "error");
      return;
    }

    try {
      await updateDoc(doc(db, "resellers", resId), { resellerWallet: amount });
      
      await addDoc(collection(db, "reseller_system_logs"), {
        message: `Direct wallet balance override for reseller ${resId} into $${amount.toFixed(2)}.`,
        timestamp: "Just now",
        type: "system"
      });
      showNotification(`Set reseller withdrawn wallet to $${amount.toFixed(2)}`);
    } catch (err) {
      setResellers(resellers.map(r => r.id === resId ? { ...r, resellerWallet: amount } : r));
      showNotification("Wallet tracking localized successfully.", "info");
    }
  };

  // Remove Reseller
  const handleDeleteReseller = async (resId: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to de-register and delete ${name}? This will block and disconnect their whitelabel storefront.`)) return;

    try {
      await deleteDoc(doc(db, "resellers", resId));
      await addDoc(collection(db, "reseller_system_logs"), {
        message: `Terminated and decommissioned reseller partner: ${name}.`,
        timestamp: "Just now",
        type: "system"
      });
      showNotification(`Reseller ${name} purged from whitelist database.`);
    } catch (err) {
      setResellers(resellers.filter(r => r.id !== resId));
      showNotification(`Localized purge completed for ${name}.`);
    }
  };

  // Handle plan creation or modification
  const handleSavePlan = async () => {
    if (!planName) {
      showNotification("Please provide a unique product or plan name.", "error");
      return;
    }

    const floatWholesale = parseFloat(wholesaleCost);
    const floatRetail = parseFloat(retailPrice);

    if (isNaN(floatWholesale) || isNaN(floatRetail)) {
      showNotification("Please specify absolute numbers for pricing metrics.", "error");
      return;
    }

    const payload = {
      name: planName.trim(),
      type: planType,
      parentCost: floatWholesale,
      retailPrice: floatRetail,
      specs: planType === "vps" 
        ? { cpu: specCpu, ram: specRam, storage: specStorage, bandwidth: specBandwidth }
        : planType === "dns"
        ? { propagation: "Instant", ddosWaf: "Enterprise Shield", dnssec: "Enabled", connections: "Unlimited queries" }
        : { storage: "Gigantic DB Cluster", backups: "Automated Daily", cpu: "Shared Core Cluster", connections: "Global load balled" }
    };

    try {
      if (editingPlanId) {
        await setDoc(doc(db, "wholesale_plans", editingPlanId), payload);
        showNotification(`Plan '${planName}' updated successfully!`);
        setEditingPlanId(null);
      } else {
        const generatedId = planName.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, "wholesale_plans", generatedId), payload);
        showNotification(`New Wholesale Plan Template: '${planName}' compiled!`);
      }

      await addDoc(collection(db, "reseller_system_logs"), {
        message: `Compiled / Updated Saved wholesale plan product: ${planName}.`,
        timestamp: "Just now",
        type: "system"
      });

      // Clear layout
      setPlanName("");
      setWholesaleCost("4.99");
      setRetailPrice("12.99");
    } catch (err) {
      if (editingPlanId) {
        setSavedPlans(savedPlans.map(p => p.id === editingPlanId ? { id: editingPlanId, ...payload } : p));
        setEditingPlanId(null);
      } else {
        const generatedId = planName.toLowerCase().replace(/\s+/g, '-') + "_" + Math.floor(Math.random()*10);
        setSavedPlans([...savedPlans, { id: generatedId, ...payload }]);
      }
      setPlanName("");
      showNotification("Plan action localized! Synchronized on current memory node.");
    }
  };

  // Select Plan for editing
  const handleEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanType(plan.type);
    setWholesaleCost(plan.parentCost.toString());
    setRetailPrice((plan.retailPrice || plan.parentCost * 1.5).toString());
    if (plan.specs) {
      if (plan.type === "vps") {
        setSpecCpu(plan.specs.cpu || "2 vCPU");
        setSpecRam(plan.specs.ram || "4 GB ECC");
        setSpecStorage(plan.specs.storage || "80 GB NVMe");
        setSpecBandwidth(plan.specs.bandwidth || "2 TB");
      }
    }
    showNotification(`Populated spec sheet for '${plan.name}'`, "info");
  };

  // Remove plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Are you sure you want to remove this global wholesale product plan from the inventory?")) return;

    try {
      await deleteDoc(doc(db, "wholesale_plans", planId));
      showNotification("Wholesale plan purged successfully.");
    } catch (err) {
      setSavedPlans(savedPlans.filter(p => p.id !== planId));
      showNotification("Localized plan database inventory refreshed.", "info");
    }
  };

  // Filter list
  const filteredResellers = resellers.filter(r => 
    r.resellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.supportEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#06080a] text-white'} flex flex-col font-sans transition-colors duration-300 relative overflow-hidden`}>
      
      {/* Absolute decorative gradient grids */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-500/10 rounded-full blur-[120px] opacity-75"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-500/10 rounded-full blur-[120px] opacity-75"></div>
      </div>

      {/* Global alert Toast system notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-[9999]"
          >
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${
              toastType === 'success' 
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30' 
                : toastType === 'error'
                ? 'bg-red-950/90 text-red-300 border-red-500/30'
                : 'bg-zinc-900/95 text-zinc-100 border-zinc-700/60'
            } backdrop-blur-md shadow-2xl min-w-[340px]`}>
              <CheckCircle size={18} className={toastType === 'success' ? 'text-emerald-400' : 'text-indigo-400'} />
              <div className="text-xs font-semibold">{toastMessage}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary super navigation bar */}
      <header className={`sticky top-0 z-40 border-b ${theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-[#06080a]/80 border-white/5'} backdrop-blur-xl px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Building size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-lg tracking-tight select-none">Lumen wholesale</h1>
              <span className="text-[9px] uppercase font-black tracking-widest bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full select-none">
                Master Admin Panel
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Whitelabel operations consolidated core node</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden leading-none text-zinc-500 font-mono text-[10px] sm:flex items-center gap-3 mr-4">
            <span>Uplink: <span className="text-emerald-400">Connected</span></span>
            <span>Local Node Time: <span className="text-indigo-400 font-bold">{new Date().toLocaleTimeString()}</span></span>
          </span>

          <button 
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-4 py-2 border ${
              theme === 'light' 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
              : 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10'
            } rounded-xl text-xs font-bold transition-all`}
          >
            <LogOut size={13} />
            <span>Quit Console</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 z-10 relative space-y-8">
        
        {/* Dynamic Matrix Stat Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-250' : 'bg-white/5 border-white/5'} flex flex-col justify-between relative overflow-hidden shadow-sm hover:translate-y-[-2px] transition duration-200`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono tracking-widest uppercase mb-4">
              <span>Whitelabel Partners</span>
              <Globe size={14} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-3xl font-black font-mono tracking-tight">{stats.activeResellersCount}</div>
              <p className="text-[10px] text-zinc-400 mt-2">White-label host providers active in system</p>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-250' : 'bg-white/5 border-white/5'} flex flex-col justify-between relative overflow-hidden shadow-sm hover:translate-y-[-2px] transition duration-200`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono tracking-widest uppercase mb-4">
              <span>Lumen wholesale cost</span>
              <Coins size={14} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-3xl font-black font-mono text-emerald-400 tracking-tight">${stats.totalWholesaleYield.toFixed(2)}</div>
              <p className="text-[10px] text-zinc-400 mt-2">Combined central hosting fee accrued</p>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-250' : 'bg-white/5 border-white/5'} flex flex-col justify-between relative overflow-hidden shadow-sm hover:translate-y-[-2px] transition duration-200`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono tracking-widest uppercase mb-4">
              <span>Active Partner Markup</span>
              <TrendingUp size={14} className="text-amber-400" />
            </div>
            <div>
              <div className="text-3xl font-black font-mono tracking-tight text-amber-400">${stats.cumulativeProfitMarkup.toFixed(2)}</div>
              <p className="text-[10px] text-zinc-400 mt-2">Accumulated markups currently in custody</p>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-250' : 'bg-white/5 border-white/5'} flex flex-col justify-between relative overflow-hidden shadow-sm hover:translate-y-[-2px] transition duration-200`}>
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between text-xs text-zinc-500 font-mono tracking-widest uppercase mb-4">
              <span>Total Downstream Sites</span>
              <Cpu size={14} className="text-rose-400" />
            </div>
            <div>
              <div className="text-3xl font-black font-mono tracking-tight">{stats.activeSubscribersTotal}</div>
              <p className="text-[10px] text-zinc-400 mt-2">Active VM nodes and hosted service units</p>
            </div>
          </div>

        </div>

        {/* Console control Tab buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-white/5 pb-4 gap-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'resellers', label: 'Whitelabel Partners' },
              { id: 'plans', label: 'Saved Wholesale Plans' },
              { id: 'orders', label: 'Wholesale Distribution Logs' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAdminTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-extrabold uppercase tracking-widest pb-3 border-b-2 transition-all shrink-0 ${
                  activeAdminTab === tab.id 
                    ? 'border-indigo-500 text-indigo-400' 
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeAdminTab === 'resellers' && (
            <div className="flex items-center gap-2 p-1.5 bg-black/10 border border-white/5 rounded-2xl w-full sm:max-w-xs text-xs">
              <Search className="text-zinc-500 shrink-0 ml-2" size={14} />
              <input 
                type="text" 
                placeholder="Search whitelabel brand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:outline-none flex-1 text-xs text-white"
              />
            </div>
          )}
        </div>

        {/* Dynamic Display content */}
        <div>
          {activeAdminTab === 'resellers' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Resellers list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-widest uppercase text-zinc-400">Currently Whitelisted Registrants</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">{filteredResellers.length} listed</span>
                </div>

                <div className="space-y-4">
                  {filteredResellers.map(res => (
                    <div 
                      key={res.id} 
                      className={`p-6 rounded-3xl border transition-all ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 shadow-sm' 
                          : 'bg-[#0b0f14] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg select-none">{res.resellerName}</h4>
                            <span className="text-[8px] font-mono font-bold bg-indigo-600/10 text-indigo-400 px-2 py-0.5 rounded-full uppercase">
                              ID: {res.id}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 font-mono mt-0.5">Support Inbox: {res.supportEmail}</p>

                          <div className="flex items-center flex-wrap gap-4 text-[10px] text-zinc-400 mt-4">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              Custom nameservers: <strong className="text-indigo-400 font-bold">{res.customNameservers?.length || 2} registered</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active orders: <strong className="text-zinc-300">{(res.simulatedOrders?.length || 3) * 4} nodes</strong>
                            </span>
                          </div>
                        </div>

                        {/* Financial custody stats cards */}
                        <div className="grid grid-cols-2 gap-4 bg-black/10 border border-white/5 p-4 rounded-2xl text-center sm:text-right sm:min-w-[200px]">
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block leading-none mb-1">Selling gain</span>
                            <span className="text-sm font-black font-mono text-amber-400">${(res.resellerWallet || 0.00).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-wider block leading-none mb-1 font-mono">Wholesale Fee</span>
                            <span className="text-sm font-black font-mono text-zinc-300">${(res.lumenProfit || 0.00).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Administrative management action tools */}
                      <div className="border-t border-white/5 mt-5 pt-4 flex flex-wrap gap-2 justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Operational core actions:</span>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleUpdateWallet(res.id, res.resellerWallet || 0)}
                            className="px-3.5 py-2 hover:bg-white/5 border border-white/5 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition duration-150"
                          >
                            Set Wallet Balance
                          </button>

                          <a 
                            href={`/reseller-panel?resellerId=${res.id}`}
                            target="_blank"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                          >
                            <Building size={12} />
                            <span>Inspect Storefront</span>
                          </a>

                          <button 
                            onClick={() => handleDeleteReseller(res.id, res.resellerName)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}

                  {filteredResellers.length === 0 && (
                    <div className="text-center py-12 p-6 bg-black/5 rounded-3xl border border-white/5 text-zinc-500 font-mono">
                      <p className="m-0 leading-relaxed">No registered Whitelabel providers coincide with your search.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Register Provider Registration Form */}
              <div className="space-y-6">
                <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0b0f14] border-white/5'} space-y-4`}>
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} className="text-indigo-400" />
                    <h3 className="font-bold text-sm tracking-widest uppercase">Whitelabel Registration</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Add a brand new partner provider to the wholesale matrix ecosystem.</p>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Company / Brand Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. HostGator Apex"
                        value={newResellerName}
                        onChange={e => setNewResellerName(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Corporate Support Email</label>
                      <input 
                        type="email" 
                        placeholder="e.g. admin@apexservers.net"
                        value={newResellerEmail}
                        onChange={e => setNewResellerEmail(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Custom Account UID (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. admin_apex_node"
                        value={newResellerId}
                        onChange={e => setNewResellerId(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <button 
                      onClick={handleRegisterReseller}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl shadow-lg transition duration-200 uppercase tracking-wider"
                    >
                      Authorize wholesale partnership
                    </button>
                  </div>
                </div>

                {/* Simulated Payout Status Tracking */}
                <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0b0f14] border-white/5'} space-y-4`}>
                  <div className="flex items-center gap-2">
                    <ClipboardList size={18} className="text-zinc-400" />
                    <h3 className="font-bold text-xs tracking-widest uppercase">System Integration</h3>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Lumen Super-HQ provides unified Anycast DNS structures, container VMs, and automatic blockchain / card crypto gateways for downstream whitelabels.
                  </p>
                </div>
              </div>

            </div>
          )}

          {activeAdminTab === 'plans' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
              
              {/* Left & Center: Saved wholesome plans list */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm tracking-widest uppercase text-zinc-400">Inventory Product plans & specs</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">{savedPlans.length} products defined</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPlans.map(plan => {
                    const isVps = plan.type === "vps";
                    const isDns = plan.type === "dns";
                    const isDb = plan.type === "database";

                    return (
                      <div 
                        key={plan.id} 
                        className={`p-6 rounded-3xl border flex flex-col justify-between ${
                          theme === 'light' 
                            ? 'bg-white border-slate-200 shadow-sm' 
                            : 'bg-[#0b0f14] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-extrabold text-sm text-zinc-100 leading-tight block select-none">
                                {plan.name}
                              </h4>
                              <span className="text-[8px] uppercase font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block font-mono border border-indigo-500/20 text-indigo-400 bg-indigo-500/10">
                                {plan.type}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Wholesale Base</div>
                              <div className="text-md font-black text-emerald-400 font-mono">${Number(plan.parentCost).toFixed(2)}</div>
                            </div>
                          </div>

                          {/* Plan Specifications box */}
                          <div className="my-4 p-3.5 bg-black/10 border border-white/5 rounded-2xl text-[10px] space-y-1.5 font-mono text-zinc-400">
                            {plan.specs ? Object.entries(plan.specs).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-zinc-500 uppercase">{key}:</span>
                                <span className="text-zinc-300 font-bold">{String(value)}</span>
                              </div>
                            )) : (
                              <span className="text-zinc-600 block">No resources parameters cataloged.</span>
                            )}
                          </div>
                        </div>

                        {/* Retail suggestion */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-4 text-[10px]">
                          <div>
                            <span className="text-zinc-500 block font-mono">Recommended Retail Selling Price</span>
                            <span className="font-extrabold font-mono text-white text-xs">${Number(plan.retailPrice || plan.parentCost * 2.2).toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditPlan(plan)}
                              className="px-2.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg font-bold border border-indigo-500/10 transition"
                              title="Edit specifications"
                            >
                              <Edit3 size={11} />
                            </button>
                            <button 
                              onClick={() => handleDeletePlan(plan.id)}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition"
                              title="Purge plan"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Sidebar: Plan Specs Builder */}
              <div>
                <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0b0f14] border-white/5'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderPlus size={18} className="text-indigo-400" />
                      <h3 className="font-bold text-sm tracking-widest uppercase">
                        {editingPlanId ? "Edit Wholesale Plan" : "Create Wholesale Plan"}
                      </h3>
                    </div>
                    {editingPlanId && (
                      <button 
                        onClick={() => {
                          setEditingPlanId(null);
                          setPlanName("");
                          showNotification("Clear specs form", "info");
                        }} 
                        className="text-[10px] text-red-400 font-bold"
                        title="Cancel edit"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">Saved wholesale specifications instantly synchronize to whitelabel templates.</p>

                  <div className="space-y-3.5 pt-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Product Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Enterprise Power Node"
                        value={planName}
                        onChange={e => setPlanName(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Provision Type</label>
                        <select 
                          value={planType} 
                          onChange={e => setPlanType(e.target.value as any)}
                          className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                        >
                          <option value="vps">Cloud VPS Node</option>
                          <option value="dns">Anycast DNS Pro</option>
                          <option value="database">Database Cluster</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Wholesale Base Cost ($)</label>
                        <input 
                          type="text" 
                          value={wholesaleCost}
                          onChange={e => setWholesaleCost(e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Suggested Retail Price ($)</label>
                      <input 
                        type="text" 
                        value={retailPrice}
                        onChange={e => setRetailPrice(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none font-mono text-zinc-300 font-bold"
                      />
                    </div>

                    {planType === "vps" && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-black/10 border border-white/5 rounded-2xl">
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">vCPU allocation</label>
                          <input 
                            type="text" 
                            value={specCpu}
                            onChange={e => setSpecCpu(e.target.value)}
                            className="w-full bg-transparent border-b border-white/5 focus:outline-none text-[10px] py-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">RAM allocation</label>
                          <input 
                            type="text" 
                            value={specRam}
                            onChange={e => setSpecRam(e.target.value)}
                            className="w-full bg-transparent border-b border-white/5 focus:outline-none text-[10px] py-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">Disk Storage</label>
                          <input 
                            type="text" 
                            value={specStorage}
                            onChange={e => setSpecStorage(e.target.value)}
                            className="w-full bg-transparent border-b border-white/5 focus:outline-none text-[10px] py-1 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 uppercase font-mono block mb-0.5">Trough Bandwidth</label>
                          <input 
                            type="text" 
                            value={specBandwidth}
                            onChange={e => setSpecBandwidth(e.target.value)}
                            className="w-full bg-transparent border-b border-white/5 focus:outline-none text-[10px] py-1 text-white"
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={handleSavePlan}
                      className="w-full py-3.5 bg-gradient-to-tr from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl shadow-lg transition duration-200 uppercase tracking-widest mt-4"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Save size={13} />
                        <span>{editingPlanId ? "Update Product Plan Specs" : "Save wholesale specification"}</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeAdminTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0b0f14] border-white/5'} space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-emerald-400" />
                    <h3 className="font-bold text-sm tracking-widest uppercase">Wholesale Node Ledger & events</h3>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Live system tracking logs</span>
                </div>

                <div className="divide-y divide-white/[0.04] max-h-[500px] overflow-y-auto pr-2">
                  {systemLogs.map(log => (
                    <div key={log.id} className="py-3.5 flex items-start justify-between gap-4 text-xs">
                      <div className="flex gap-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          log.type === "payout" ? "bg-amber-400" : log.type === "dns" ? "bg-indigo-400" : "bg-emerald-400"
                        }`} />
                        <div>
                          <p className="m-0 text-zinc-350 leading-relaxed font-sans">{log.message}</p>
                          <span className="text-[10px] text-zinc-500 block font-mono mt-1">{log.timestamp}</span>
                        </div>
                      </div>
                      
                      <span className="text-[9px] uppercase font-mono bg-white/5 text-zinc-400 px-2 py-0.5 rounded border border-white/5 shrink-0 select-none">
                        {log.type || "node"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Super footer console indicator */}
      <footer className="mt-auto py-8 text-center text-[10px] text-zinc-500 font-mono border-t border-white/5 z-10 select-none">
         Lumen Super-HQ Wholesale Console matrix • Connected to Regional Nodes via Anycast Wireguard
      </footer>
    </div>
  );
}
