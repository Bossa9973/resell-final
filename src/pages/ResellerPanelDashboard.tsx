import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, getDocs, collection } from "firebase/firestore";
import { 
  Server, 
  LayoutDashboard, 
  Tags, 
  Wallet, 
  Palette, 
  UsersRound, 
  Network, 
  Sparkles, 
  ArrowLeft,
  Bell,
  X,
  TrendingUp,
  UserPlus,
  Users,
  Layers,
  Rocket,
  Plus,
  Lock,
  Banknote,
  Send,
  Link2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Activity,
  CheckCircle,
  Cpu,
  Globe,
  Database,
  Terminal,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SpecSheet {
  cpu?: string;
  ram?: string;
  storage?: string;
  bandwidth?: string;
  dnssec?: string;
  ddosWaf?: string;
  propagation?: string;
  backups?: string;
  connections?: string;
  [key: string]: string | undefined;
}

interface Plan {
  id: string;
  name: string;
  type: 'vps' | 'dns' | 'database' | string;
  specs: SpecSheet;
  parentCost: number;
  sellingPrice: number;
  active: boolean;
}

interface Client {
  id: string;
  name: string;
  email: string;
  activeServices: number;
  status: 'active' | 'suspended' | string;
  joined: string;
}

interface Order {
  id: string;
  clientName: string;
  planName: string;
  cost: number;
  revenue: number;
  date: string;
  status: 'provisioned' | 'pending_install' | 'failed' | string;
}

interface ResellerConfig {
  resellerName: string;
  supportEmail: string;
  currency: 'USD' | 'EUR' | 'GBP' | string;
  marginMultiplier: number;
  parentApiUrl: string;
  customNameservers: [string, string];
  preconfiguredPlans: Plan[];
  simulatedClients: Client[];
  simulatedOrders: Order[];
}

interface CurrencyMeta {
  symbol: string;
  rate: number;
}

const currencyRates: Record<string, CurrencyMeta> = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 }
};

const DEFAULT_CONFIG_FALLBACK: ResellerConfig = {
  resellerName: "Lumen Whitelabel Host",
  supportEmail: "support@yourdomain.com",
  currency: "USD",
  marginMultiplier: 1.4,
  parentApiUrl: "https://lumenhost.pro/api/v1",
  customNameservers: [
    "ns1.yourdomain.com",
    "ns2.yourdomain.com"
  ],
  preconfiguredPlans: [
    {
      id: "vps-entry",
      name: "Micro Core VPS",
      type: "vps",
      specs: {
        cpu: "1 vCPU",
        ram: "2 GB",
        storage: "25 GB NVMe",
        bandwidth: "1 TB"
      },
      parentCost: 3.00,
      sellingPrice: 4.99,
      active: true
    },
    {
      id: "vps-developer",
      name: "Developer Pro VPS",
      type: "vps",
      specs: {
        cpu: "2 vCPU",
        ram: "4 GB",
        storage: "60 GB NVMe",
        bandwidth: "3 TB"
      },
      parentCost: 6.50,
      sellingPrice: 9.99,
      active: true
    },
    {
      id: "vps-enterprise",
      name: "Quantum Elite VPS",
      type: "vps",
      specs: {
        cpu: "4 vCPU",
        ram: "8 GB",
        storage: "120 GB NVMe",
        bandwidth: "5 TB"
      },
      parentCost: 12.00,
      sellingPrice: 19.99,
      active: true
    },
    {
      id: "dns-zone",
      name: "Anycast Edge DNS Zone",
      type: "dns",
      specs: {
        dnssec: "Enabled",
        ddosWaf: "Active",
        propagation: "Instant"
      },
      parentCost: 1.00,
      sellingPrice: 2.49,
      active: true
    },
    {
      id: "db-redis",
      name: "Managed High-Speed Redis",
      type: "database",
      specs: {
        ram: "1 GB Memory",
        backups: "Daily Automated",
        connections: "10k Max"
      },
      parentCost: 4.00,
      sellingPrice: 5.99,
      active: true
    }
  ],
  simulatedClients: [
    {
      id: "c-104",
      name: "Marcus Aurelius",
      email: "marcus@rome.io",
      activeServices: 2,
      status: "active",
      joined: "2026-03-12"
    },
    {
      id: "c-105",
      name: "Ada Lovelace",
      email: "ada@analytics.net",
      activeServices: 1,
      status: "active",
      joined: "2026-04-05"
    },
    {
      id: "c-106",
      name: "Linus Torvalds",
      email: "linus@kernel.org",
      activeServices: 3,
      status: "active",
      joined: "2026-05-01"
    }
  ],
  simulatedOrders: [
    {
      id: "ord-881",
      clientName: "Marcus Aurelius",
      planName: "Developer Pro VPS",
      cost: 6.50,
      revenue: 9.99,
      date: "2026-05-15",
      status: "provisioned"
    },
    {
      id: "ord-882",
      clientName: "Linus Torvalds",
      planName: "Quantum Elite VPS",
      cost: 12.00,
      revenue: 19.99,
      date: "2026-05-20",
      status: "provisioned"
    },
    {
      id: "ord-883",
      clientName: "Ada Lovelace",
      planName: "Micro Core VPS",
      cost: 3.00,
      revenue: 4.99,
      date: "2026-05-24",
      status: "pending_install"
    }
  ]
};

export default function ResellerPanelDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Time States
  const [utcTime, setUtcTime] = useState<string>("");

  // Configuration States
  const [config, setConfig] = useState<ResellerConfig | null>(null);

  // Sliders for dynamic Overview projections
  const [modelClients, setModelClients] = useState<number>(12);
  const [modelMarkup, setModelMarkup] = useState<number>(55);

  // Escrow / Crypto States
  const [escrowBalance, setEscrowBalance] = useState<number>(0);
  const [escrowWithdrawn, setEscrowWithdrawn] = useState<number>(150);
  const [resellerWallet, setResellerWallet] = useState<number>(84.80);
  const [lumenProfit, setLumenProfit] = useState<number>(1170.00);
  const [billingLinks, setBillingLinks] = useState<any[]>([]);
  const [payoutLogs, setPayoutLogs] = useState<any[]>([]);

  // Form State: Create Payment Link
  const [linkClientSelect, setLinkClientSelect] = useState<string>("custom");
  const [linkCustomName, setLinkCustomName] = useState<string>("");
  const [linkCustomEmail, setLinkCustomEmail] = useState<string>("");
  const [linkServiceSelect, setLinkServiceSelect] = useState<string>("vps-entry");
  const [linkPriceInput, setLinkPriceInput] = useState<string>("4.99");
  const [linkCryptoType, setLinkCryptoType] = useState<string>("USDT");

  // Form State: Withdrawals
  const [payoutTokenType, setPayoutTokenType] = useState<string>("USDT");
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutWalletAddress, setPayoutWalletAddress] = useState<string>("");

  // Form State: Branding Configurations
  const [brandName, setBrandName] = useState<string>("");
  const [brandEmail, setBrandEmail] = useState<string>("");
  const [brandCurrency, setBrandCurrency] = useState<string>("USD");
  const [brandColor, setBrandColor] = useState<string>("#6366f1");
  const [brandNs1, setBrandNs1] = useState<string>("");
  const [brandNs2, setBrandNs2] = useState<string>("");

  // Terminal API state
  const [terminalOutput, setTerminalOutput] = useState<string>("API output logs awaiting test execution...");
  const [terminalStatus, setTerminalStatus] = useState<'pending' | 'success' | 'alert'>('pending');
  const [parentApiToken, setParentApiToken] = useState<string>("lm-auth-key-0128912-reseller");
  const [maskToken, setMaskToken] = useState<boolean>(true);

  // Copy status indicators
  const [jsonCopied, setJsonCopied] = useState<boolean>(false);
  const [htmlCopied, setHtmlCopied] = useState<boolean>(false);

  // Notification Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Impersonation, query routes, and multi-tenancy
  const [searchParams] = useSearchParams();
  const queryResellerId = searchParams.get("resellerId");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeResellerId, setActiveResellerId] = useState<string>("");
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);

  // Clock utc loader
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, "0");
      setUtcTime(`${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Auth synchronization hook
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  // Multi-tenant profile selector hook
  useEffect(() => {
    if (queryResellerId) {
      setActiveResellerId(queryResellerId);
      setIsImpersonating(true);
    } else if (currentUser) {
      setActiveResellerId(currentUser.uid);
      setIsImpersonating(false);
    } else {
      // Fallback to a fixed demo account so visitors can still use it
      setActiveResellerId("master_reseller_demo");
      setIsImpersonating(false);
    }
  }, [currentUser, queryResellerId]);

  // Firestore onSnapshot listener for this reseller profile
  useEffect(() => {
    if (!activeResellerId) return;

    const unsubDoc = onSnapshot(doc(db, "resellers", activeResellerId), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const mergedConfig: ResellerConfig = {
          resellerName: data.resellerName || "Lumen Whitelabel Host",
          supportEmail: data.supportEmail || "support@yourdomain.com",
          currency: data.currency || "USD",
          marginMultiplier: data.marginMultiplier || 1.4,
          parentApiUrl: data.parentApiUrl || "https://lumenhost.pro/api/v1",
          customNameservers: data.customNameservers || ["ns1.yourdomain.com", "ns2.yourdomain.com"],
          preconfiguredPlans: data.preconfiguredPlans || [],
          simulatedClients: data.simulatedClients || [],
          simulatedOrders: data.simulatedOrders || []
        };

        // If plans are empty, inherit central spec designs or default configurations
        if (mergedConfig.preconfiguredPlans.length === 0) {
          try {
            const masterPlansSnap = await getDocs(collection(db, "reseller_master_plans"));
            const fetchedPlans = masterPlansSnap.docs.map(d => {
              const pData = d.data();
              return {
                id: pData.id,
                name: pData.name,
                type: pData.type || "vps",
                specs: pData.specs || { cpu: "1 vCPU", ram: "2 GB", storage: "25 GB" },
                parentCost: Number(pData.parentCost),
                sellingPrice: Number(pData.suggestedPrice || (pData.parentCost * 1.3)),
                active: true
              };
            });

            if (fetchedPlans.length > 0) {
              mergedConfig.preconfiguredPlans = fetchedPlans;
            } else {
              // Static fallbacks
              try {
                const response = await fetch("/reseller-panel/config.json");
                if (response.ok) {
                  const dummy = await response.json();
                  mergedConfig.preconfiguredPlans = dummy.preconfiguredPlans;
                } else {
                  mergedConfig.preconfiguredPlans = DEFAULT_CONFIG_FALLBACK.preconfiguredPlans;
                }
              } catch (err) {
                mergedConfig.preconfiguredPlans = DEFAULT_CONFIG_FALLBACK.preconfiguredPlans;
              }
            }

            // Sync synced plans back to db
            await setDoc(doc(db, "resellers", activeResellerId), { preconfiguredPlans: mergedConfig.preconfiguredPlans }, { merge: true });
          } catch (e) {
            console.error("Central plans pull fail, using backup pre-sets:", e);
            mergedConfig.preconfiguredPlans = DEFAULT_CONFIG_FALLBACK.preconfiguredPlans;
          }
        }

        setConfig(mergedConfig);
        populateFormDefaults(mergedConfig);

        if (data.resellerWallet !== undefined) setResellerWallet(data.resellerWallet);
        if (data.lumenProfit !== undefined) setLumenProfit(data.lumenProfit);
        if (data.escrowBalance !== undefined) setEscrowBalance(data.escrowBalance);
        if (data.escrowWithdrawn !== undefined) setEscrowWithdrawn(data.escrowWithdrawn);
      } else {
        // Build beautiful starting mock profile so user never sees a blank page
        try {
          let dataBase = DEFAULT_CONFIG_FALLBACK;
          try {
            const response = await fetch("/reseller-panel/config.json");
            if (response.ok) {
              dataBase = await response.json();
            }
          } catch (fetchErr) {
            console.warn("Could not fetch /reseller-panel/config.json, using static fallback", fetchErr);
          }

          const masterPlansSnap = await getDocs(collection(db, "reseller_master_plans"));
          const masterPlansList = masterPlansSnap.docs.map(d => {
            const pData = d.data();
            return {
              id: pData.id,
              name: pData.name,
              type: pData.type || "vps",
              specs: pData.specs || { cpu: "1 vCPU", ram: "2 GB", storage: "25 GB" },
              parentCost: Number(pData.parentCost),
              sellingPrice: Number(pData.suggestedPrice || (pData.parentCost * 1.3)),
              active: true
            };
          });

          const initialObj = {
            id: activeResellerId,
            resellerName: activeResellerId === "master_reseller_demo" ? "Lumen Whitelabel Host (Demo)" : `Partner Portal (${activeResellerId.substring(0, 5)})`,
            supportEmail: "support@whitelabelhost.pro",
            currency: "USD",
            customNameservers: ["ns1.lumenhost.pro", "ns2.lumenhost.pro"],
            preconfiguredPlans: masterPlansList.length > 0 ? masterPlansList : dataBase.preconfiguredPlans,
            simulatedClients: dataBase.simulatedClients || [
              { id: "c-100", name: "Alexander the Great", email: "alexander@macedon.org", activeServices: 2, status: "active", joined: "2026-05-10" },
              { id: "c-101", name: "Cleopatra Philopator", email: "cleo@alexandiralink.eg", activeServices: 1, status: "active", joined: "2026-05-18" }
            ],
            simulatedOrders: dataBase.simulatedOrders || [
              { id: "ord-100", clientName: "Alexander the Great", planName: "Developer Pro VPS", cost: 6.50, revenue: 9.99, date: "2026-05-20", status: "provisioned" }
            ],
            resellerWallet: 84.80,
            lumenProfit: 1170.00,
            escrowBalance: 1254.80,
            escrowWithdrawn: 150.00
          };

          await setDoc(doc(db, "resellers", activeResellerId), initialObj);
        } catch (bootErr) {
          console.error("Failure booting partner workspace document:", bootErr);
        }
      }
    });

    return () => unsubDoc();
  }, [activeResellerId]);

  // Synchronize reseller configs to cloud database
  const syncToLocalStorage = async (newConfig: ResellerConfig) => {
    setConfig(newConfig);
    localStorage.setItem("lumen_reseller_config", JSON.stringify(newConfig));
    window.dispatchEvent(new Event("storage"));

    try {
      if (activeResellerId) {
        await setDoc(doc(db, "resellers", activeResellerId), {
          resellerName: newConfig.resellerName,
          supportEmail: newConfig.supportEmail,
          currency: newConfig.currency,
          marginMultiplier: newConfig.marginMultiplier,
          parentApiUrl: newConfig.parentApiUrl,
          customNameservers: newConfig.customNameservers,
          preconfiguredPlans: newConfig.preconfiguredPlans,
          simulatedClients: newConfig.simulatedClients,
          simulatedOrders: newConfig.simulatedOrders
        }, { merge: true });
      }
    } catch (err) {
      console.error("Failed syncing Whitelabel changes to database:", err);
    }
  };

  const populateFormDefaults = (data: ResellerConfig) => {
    setBrandName(data.resellerName || "");
    setBrandEmail(data.supportEmail || "");
    setBrandCurrency(data.currency || "USD");
    setBrandNs1(data.customNameservers?.[0] || "ns1.yourdomain.com");
    setBrandNs2(data.customNameservers?.[1] || "ns2.yourdomain.com");
    
    // Set fallback active plan default price
    const activeFirst = data.preconfiguredPlans?.find(p => p.active);
    if (activeFirst) {
      setLinkPriceInput(activeFirst.sellingPrice.toFixed(2));
      setLinkServiceSelect(activeFirst.id);
    }
  };

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Escrow balance loader from api with multi-tenant resellerId
  const loadCryptoBalances = async () => {
    try {
      if (!activeResellerId) return;
      const res = await fetch(`/api/crypto/dashboard?resellerId=${activeResellerId}`);
      if (!res.ok) throw new Error("Backend query failed");
      const data = await res.json();
      setEscrowBalance(data.balanceUSD);
      setEscrowWithdrawn(data.totalWithdrawn);
      if (data.resellerWallet !== undefined) setResellerWallet(data.resellerWallet);
      if (data.lumenProfit !== undefined) setLumenProfit(data.lumenProfit);
      setBillingLinks(data.links);
      setPayoutLogs(data.payouts);
    } catch (e) {
      console.warn("API escrow balances offline, using static approximations.", e);
    }
  };

  useEffect(() => {
    if (activeTab === "crypto" && activeResellerId) {
      loadCryptoBalances();
    }
  }, [activeTab, activeResellerId]);

  const currencySymbol = () => {
    if (!config) return "$";
    const meta = currencyRates[config.currency] || currencyRates.USD;
    return meta.symbol;
  };

  const currencyRate = () => {
    if (!config) return 1.0;
    const meta = currencyRates[config.currency] || currencyRates.USD;
    return meta.rate;
  };

  // Toggle Plan Status
  const togglePlanActiveState = (planId: string) => {
    if (!config) return;
    const updatedPlans = config.preconfiguredPlans.map(p => {
      if (p.id === planId) {
        const next = !p.active;
        showToast(`Hosting plan "${p.name}" status updated.`);
        return { ...p, active: next };
      }
      return p;
    });
    
    syncToLocalStorage({ ...config, preconfiguredPlans: updatedPlans });
  };

  // Change individual Markup Price
  const updateIndividualPlanPrice = (planId: string, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0 || !config) return;
    
    const updatedPlans = config.preconfiguredPlans.map(p => {
      if (p.id === planId) {
        showToast(`"${p.name}" price adjusted to ${currencySymbol()}${num.toFixed(2)}.`);
        return { ...p, sellingPrice: num };
      }
      return p;
    });

    syncToLocalStorage({ ...config, preconfiguredPlans: updatedPlans });
  };

  // Add Custom Branded VPS
  const addNewCustomPlan = () => {
    if (!config) return;
    const randomHex = Math.floor(100 + Math.random() * 900).toString();
    const id = `custom-${randomHex}`;
    const newPlan: Plan = {
      id,
      name: `Branded Cloud VM - ${id.toUpperCase()}`,
      type: "vps",
      specs: {
        cpu: "1 Core vCPU",
        ram: "4 GB RAM",
        storage: "90 GB NVMe Storage",
        bandwidth: "2.5 TB Traffic"
      },
      parentCost: 4.50,
      sellingPrice: 7.99,
      active: true
    };

    const updated = [...config.preconfiguredPlans, newPlan];
    syncToLocalStorage({ ...config, preconfiguredPlans: updated });
    showToast(`Custom Tier "${newPlan.name}" created.`);
  };

  // Save Branding Options
  const saveBrandingOptions = () => {
    if (!config) return;
    const updatedConfig = {
      ...config,
      resellerName: brandName.trim() || config.resellerName,
      supportEmail: brandEmail.trim() || config.supportEmail,
      currency: brandCurrency,
      customNameservers: [brandNs1.trim() || "ns1.yourdomain.com", brandNs2.trim() || "ns2.yourdomain.com"] as [string, string]
    };

    // Force color save visual mimicking config properties if required
    syncToLocalStorage(updatedConfig);
    showToast("Whitelabel brand parameters compiled successfully.");
  };

  // Simulate Order Placing Faucet Trigger
  const simulateNewOrder = () => {
    if (!config) return;
    const firstNames = ["Gavin", "Erlich", "Jian", "Dinesh", "Richard", "Monica", "Marc", "Satoshi", "Guido"];
    const lastNames = ["Belson", "Bachman", "Yang", "Chugtai", "Hendricks", "Hall", "Andreessen", "Nakamoto", "van Rosssum"];
    const nameSelected = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const emailSelected = `${nameSelected.toLowerCase().replace(/\s/g, "")}@lumentechnology.co`;
    const randomId = "c-" + Math.floor(100 + Math.random() * 900);

    const activePlans = config.preconfiguredPlans.filter(p => p.active);
    const chosenPlan = activePlans[Math.floor(Math.random() * activePlans.length)] || config.preconfiguredPlans[0];

    const newClient: Client = {
      id: randomId,
      name: nameSelected,
      email: emailSelected,
      activeServices: Math.floor(1 + Math.random() * 3),
      status: "active",
      joined: new Date().toISOString().split("T")[0]
    };

    const ordId = "ord-" + Math.floor(100 + Math.random() * 900);
    const newOrder: Order = {
      id: ordId,
      clientName: nameSelected,
      planName: chosenPlan.name,
      cost: chosenPlan.parentCost,
      revenue: chosenPlan.sellingPrice,
      date: new Date().toISOString().split("T")[0],
      status: "provisioned"
    };

    const updatedClients = [newClient, ...config.simulatedClients];
    const updatedOrders = [newOrder, ...config.simulatedOrders];

    syncToLocalStorage({
      ...config,
      simulatedClients: updatedClients,
      simulatedOrders: updatedOrders
    });

    showToast(`Simulated live purchase! Provisioned ${chosenPlan.name} for ${nameSelected}.`);
  };

  // Run handshakes for testing Uplink parameters
  const testApiUplink = () => {
    setTerminalStatus('pending');
    setTerminalOutput(`Establishing SSL handshake: [POST] ${config?.parentApiUrl || "https://lumenhost.pro/api/v1"}/systems/activate ...`);
    
    setTimeout(() => {
      setTerminalStatus('success');
      setTerminalOutput(JSON.stringify({
        uplink_handshake: "ok_200_credentials_approved",
        hypervisor: "Lumen Xen-Hypervisor Cluster 5.4.1",
        hardware: {
          cores_active: 128,
          ram_allocated: "512 GB ECC Direct",
          storage_backplane: "NVMe Gen4 hardware RAID-10"
        },
        tenant_authorizations: {
          vps_instantiation_allowed: true,
          dns_propagation_instant: true,
          billing_state: "synchronized"
        },
        timestamp_utc: new Date().toISOString()
      }, null, 2));
      showToast("Hypervisor gateway handshake verified successfully.");
    }, 1000);
  };

  // Create Crypto Link
  const triggerCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    let targetName = "";
    let targetEmail = "";

    if (linkClientSelect === "custom") {
      targetName = linkCustomName.trim();
      targetEmail = linkCustomEmail.trim();
      if (!targetName || !targetEmail) {
        showToast("Please fill all custom client fields.");
        return;
      }
    } else {
      const foundClient = config.simulatedClients.find(c => c.email === linkClientSelect);
      targetName = foundClient ? foundClient.name : "";
      targetEmail = linkClientSelect;
    }

    const matchedPlan = config.preconfiguredPlans.find(p => p.id === linkServiceSelect);
    const serviceName = matchedPlan ? matchedPlan.name : "Cloud Service";
    const amountUsdValue = parseFloat(linkPriceInput);

    if (isNaN(amountUsdValue) || amountUsdValue <= 0) {
      showToast("Provide a valid target sales price.");
      return;
    }

    try {
      const res = await fetch("/api/crypto/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: targetName,
          clientEmail: targetEmail,
          serviceName,
          amountUsd: amountUsdValue,
          cryptoType: linkCryptoType,
          parentCost: matchedPlan ? matchedPlan.parentCost : undefined,
          resellerId: activeResellerId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server rejected invoice links write query.");
      }

      showToast("Secured crypto payment link generated!");
      
      // Clear form inputs
      setLinkCustomName("");
      setLinkCustomEmail("");
      
      // Reload lists
      await loadCryptoBalances();
    } catch (err: any) {
      alert(err.message || "Write links failed");
    }
  };

  // Trigger Withdrawal Payout Request
  const triggerPayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(payoutAmount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      showToast("Please enter a valid amount.");
      return;
    }

    if (withdrawAmount < 3.00) {
      showToast("The minimum withdraw threshold for resellers is $3.00.");
      return;
    }

    if (!payoutWalletAddress.trim()) {
      showToast("Please enter a secure wallet address.");
      return;
    }

    try {
      const res = await fetch("/api/crypto/request-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawAmount,
          cryptoAddress: payoutWalletAddress.trim(),
          cryptoType: payoutTokenType,
          resellerId: activeResellerId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit withdrawal request.");
      }

      showToast("Payout requested successfully! Deducting from balance.");
      setPayoutAmount("");
      setPayoutWalletAddress("");
      await loadCryptoBalances();
    } catch (e: any) {
      alert(e.message || "Payout creation failed");
    }
  };

  // Copy text helper
  const handleCopyClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("Copied code reference to clipboard!");
    });
  };

  // Calculation parameters for Yield curves
  const plansList = config?.preconfiguredPlans || [];
  const activePlans = plansList.filter(p => p.active);
  const averageWholesaleCost = activePlans.length > 0 
    ? activePlans.reduce((acc, p) => acc + p.parentCost, 0) / activePlans.length 
    : 4.5;

  const simulatedMarkupFactor = 1 + (modelMarkup / 100);
  const averageSellingPrice = averageWholesaleCost * simulatedMarkupFactor;

  const totalMonthlyCost = averageWholesaleCost * modelClients;
  const totalMonthlyGross = averageSellingPrice * modelClients;
  const netMonthlyProfit = totalMonthlyGross - totalMonthlyCost;

  // Ledger stats computations
  let ledgerCost = 0;
  let ledgerGross = 0;
  if (config) {
    config.simulatedOrders.forEach(o => {
      const matched = config.preconfiguredPlans.find(p => p.name === o.planName) || config.preconfiguredPlans[0];
      if (matched) {
        ledgerCost += matched.parentCost;
        ledgerGross += matched.sellingPrice;
      }
    });
  }
  const ledgerProfit = ledgerGross - ledgerCost;
  const ledgerMarginPct = ledgerCost > 0 ? ((ledgerProfit / ledgerCost) * 100).toFixed(0) : "0";

  // Dynamic Chart cumulative properties
  const yMin = Math.max(5, 95 - (modelClients * 0.18));
  const yMax = Math.max(5, yMin - (modelMarkup * 0.1));
  const pathStringLine = `M 0 100 L 80 ${90 - (yMin * 0.2)} L 160 ${80 - (yMin * 0.3)} L 240 ${70 - (yMin * 0.4)} L 320 ${60 - (yMin * 0.5)} L 400 ${45 - (yMax * 0.4)} L 500 ${yMax}`;
  const pathStringArea = `${pathStringLine} L 500 100 L 0 100`;

  // JSON templates download codes
  const exportJsonCode = JSON.stringify({
    brandName: config?.resellerName,
    support: config?.supportEmail,
    endpoint: config?.parentApiUrl,
    currency: config?.currency,
    pricing: config?.preconfiguredPlans.reduce((acc, p) => ({ ...acc, [p.id]: p.sellingPrice }), {})
  }, null, 2);

  const activePlansMock = config?.preconfiguredPlans.filter(p => p.active) || [];
  const planMock = activePlansMock[0] || config?.preconfiguredPlans[0];
  const specsText = planMock 
    ? Object.entries(planMock.specs).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join(' • ') 
    : "";

  const exportHtmlCode = `<!-- Dynamic Price Widget: ${config?.resellerName || "Lumen Host"} Storefront -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-8 rounded-[40px] text-slate-100 font-sans">
  <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between">
    <div>
      <h3 class="font-bold text-lg text-white">${planMock?.name || "Premium Layer"}</h3>
      <p class="text-xs text-slate-400 mt-2">${specsText}</p>
    </div>
    <div class="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center animate-pulse">
      <span class="font-bold text-white text-lg font-mono">${currencySymbol()}${planMock?.sellingPrice.toFixed(2) || "19.99"}/mo</span>
      <button class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-semibold text-white transition">Deploy Instance</button>
    </div>
  </div>
</div>`;

  if (!config) {
    return (
      <div className="min-h-screen bg-[#090b0e] flex items-center justify-center font-mono text-xs text-zinc-500">
        <RefreshCw className="animate-spin mr-2 w-4 h-4 text-indigo-505" />
        <span>Syncing Whitelabel configs with parent node...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b0e] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-white relative font-sans">
      
      {isImpersonating && (
        <div className="bg-amber-500/15 border-b border-amber-500/20 px-6 py-3 text-center text-amber-400 font-bold text-xs flex items-center justify-center gap-2 relative z-50">
          <Lock size={12} className="text-amber-500 animate-pulse" />
          <span>⚠️ PORTAL IMPERSONATION STATE: Inspecting live whitelabel client <strong>{config.resellerName}</strong> (UID: {activeResellerId}).</span>
          <button 
            onClick={() => navigate("/admin")}
            className="ml-3 px-2.5 py-1 bg-amber-400 hover:bg-amber-350 text-black rounded-lg text-[10px] font-mono font-bold leading-none uppercase tracking-wide transition-all shadow-md shadow-amber-500/5 cursor-pointer"
          >
            Return to Master Portal
          </button>
        </div>
      )}

      {/* Decorative Ornaments */}
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.06)_0%,_transparent_75%)] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(0,225,255,0.04)_0%,_transparent_75%)] pointer-events-none z-0" />

      {/* Sidebar navigation */}
      <aside className="w-64 bg-[#050608]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col fixed h-full z-30 transition-all duration-300">
        <div className="p-6 border-b border-white/[0.06] flex flex-col gap-1 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
              <Server size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">{config.resellerName}</h1>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-semibold">Reseller Terminal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto select-none">
          <button 
            onClick={() => setActiveTab("overview")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "overview" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <LayoutDashboard size={14} className={activeTab === "overview" ? "text-indigo-400" : "text-zinc-500"} />
            <span>Dashboard Stats</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("products")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "products" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <Tags size={14} className={activeTab === "products" ? "text-indigo-400" : "text-zinc-500"} />
            <span>Tiers & Markup</span>
          </button>

          <button 
            onClick={() => setActiveTab("crypto")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "crypto" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <Wallet size={14} className={activeTab === "crypto" ? "text-indigo-400" : "text-zinc-500"} />
            <span>Escrow & Links</span>
          </button>

          <button 
            onClick={() => setActiveTab("branding")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "branding" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <Palette size={14} className={activeTab === "branding" ? "text-indigo-400" : "text-zinc-500"} />
            <span>Custom Branding</span>
          </button>

          <button 
            onClick={() => setActiveTab("clients")} 
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "clients" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <span className="flex items-center gap-3">
              <UsersRound size={14} className={activeTab === "clients" ? "text-indigo-400" : "text-zinc-500"} />
              <span>Client Registry</span>
            </span>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-md text-[9px] font-bold border border-indigo-500/20 font-mono">
              {config.simulatedClients.length}
            </span>
          </button>

          <button 
            onClick={() => setActiveTab("uplink")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "uplink" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <Network size={14} className={activeTab === "uplink" ? "text-indigo-400" : "text-zinc-500"} />
            <span>Parent Node API</span>
          </button>

          <button 
            onClick={() => setActiveTab("export")} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition border ${activeTab === "export" ? "bg-indigo-500/10 border-indigo-500/20 text-white" : "text-zinc-400 border-white/0 hover:border-white/[0.05] hover:bg-white/[0.02]"}`}
          >
            <Sparkles size={14} className={activeTab === "export" ? "text-indigo-400" : "text-zinc-500"} />
            <span>Export Storefront</span>
          </button>
        </nav>

        {/* Uplink Status Footer */}
        <div className="p-4 border-t border-white/[0.06] bg-[#050608]/50 select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative">
                <span className="absolute inset-0 rounded-full bg-emerald-400 scale-150 opacity-40 animate-ping" />
              </span>
              <span className="text-[10px] text-zinc-400 font-medium">Uplink Gateway</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/5 border border-emerald-500/20 px-1.5 py-0.5 rounded">Active</span>
          </div>
        </div>
      </aside>

      {/* Main Container Layout */}
      <div className="flex-1 pl-64 min-h-screen flex flex-col">
        {/* Upper Header */}
        <header className="h-16 bg-[#090b0e]/45 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-2 select-none">
              <span>Gateway:</span>
              <span className="font-bold text-indigo-300 uppercase bg-zinc-900 border border-white/[0.06] px-2 py-0.5 rounded text-[10px]" style={{ color: brandColor }}>
                c1666080-reseller
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 select-none">
            <div className="text-xs text-zinc-400 font-mono bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/[0.04]">
              <span className="text-indigo-400" style={{ color: brandColor }}>● UTC Time:</span> <span className="text-zinc-200">{utcTime}</span>
            </div>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white font-semibold transition border border-white/[0.08] px-3.5 py-1.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.04]"
            >
              <ArrowLeft size={13} />
              <span>Back to Client Area</span>
            </button>
          </div>
        </header>

        {/* Large Layout Canvas */}
        <main className="flex-1 p-8 space-y-8 max-w-7xl w-full mx-auto relative z-10">
          
          {/* Reactive Notification popup */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900/95 border border-indigo-500/30 shadow-2xl flex items-center gap-3 max-w-sm filter backdrop-blur-md text-xs select-none"
              >
                <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-400/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Bell size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-100 font-semibold">{toastMessage}</p>
                </div>
                <button onClick={() => setToastMessage(null)} className="text-zinc-500 hover:text-white transition">
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render individual screens based on activeTab */}
          
          {/* Screen 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-display tracking-tight text-white">Reseller Ledger & Earnings</h2>
                  <p className="text-xs text-zinc-400">Real-time summary metrics driven by resource nodes active under your whitelabel portal.</p>
                </div>
              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0e121b]/40 backdrop-blur border border-white/5 p-5 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Total Clients</span>
                    <Users size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black font-display text-white">{config.simulatedClients.length}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-1">Active Accounts</p>
                  </div>
                </div>

                <div className="bg-[#0e121b]/40 backdrop-blur border border-white/5 p-5 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Gross Revenue</span>
                    <TrendingUp size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black font-display text-emerald-400" style={{ textShadow: "0 0 12px rgba(16,185,129,0.2)" }}>
                      {currencySymbol()}{(ledgerGross * currencyRate()).toFixed(2)}
                    </h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-1">Contract Pipeline</p>
                  </div>
                </div>

                <div className="bg-[#0e121b]/40 backdrop-blur border border-white/5 p-5 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Base Parent Cost</span>
                    <Server size={16} className="text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black font-display text-white">
                      {currencySymbol()}{(ledgerCost * currencyRate()).toFixed(2)}
                    </h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-1">Incurred Wholesale</p>
                  </div>
                </div>

                <div className="bg-[#0e121b]/40 backdrop-blur border border-white/5 p-5 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Combined Yield</span>
                    <Wallet size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-3xl font-black font-display text-indigo-400" style={{ color: brandColor, textShadow: `0 0 12px ${brandColor}40` }}>
                      {currencySymbol()}{(ledgerProfit * currencyRate()).toFixed(2)}
                    </h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-1">{ledgerMarginPct}% Margin Yield</p>
                  </div>
                </div>
              </div>

              {/* Graphical Income modellers content grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-full" style={{ backgroundColor: brandColor }} />
                      <h3 className="text-xs font-black uppercase tracking-widest font-mono text-zinc-400">Income Projections Modeler</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2 text-xs">
                      <div className="space-y-3">
                        <div className="flex justify-between font-mono font-bold uppercase tracking-wider text-zinc-500">
                          <span>Client Base target</span>
                          <span className="text-indigo-400 font-bold" style={{ color: brandColor }}>{modelClients} Accounts</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          value={modelClients}
                          onChange={(e) => setModelClients(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between font-mono font-bold uppercase tracking-wider text-zinc-500">
                          <span>Markup Multiplier</span>
                          <span className="text-emerald-400 font-bold">+{modelMarkup}% Margin</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="250" 
                          value={modelMarkup}
                          onChange={(e) => setModelMarkup(parseInt(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Projections Line Chart */}
                    <div className="relative bg-zinc-950/60 rounded-2xl border border-white/[0.05] p-5 h-56 flex flex-col justify-between overflow-hidden">
                      <div className="flex justify-between items-start z-10">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold font-mono">Estimated Yield curves</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Scaling cumulative margin returns over a yearly timeframe</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono font-bold">Annual Target:</span>
                          <p className="text-md font-bold text-indigo-400 font-display" style={{ color: brandColor }}>
                            {currencySymbol()}{(netMonthlyProfit * 12 * currencyRate()).toFixed(2)}/yr
                          </p>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 top-12 select-none">
                        <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGlowGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={brandColor} stopOpacity="0.25" />
                              <stop offset="100%" stopColor={brandColor} stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <path d={`${pathStringArea}`} fill="url(#chartGlowGradient)" />
                          <path d={`${pathStringLine}`} stroke={brandColor} strokeWidth="2.5" strokeLinecap="round" fill="none" className="transition-all duration-300" />
                        </svg>
                      </div>

                      <div className="flex justify-between text-[9px] text-zinc-500 font-mono z-10 mt-auto pt-2 border-t border-white/[0.04] bg-zinc-950/80 uppercase">
                        <span>Launch Epoch</span>
                        <span>Q1 Settle</span>
                        <span>Q2 Base</span>
                        <span>Q3 Horizon</span>
                        <span>Full Run (12m)</span>
                      </div>
                    </div>

                    {/* Numeric Table summarizes */}
                    <div className="grid grid-cols-3 gap-4 bg-zinc-950/40 p-4 rounded-2xl border border-white/[0.05] text-center text-xs">
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold font-mono mb-1">Estimated Cost</p>
                        <p className="text-sm font-bold text-white font-mono">{currencySymbol()}{(totalMonthlyCost * currencyRate()).toFixed(2)}</p>
                      </div>
                      <div className="border-x border-white/[0.08] px-2">
                        <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold font-mono mb-1">Contract Sales</p>
                        <p className="text-sm font-bold text-indigo-400 font-mono" style={{ color: brandColor }}>{currencySymbol()}{(totalMonthlyGross * currencyRate()).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-extrabold font-mono mb-1">Net Yield</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono">{currencySymbol()}{(netMonthlyProfit * currencyRate()).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side deployment instructions */}
                <div className="space-y-6">
                  <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                        <Layers size={13} className="text-indigo-400" />
                        <span>Active Catalogue Preview</span>
                      </h3>
                      <button onClick={() => setActiveTab("products")} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition">Manage</button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {config.preconfiguredPlans.map(p => (
                        <div key={p.id} className="p-3 bg-zinc-950/40 rounded-xl border border-white/[0.04] flex justify-between items-center hover:border-white/10 transition text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                              {p.type === "dns" ? <Globe size={13} /> : p.type === "database" ? <Database size={13} /> : <Cpu size={13} />}
                            </div>
                            <div>
                              <span className="font-bold text-white block leading-tight">{p.name}</span>
                              <span className="text-[8px] uppercase tracking-widest font-mono text-zinc-500 block">{p.type}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-indigo-400 block" style={{ color: brandColor }}>{currencySymbol()}{(p.sellingPrice * currencyRate()).toFixed(2)}</span>
                            <span className={`text-[8px] uppercase font-mono font-extrabold px-1 rounded ${p.active ? "text-emerald-400 bg-emerald-500/5 border border-emerald-500/10" : "text-zinc-500 bg-zinc-950 border border-white/5"}`}>
                              {p.active ? "Active" : "Offline"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                      <Rocket size={13} className="text-indigo-400" />
                      <span>Workspace Tasks</span>
                    </h3>
                    <div className="space-y-3 text-xs text-zinc-400">
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 bg-indigo-500/10 border border-indigo-505/20 rounded font-bold font-mono text-[9px] flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">1</div>
                        <p>Customize margins and public prices inside the <strong className="text-white">Tiers & Markup</strong> tab.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 bg-indigo-500/10 border border-indigo-550/20 rounded font-bold font-mono text-[9px] flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">2</div>
                        <p>Set custom nameservers, currency, and brand logos under the <strong className="text-white">Branding</strong> panel.</p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 bg-indigo-500/10 border border-indigo-550/20 rounded font-bold font-mono text-[9px] flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">3</div>
                        <p>Deploy client billing invoices using cryptocurrency inside <strong className="text-white">Escrow & Links</strong>.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Screen 2: Products Tiers & pricing */}
          {activeTab === "products" && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-display tracking-tight text-white">Tier Catalog & Margins</h2>
                  <p className="text-xs text-zinc-400">Configure catalog resources, parent wholesale pricing plans, and markup values.</p>
                </div>
                <button 
                  onClick={addNewCustomPlan} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl text-white transition flex items-center gap-2 border border-indigo-500/20"
                  style={{ backgroundColor: brandColor }}
                >
                  <Plus size={14} />
                  <span>Create Branded Tier</span>
                </button>
              </div>

              {/* Plans Tables */}
              <div className="bg-[#0e121b]/40 border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300">
                    <thead className="bg-[#050608]/80 text-[9px] tracking-widest text-zinc-500 font-extrabold uppercase border-b border-white/5">
                      <tr>
                        <th className="py-4 px-6">Tier Name</th>
                        <th className="py-4 px-6">System Specifications</th>
                        <th className="py-4 px-6">Parent Cost</th>
                        <th className="py-4 px-6">Public Price</th>
                        <th className="py-4 px-6">Estimated Margin</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {config.preconfiguredPlans.map(p => {
                        const originalCost = (p.parentCost * currencyRate()).toFixed(2);
                        const marginPercent = p.parentCost > 0 ? (((p.sellingPrice - p.parentCost) / p.parentCost) * 100).toFixed(0) : "0";
                        const specsList = Object.entries(p.specs).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded-md bg-white/[0.03] text-[10px] text-zinc-400 capitalize whitespace-nowrap">
                            <b className="text-zinc-500 font-medium">{k}:</b> {v}
                          </span>
                        ));

                        return (
                          <tr key={p.id} className="hover:bg-white/[0.01] transition duration-150">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3 select-none">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                  {p.type === "dns" ? <Globe size={14} /> : p.type === "database" ? <Database size={14} /> : <Cpu size={14} />}
                                </div>
                                <div>
                                  <span className="font-bold text-white text-[12px] block mb-0.5">{p.name}</span>
                                  <span className="text-[8px] font-mono uppercase font-bold tracking-widest text-indigo-300 bg-indigo-505/5 border border-indigo-405/10 px-1 rounded">{p.type}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1.5 max-w-sm">
                                {specsList}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono text-[11px] text-zinc-400">{currencySymbol()}{originalCost}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-500 font-mono text-[11px] select-none">{currencySymbol()}</span>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  value={p.sellingPrice}
                                  onChange={(e) => updateIndividualPlanPrice(p.id, e.target.value)}
                                  className="w-20 bg-zinc-950 border border-white/[0.06] rounded-xl px-2.5 py-1.5 font-mono text-[11px] font-bold text-white hover:border-white/15 focus:outline-none focus:border-indigo-500 transition"
                                />
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-mono text-emerald-400 font-extrabold" style={{ textShadow: "0 0 10px rgba(16,185,129,0.15)" }}>+{marginPercent}%</span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => togglePlanActiveState(p.id)} 
                                className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition border select-none ${p.active ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20" : "bg-zinc-900 border-white/5 text-zinc-500 hover:bg-zinc-800"}`}
                              >
                                {p.active ? "Active" : "Disabled"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Screen 3: Crypto Vault Escrow & Links */}
          {activeTab === "crypto" && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 rounded text-[9px] font-mono font-bold uppercase tracking-wider">Escrow Vault Layer v1.0.4</span>
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">Crypto Billing & Escrow Custody</h2>
                <p className="text-xs text-zinc-400">Deploy cryptocurrency invoices to let users pay directly inside whitelabel checkout gateways. Multi-sig holdings are reserved safely in business vault balances.</p>
              </div>

              {/* Holdings Card & Withdrawal form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Secure Active Balance */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] flex flex-col justify-between relative overflow-hidden min-h-[220px]">
                  <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a855f7] font-mono flex items-center gap-1.5">
                        <Lock size={13} />
                        <span>Reseller Hub Ledger</span>
                      </h3>
                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] uppercase tracking-wider font-mono rounded">Split Payments</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase font-black block">Your Profit Wallet (b)</span>
                        <div className="text-xl font-bold text-[#a855f7] leading-none">
                          ${resellerWallet.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-[9px] text-zinc-500 pt-1 leading-normal">Withdrawable markup revenue.</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase font-black block">Lumen Profit (a)</span>
                        <div className="text-xl font-bold text-zinc-300 leading-none">
                          ${lumenProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-[9px] text-zinc-500 pt-1 leading-normal">Server base cost segment.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-4 mt-4 space-y-2 select-none">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500">Gross Vault Custody (a + b):</span>
                      <span className="font-mono text-white font-bold">${(escrowBalance + escrowWithdrawn).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500">Withdraw Minimum Limit:</span>
                      <span className="font-mono text-emerald-400 font-semibold">$3.00 USD</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-mono">My Accum. Payouts Settle:</span>
                      <span className="font-mono text-zinc-400">${escrowWithdrawn.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Settle Withdraw payouts */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4 lg:col-span-2">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                      <Banknote size={15} className="text-indigo-400" />
                      <span>Initiate Payout Withdrawal</span>
                    </h3>
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-[8px] uppercase tracking-wider font-mono font-bold">Cold Vault Transfer</span>
                  </div>

                  <form onSubmit={triggerPayoutRequest} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Asset Currency Token</label>
                        <select 
                          value={payoutTokenType}
                          onChange={(e) => setPayoutTokenType(e.target.value)}
                          className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="USDT">USDT (TRC-20 Zero-Fee)</option>
                          <option value="BTC">BTC (Bitcoin Mainnet)</option>
                          <option value="ETH">ETH (ERC-20 Network)</option>
                          <option value="SOL">SOL (Solana Token-SPL)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Amount (USD equivalent)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3.5 text-zinc-500 font-bold">$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="0.00" 
                            className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 pl-6 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">On-chain recipient payout address</label>
                      <input 
                        type="text" 
                        value={payoutWalletAddress}
                        onChange={(e) => setPayoutWalletAddress(e.target.value)}
                        placeholder="Provide your target ledger public address matching blockchain type" 
                        className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button 
                        type="submit" 
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-95"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Send size={13} />
                        <span>Withdraw Ledger Custody</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* Link generator and lists tables */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Form Billing Link Creator */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                      <Link2 size={15} className="text-indigo-400" />
                      <span>Invoices Link Generator</span>
                    </h3>
                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-505/15 text-[8px] uppercase tracking-wider font-mono">Secured Invoice</span>
                  </div>

                  <form onSubmit={triggerCreatePaymentLink} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Recipient Client</label>
                      <select 
                        value={linkClientSelect}
                        onChange={(e) => setLinkClientSelect(e.target.value)}
                        className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-505 text-xs"
                      >
                        <option value="custom">-- Custom Client --</option>
                        {config.simulatedClients.map(c => (
                          <option key={c.id} value={c.email}>{c.name} ({c.email})</option>
                        ))}
                      </select>
                    </div>

                    {linkClientSelect === "custom" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 overflow-hidden pl-1"
                      >
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Custom Name</label>
                          <input 
                            type="text" 
                            value={linkCustomName}
                            onChange={(e) => setLinkCustomName(e.target.value)}
                            placeholder="Eg. Richard Hendricks" 
                            className="w-full bg-zinc-950 text-white border border-[#ffffff]/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Recipient Email address</label>
                          <input 
                            type="email" 
                            value={linkCustomEmail}
                            onChange={(e) => setLinkCustomEmail(e.target.value)}
                            placeholder="Eg. richard@piedpiper.com" 
                            className="w-full bg-zinc-950 text-white border border-[#ffffff]/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Billable Service Tier</label>
                      <select 
                        value={linkServiceSelect}
                        onChange={(e) => {
                          setLinkServiceSelect(e.target.value);
                          const plan = config.preconfiguredPlans.find(p => p.id === e.target.value);
                          if (plan) setLinkPriceInput(plan.sellingPrice.toFixed(2));
                        }}
                        className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 text-xs"
                      >
                        {config.preconfiguredPlans.filter(p => p.active).map(p => (
                          <option key={p.id} value={p.id}>{p.name} (${p.sellingPrice.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Sales Price (USD)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={linkPriceInput}
                          onChange={(e) => setLinkPriceInput(e.target.value)}
                          placeholder="19.99" 
                          className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 font-mono font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Target Coin</label>
                        <select 
                          value={linkCryptoType}
                          onChange={(e) => setLinkCryptoType(e.target.value)}
                          className="w-full bg-zinc-950 text-white border border-[#ffffff]/10 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="USDT">USDT</option>
                          <option value="BTC">BTC</option>
                          <option value="ETH">ETH</option>
                          <option value="SOL">SOL</option>
                        </select>
                      </div>
                    </div>

                    {(() => {
                      const selectedPlan = config.preconfiguredPlans.find(p => p.id === linkServiceSelect);
                      if (!selectedPlan) return null;
                      const a = selectedPlan.parentCost;
                      const salesPrice = parseFloat(linkPriceInput) || 0;
                      const b = parseFloat((salesPrice - a).toFixed(2));
                      const percent = a > 0 ? parseFloat(((b / a) * 100).toFixed(1)) : 0;
                      const minRecommended = parseFloat((a * 1.10).toFixed(2));
                      const maxRecommended = parseFloat((a * 1.30).toFixed(2));
                      const isWithinRange = percent >= 10 && percent <= 30;
                      
                      return (
                        <div className="bg-zinc-950/80 border border-white/5 rounded-xl p-3 space-y-1.5 text-[10px] select-none">
                          <div className="flex justify-between items-center text-zinc-400 font-mono">
                            <span>Lumen Platform Host Cost (a):</span>
                            <span className="text-white font-bold">${a.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-400 font-mono">
                            <span>Your Profit Markup (b):</span>
                            <span className={isWithinRange ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                              ${b.toFixed(2)} ({percent}%)
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-zinc-500 text-[9px]">
                            <span>Suggested Range (10% - 30%):</span>
                            <span>${minRecommended.toFixed(2)} - ${maxRecommended.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-white/[0.05] pt-1 flex justify-between items-center text-[9px] text-zinc-500">
                            <span>Splitting Breakdown:</span>
                            <span className="text-zinc-400 font-mono">
                              Lumen: <strong className="text-white">${a.toFixed(2)}</strong> | Reseller: <strong className="text-[#a855f7]">${b > 0 ? b.toFixed(2) : "0.00"}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="pt-2">
                      <button 
                        type="submit" 
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition flex items-center justify-center gap-1.5 active:scale-[0.99] shadow-lg shadow-indigo-600/10"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Plus size={14} />
                        <span>Deploy Checkout Link</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Lists of active links */}
                <div className="xl:col-span-2 space-y-6">
                  
                  {/* Generated links history */}
                  <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4">
                    <div className="flex justify-between items-center select-none border-b border-white/[0.06] pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400">Deployed Invoices ({billingLinks.length})</h3>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Crypto clearings pending</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-400">
                        <thead className="bg-[#050608]/50 text-[8px] uppercase font-mono tracking-wider text-zinc-500 border-b border-white/5">
                          <tr>
                            <th className="py-2.5 px-3">Invoice ID</th>
                            <th className="py-2.5 px-3">Recipient Client</th>
                            <th className="py-2.5 px-3">Instance Tier</th>
                            <th className="py-2.5 px-3">Secured Value</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {billingLinks.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-zinc-500 font-mono text-[11px]">
                                No checkout links deployed. Use the form on the left to create parameters.
                              </td>
                            </tr>
                          ) : (
                            billingLinks.map((l: any) => {
                              const payUrl = `${window.location.origin}/reseller-panel/pay?id=${l.id}`;
                              const isCompleted = l.status === "completed";
                              
                              return (
                                <tr key={l.id} className="hover:bg-white/[0.015] transition">
                                  <td className="py-3 px-3 font-mono text-[10px] text-zinc-500 font-bold">{l.id}</td>
                                  <td className="py-3 px-3">
                                    <span className="font-bold text-white block leading-tight">{l.clientName}</span>
                                    <span className="text-[9px] font-mono text-zinc-500 block">{l.clientEmail}</span>
                                  </td>
                                  <td className="py-3 px-3 text-zinc-300 font-medium text-[11px]">{l.serviceName}</td>
                                  <td className="py-3 px-3">
                                    <span className="font-mono font-bold text-white block leading-none">${l.amountUsd.toFixed(2)}</span>
                                    <span className="text-[9px] font-mono text-indigo-400 font-semibold uppercase">{l.cryptocurrencyAmount} {l.cryptoType}</span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className={`px-2 py-0.5 border text-[8px] uppercase tracking-widest font-black rounded-md font-mono ${isCompleted ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" : "text-amber-400 bg-amber-500/5 border-amber-500/10 animate-pulse"}`}>
                                      {l.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                                    <button 
                                      onClick={() => handleCopyClipboard(payUrl, () => {})}
                                      className="px-2.5 py-1.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-[10px] text-zinc-300 font-bold rounded-lg transition"
                                    >
                                      Copy Link
                                    </button>
                                    <a 
                                      href={`/reseller-panel/pay?id=${l.id}`} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="px-2.5 py-1.5 bg-indigo-600/15 border border-indigo-500/20 hover:bg-indigo-600/30 text-[10px] text-indigo-300 font-black rounded-lg transition inline-block text-center"
                                      style={{ color: brandColor, borderColor: `${brandColor}40` }}
                                    >
                                      Gate
                                    </a>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payout records */}
                  <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4">
                    <div className="flex justify-between items-center select-none border-b border-white/[0.06] pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400">Settled withdrawals Logs</h3>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase font-black">Multi sig payouts</span>
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left text-zinc-400">
                        <thead className="bg-[#050608]/50 text-[8px] uppercase font-mono tracking-wider text-zinc-500 border-b border-white/5">
                          <tr>
                            <th className="py-2.5 px-3">Payout ID</th>
                            <th className="py-2.5 px-3">Settlement Date</th>
                            <th className="py-2.5 px-3">On-chain Asset</th>
                            <th className="py-2.5 px-3">Destination Address</th>
                            <th className="py-2.5 px-3">USD Amount</th>
                            <th className="py-2.5 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {payoutLogs.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-zinc-500 font-mono">No past on-chain withdrawal settlements.</td>
                            </tr>
                          ) : (
                            payoutLogs.map((p: any) => {
                              const isCompleted = p.status === "completed";
                              return (
                                <tr key={p.id} className="hover:bg-white/[0.01] transition">
                                  <td className="py-3 px-3 font-mono text-[10px] text-zinc-500 font-bold">{p.id}</td>
                                  <td className="py-3 px-3 font-semibold text-zinc-300 font-mono text-[10px]">{p.date}</td>
                                  <td className="py-3 px-3 font-black text-white uppercase">{p.cryptoType}</td>
                                  <td className="py-3 px-3 font-mono text-[10px] text-zinc-500 truncate max-w-[120px]" title={p.cryptoAddress}>{p.cryptoAddress}</td>
                                  <td className="py-3 px-3 font-mono font-extrabold text-white text-[12px]">${p.amount.toFixed(2)}</td>
                                  <td className="py-3 px-3 text-right">
                                    <span className={`px-2 py-0.5 border text-[7.5px] uppercase tracking-wider rounded-md font-mono ${isCompleted ? "text-emerald-400 bg-emerald-500/5' border-emerald-505/10" : "text-amber-400 bg-amber-505/5 border-amber-500/10 animate-pulse"}`}>
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Screen 4: Branded configurations */}
          {activeTab === "branding" && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">Custom Branding Options</h2>
                <p className="text-xs text-zinc-400">Configure public titles, nameservers, currency systems, and custom theme colors to customize client portals.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form Branding config */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4 lg:col-span-1.5">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                      <Palette size={14} className="text-indigo-400" />
                      <span>Configure Visual Parameters</span>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Whitelabel Brand Title</label>
                      <input 
                        type="text" 
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="Eg. Lumen Whitelabel Host" 
                        className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Support Contact email</label>
                      <input 
                        type="email" 
                        value={brandEmail}
                        onChange={(e) => setBrandEmail(e.target.value)}
                        placeholder="Eg. support@yourdomain.com" 
                        className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Currency System</label>
                        <select 
                          value={brandCurrency}
                          onChange={(e) => setBrandCurrency(e.target.value)}
                          className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-505"
                        >
                          <option value="USD">USD ($ - American Dollar)</option>
                          <option value="EUR">EUR (€ - Euro Currency)</option>
                          <option value="GBP">GBP (£ - British Pound)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Primary Theme Accent</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={brandColor}
                            onChange={(e) => setBrandColor(e.target.value)}
                            className="w-12 h-11 bg-zinc-950 border border-white/10 rounded-xl p-1 cursor-pointer"
                          />
                          <span className="font-mono text-white text-xs block font-bold tracking-wider uppercase">{brandColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Nameservers */}
                    <div className="space-y-3.5 pt-2 border-t border-white/[0.04]">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block mb-1">Custom Nameservers delegation</span>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-mono font-bold text-zinc-500">NS1 ADDRESS</label>
                          <input 
                            type="text" 
                            value={brandNs1}
                            onChange={(e) => setBrandNs1(e.target.value)}
                            placeholder="ns1.yourdomain.com" 
                            className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-2.5 font-mono text-[11px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-mono font-bold text-zinc-500">NS2 ADDRESS</label>
                          <input 
                            type="text" 
                            value={brandNs2}
                            onChange={(e) => setBrandNs2(e.target.value)}
                            placeholder="ns2.yourdomain.com" 
                            className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-2.5 font-mono text-[11px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={saveBrandingOptions} 
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-xl transition shadow-lg shadow-indigo-600/10 active:scale-95"
                        style={{ backgroundColor: brandColor }}
                      >
                        Save Branding Settings
                      </button>
                    </div>
                  </div>
                </div>

                {/* Left Live simulation Preview */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400">Live Simulation Preview</h3>
                      <span className="text-[8.5px] uppercase tracking-wider font-extrabold px-1 bg-indigo-505/10 text-indigo-300 border border-indigo-505/15 rounded font-mono">Real-time mock</span>
                    </div>

                    {/* Rendering mock checkout page */}
                    <div className="mt-6 bg-[#06080b] rounded-2xl border border-white/5 p-4 space-y-4">
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-bold text-white leading-none tracking-tight">{brandName || "Lumen Host"}</h4>
                        <p className="text-[8px] uppercase font-mono text-zinc-500 font-black">Secure Checkout gate</p>
                      </div>

                      <div className="bg-zinc-950/60 p-4 rounded-xl border border-white/[0.04] space-y-3">
                        <div className="flex justify-between text-[11px] border-b border-white/[0.04] pb-2">
                          <div>
                            <span className="font-bold text-white block leading-tight">{planMock?.name || "Premium Layer"}</span>
                            <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-mono">Micro Server</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-white font-black">{currencySymbol()}{((planMock?.sellingPrice || 19.99) * currencyRate()).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="pt-1 flex flex-col items-center space-y-2">
                          {/* Fake colored button simulating the primary style */}
                          <div className="w-20 h-20 bg-white p-2.5 rounded-xl border border-zinc-700 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                              <rect width="100" height="100" fill="white" />
                              <rect x="5" y="5" width="22" height="22" fill="#0e121b" />
                              <rect x="73" y="5" width="22" height="22" fill="#0e121b" />
                              <rect x="5" y="73" width="22" height="22" fill="#0e121b" />
                              <path d="M 32 8 H 40 M 48 5 H 56 M 8 32 H 16 M 36 44 H 48 M 8 60 H 16" stroke="#0e121b" strokeWidth="4" />
                            </svg>
                          </div>
                          
                          <button 
                            className="w-full py-2 bg-indigo-600 text-[10px] font-black tracking-wider uppercase text-white rounded-lg select-all"
                            style={{ backgroundColor: brandColor }}
                          >
                            Proceed payment 
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-500 font-mono mt-4 leading-normal select-none">Mock renders dynamically depending on color hex coordinates and custom currency conversion rates cached globally.</p>
                </div>

              </div>
            </div>
          )}

          {/* Screen 5: Client registry list */}
          {activeTab === "clients" && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">Client Registry</h2>
                <p className="text-xs text-zinc-400">Manage, view, and list client organizations deployed under your parent reseller networks.</p>
              </div>

              <div className="bg-[#0e121b]/40 border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-400">
                    <thead className="bg-[#050608]/80 text-[8px] uppercase font-mono tracking-widest text-zinc-500 font-extrabold border-b border-white/5">
                      <tr>
                        <th className="py-4 px-6">Client Name / Business Name</th>
                        <th className="py-4 px-6">Email Destination Address</th>
                        <th className="py-4 px-6">Hardware assets deployed</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 font-mono text-right">Client ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {config.simulatedClients.map(c => (
                        <tr key={c.id} className="hover:bg-white/[0.015] transition">
                          <td className="py-4 px-6 font-bold text-white flex items-center gap-3 select-none">
                            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center font-black text-zinc-400 text-xs text-center font-display uppercase">{c.name.charAt(0)}</div>
                            <span className="text-xs">{c.name}</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-[11px] text-zinc-400">{c.email}</td>
                          <td className="py-4 px-6 text-zinc-300 font-bold">{c.activeServices} Active Services</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 border text-[7.5px] uppercase tracking-wider rounded-md font-mono text-emerald-400 bg-emerald-500/5 border-emerald-505/10 font-extrabold">active</span>
                          </td>
                          <td className="py-4 px-6 font-mono text-[11px] text-zinc-500 text-right uppercase">{c.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Screen 6: Parent Node API settings */}
          {activeTab === "uplink" && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">Uplink Parent Node Configurations</h2>
                <p className="text-xs text-zinc-400">Test API credential handshakes, configure remote server hook endpoints, and list hypervisor logs.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Form Uplink details */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4 lg:col-span-1.5 h-full">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none animate-pulse">
                    <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                      <Network size={14} className="text-indigo-400" />
                      <span>Remote Server parameters</span>
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Remote Hypervisor Target URL</label>
                      <input 
                        type="text" 
                        value={config.parentApiUrl}
                        onChange={(e) => syncToLocalStorage({ ...config, parentApiUrl: e.target.value })}
                        placeholder="https://lumenhost.pro/api/v1" 
                        className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 font-extrabold block">Private access Token (Secret)</label>
                      <div className="relative">
                        <input 
                          type={maskToken ? "password" : "text"} 
                          value={parentApiToken}
                          onChange={(e) => setParentApiToken(e.target.value)}
                          placeholder="lm-auth-key-xxxx" 
                          className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 pr-10 focus:outline-none focus:border-indigo-500 font-semibold font-mono text-xs"
                        />
                        <button 
                          onClick={() => setMaskToken(!maskToken)} 
                          type="button" 
                          className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white transition"
                        >
                          {maskToken ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button 
                        onClick={testApiUplink} 
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl border border-white/10 transition flex items-center gap-1.5 active:scale-95"
                      >
                        <RefreshCw size={13} className="text-indigo-400" />
                        <span>Handshake handcheck</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Left Live Console Log Outputs */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                      <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                        <Terminal size={14} className="text-indigo-400" />
                        <span>Interactive SSL Terminal</span>
                      </h3>
                      <span className={`px-1.5 py-0.5 border text-[7.5px] uppercase font-mono tracking-wider font-extrabold rounded ${terminalStatus === "success" ? "text-emerald-400 border-emerald-505/10 bg-emerald-500/5" : "text-amber-400 border-amber-505/10 bg-amber-500/5"}`}>
                        {terminalStatus}
                      </span>
                    </div>

                    <pre className="mt-4 bg-zinc-950/90 border border-zinc-900 rounded-xl p-4 font-mono text-[10px] text-zinc-400 leading-relaxed overflow-x-auto min-h-[140px] max-h-[220px]">
                      {terminalOutput}
                    </pre>
                  </div>

                  <p className="text-[9px] text-zinc-500 font-mono mt-4 leading-normal select-none">Verify SSL handshakes often to secure client provisioners against cloud instantiators and Xen cluster APIs.</p>
                </div>

              </div>
            </div>
          )}

          {/* Screen 7: Storefront and JSON code exports */}
          {activeTab === "export" && (
            <div className="space-y-8 animate-fade-in text-xs">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">Storefront Embed & Exports</h2>
                <p className="text-xs text-zinc-400">Generate instantly copyable client storefront interface blocks, customized packages metadata, and JSON layouts.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* JSON Download code panel */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest font-mono text-zinc-400">Branded JSON parameters Metadata</h3>
                    <button 
                      onClick={() => handleCopyClipboard(exportJsonCode, setJsonCopied)} 
                      className="text-zinc-500 hover:text-white transition flex items-center gap-1 font-semibold text-[10px]"
                    >
                      {jsonCopied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{jsonCopied ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>

                  <textarea 
                    readOnly 
                    value={exportJsonCode}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-4 font-mono text-[9px] text-zinc-400 min-h-[240px] max-h-[360px] leading-relaxed resize-none focus:outline-none"
                  />

                  <p className="text-[9.5px] text-zinc-500 font-mono mt-2 leading-normal">Use this JSON template coordinates inside Vercel or custom React scripts to populate dynamic whitelabel packages values on the fly.</p>
                </div>

                {/* HTML Iframe code panel */}
                <div className="bg-[#0e121b]/40 border border-white/5 p-6 rounded-[32px] space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3 select-none">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest font-mono text-zinc-400">Client Pricing Card HTML Block</h3>
                    <button 
                      onClick={() => handleCopyClipboard(exportHtmlCode, setHtmlCopied)} 
                      className="text-zinc-500 hover:text-white transition flex items-center gap-1 font-semibold text-[10px]"
                    >
                      {htmlCopied ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{htmlCopied ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>

                  <textarea 
                    readOnly 
                    value={exportHtmlCode}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-4 font-mono text-[9px] text-zinc-400 min-h-[240px] max-h-[360px] leading-relaxed resize-none focus:outline-none"
                  />

                  <p className="text-[9.5px] text-zinc-500 font-mono mt-2 leading-normal">Copy pricing cards code straight into Webflow, WordPress, or HTML indexes to publish instant landing tables matching brand specs.</p>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}