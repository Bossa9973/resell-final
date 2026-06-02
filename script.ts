/**
 * Standalone Lumen Whitelabel Control Panel Script
 * Written in strongly typed TypeScript and modern ES module patterns.
 */

// --- Interfaces & Type Guards ---
export interface SpecSheet {
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

export interface Plan {
  id: string;
  name: string;
  type: 'vps' | 'dns' | 'database' | string;
  specs: SpecSheet;
  parentCost: number;
  sellingPrice: number;
  active: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  activeServices: number;
  status: 'active' | 'suspended' | string;
  joined: string;
}

export interface Order {
  id: string;
  clientName: string;
  planName: string;
  cost: number;
  revenue: number;
  date: string;
  status: 'provisioned' | 'pending_install' | 'failed' | string;
}

export interface ResellerConfig {
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

// --- Active State Registry ---
let configData: ResellerConfig = {
  resellerName: "Lumen Whitelabel Host",
  supportEmail: "support@yourdomain.com",
  currency: "USD",
  marginMultiplier: 1.4,
  parentApiUrl: "https://lumenhost.pro/api/v1",
  customNameservers: ["ns1.yourdomain.com", "ns2.yourdomain.com"],
  preconfiguredPlans: [],
  simulatedClients: [],
  simulatedOrders: []
};

// Currency Definitions
interface CurrencyMeta {
  symbol: string;
  rate: number;
}

const currencyRates: Record<string, CurrencyMeta> = {
  USD: { symbol: '$', rate: 1.0 },
  EUR: { symbol: '€', rate: 0.92 },
  GBP: { symbol: '£', rate: 0.79 }
};

// --- Initialization Handler ---
window.addEventListener('DOMContentLoaded', async () => {
  await loadConfigState();
  initializeClock();
  initializeUI();
  runFinancialProjections();
  
  // Expose functions to window scope for HTML event handlers
  (window as any).switchTab = switchTab;
  (window as any).togglePlanActiveState = togglePlanActiveState;
  (window as any).updateIndividualPlanPrice = updateIndividualPlanPrice;
  (window as any).addNewCustomPlan = addNewCustomPlan;
  (window as any).saveBrandingOptions = saveBrandingOptions;
  (window as any).updateLiveBrandingSimulation = updateLiveBrandingSimulation;
  (window as any).copyToClipboard = copyToClipboard;
  (window as any).runFinancialProjections = runFinancialProjections;
  (window as any).toggleTokenMask = toggleTokenMask;
  (window as any).simulateNewOrder = simulateNewOrder;
  (window as any).testApiUplink = testApiUplink;
  (window as any).saveUplinkSettings = saveUplinkSettings;
  (window as any).triggerCreatePaymentLink = triggerCreatePaymentLink;
  (window as any).triggerPayoutRequest = triggerPayoutRequest;
  (window as any).loadCryptoDashboardData = loadCryptoDashboardData;
});

// --- Dynamic Real-Time UTC Clock ---
function initializeClock(): void {
  const clockElement = document.getElementById('utc-clock');
  const updateTime = () => {
    const now = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    if (clockElement) {
      clockElement.innerText = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
    }
  };
  updateTime();
  setInterval(updateTime, 1000);
}

// --- Local Storage Synchronization & API fetching ---
async function loadConfigState(): Promise<void> {
  try {
    const cached = localStorage.getItem('lumen_reseller_config');
    if (cached) {
      configData = JSON.parse(cached);
      console.log("[Reseller TypeScript] State loaded successfully from LocalStorage cache.");
    } else {
      console.log("[Reseller TypeScript] Cache empty, pulling system config blueprint...");
      let response = await fetch("./config.json");
      if (!response.ok) {
        response = await fetch("/config.json");
      }
      if (!response.ok) {
        response = await fetch("/reseller-panel/config.json");
      }
      
      if (response.ok) {
        configData = await response.json();
        // Set fallback custom nameservers if missing
        if (!configData.customNameservers || configData.customNameservers.length < 2) {
          configData.customNameservers = ["ns1.yourdomain.com", "ns2.yourdomain.com"];
        }
      }
    }
  } catch (err) {
    console.error("[Reseller TypeScript] Bootstrapping failed:", err);
  }
}

function saveConfigState(): void {
  localStorage.setItem('lumen_reseller_config', JSON.stringify(configData));
  
  // Custom storage event trigger for immediate iframe/tab mirroring
  window.dispatchEvent(new Event('storage'));
  
  // Refresh calculations and tables
  renderAllData();
  runFinancialProjections();
  updateExportCodePreviews();
}

// --- Notification Toast ---
function showNotification(message: string): void {
  const toast = document.getElementById('status-toast');
  const text = document.getElementById('status-toast-text');
  if (toast && text) {
    text.innerText = message;
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    
    // Auto timeout dismissal
    setTimeout(() => {
      toast.classList.remove('flex');
      toast.classList.add('hidden');
    }, 4000);
  }
}

// --- UI Rendering ---
function initializeUI(): void {
  // Pull current brand inputs from config
  const brandNameInput = document.getElementById('brand-name-input') as HTMLInputElement;
  const brandEmailInput = document.getElementById('brand-email-input') as HTMLInputElement;
  const currencySelect = document.getElementById('brand-currency-select') as HTMLSelectElement;
  const parentUrlInput = document.getElementById('parent-api-url-input') as HTMLInputElement;
  const nsBlock = document.getElementById('nameservers-block');

  if (brandNameInput) brandNameInput.value = configData.resellerName;
  if (brandEmailInput) brandEmailInput.value = configData.supportEmail;
  if (currencySelect) currencySelect.value = configData.currency;
  if (parentUrlInput) parentUrlInput.value = configData.parentApiUrl;
  
  if (nsBlock) {
    const inputs = nsBlock.getElementsByTagName('input');
    if (inputs.length >= 2) {
      inputs[0].value = configData.customNameservers[0] || 'ns1.yourdomain.com';
      inputs[1].value = configData.customNameservers[1] || 'ns2.yourdomain.com';
    }
  }

  // Bind dynamic range slider values
  const sliderClients = document.getElementById('slider-clients') as HTMLInputElement;
  const sliderMarkup = document.getElementById('slider-markup') as HTMLInputElement;
  if (sliderClients) {
    sliderClients.addEventListener('input', () => runFinancialProjections());
  }
  if (sliderMarkup) {
    sliderMarkup.addEventListener('input', () => runFinancialProjections());
  }

  // Bind keypress events for inputs to instantly trigger previews
  if (brandNameInput) {
    brandNameInput.addEventListener('input', () => updateLiveBrandingSimulation());
  }
  const colorPicker = document.getElementById('brand-color-picker') as HTMLInputElement;
  if (colorPicker) {
    colorPicker.addEventListener('input', () => updateLiveBrandingSimulation());
  }

  // Initial draw cycle
  renderAllData();
  updateLiveBrandingSimulation();
  updateExportCodePreviews();
  
  if ((window as any).lucide) {
    (window as any).lucide.createIcons();
  }
}

function renderAllData(): void {
  const rate = getCurrencyRate();
  const symbol = getCurrencySymbol();

  // 1. Render Catalog Tiers Table
  const tierTableBody = document.getElementById('plan-table-tbody');
  if (tierTableBody) {
    tierTableBody.innerHTML = '';
    
    configData.preconfiguredPlans.forEach(plan => {
      const parentCostEx = (plan.parentCost * rate).toFixed(2);
      const retailCostEx = (plan.sellingPrice * rate).toFixed(2);
      const marginRaw = plan.sellingPrice - plan.parentCost;
      const marginPct = plan.parentCost > 0 ? ((marginRaw / plan.parentCost) * 100).toFixed(0) : '0';
      
      const specsString = Object.entries(plan.specs)
        .map(([key, val]) => `<span class="px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-zinc-400 capitalize whitespace-nowrap"><b class="text-zinc-500 font-medium">${key}:</b> ${val}</span>`)
        .join(' ');

      const row = document.createElement('tr');
      row.className = "hover:bg-white/[0.02] border-b border-white/[0.03] transition duration-150";
      row.innerHTML = `
        <td class="py-4 px-4">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center text-indigo-400 shrink-0">
              <i data-lucide="${plan.type === 'vps' ? 'cpu' : plan.type === 'dns' ? 'globe' : 'database'}" class="w-4 h-4"></i>
            </div>
            <div>
              <span class="font-bold text-white text-xs block leading-tight mb-1">${plan.name}</span>
              <span class="text-[9px] uppercase font-mono tracking-wider text-indigo-400 font-bold bg-indigo-500/5 border border-indigo-500/10 px-1.5 py-0.5 rounded">${plan.type}</span>
            </div>
          </div>
        </td>
        <td class="py-4 px-4">
          <div class="flex flex-wrap gap-1.5 max-w-sm">
            ${specsString}
          </div>
        </td>
        <td class="py-4 px-4 font-mono text-[11px] text-zinc-400">${symbol}${parentCostEx}</td>
        <td class="py-4 px-4">
          <div class="flex items-center gap-2">
            <span class="text-zinc-500 text-[11px] font-mono">${symbol}</span>
            <input 
              type="number" 
              step="0.01" 
              value="${plan.sellingPrice.toFixed(2)}"
              onchange="updateIndividualPlanPrice('${plan.id}', this.value)"
              class="w-20 bg-zinc-950 border border-white/[0.06] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-white tracking-wide custom-input"
            />
          </div>
        </td>
        <td class="py-4 px-4">
          <span class="font-mono text-emerald-400 font-extrabold text-xs led-glow-green">+${marginPct}%</span>
        </td>
        <td class="py-4 px-4 text-right">
          <button onclick="togglePlanActiveState('${plan.id}')" class="px-3.5 py-1.5 text-[10px] font-bold rounded-xl transition border ${plan.active ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-zinc-900 text-zinc-500 border-white/[0.05] hover:bg-zinc-800'}">
            ${plan.active ? 'Active' : 'Disabled'}
          </button>
        </td>
      `;
      tierTableBody.appendChild(row);
    });
  }

  // 1b. Render Active Catalog Snippets
  const catalogList = document.getElementById('catalog-snippet-list');
  if (catalogList) {
    catalogList.innerHTML = '';
    configData.preconfiguredPlans.forEach(plan => {
      const parentCostEx = (plan.parentCost * rate).toFixed(2);
      const retailCostEx = (plan.sellingPrice * rate).toFixed(2);
      
      const div = document.createElement('div');
      div.className = "p-3 bg-zinc-950/40 rounded-xl border border-white/[0.04] flex justify-between items-center hover:border-white/10 transition";
      div.innerHTML = `
        <div class="flex items-center gap-2.5">
          <div class="w-6.5 h-6.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i data-lucide="${plan.type === 'vps' ? 'cpu' : plan.type === 'dns' ? 'globe' : 'database'}" class="w-3.5 h-3.5"></i>
          </div>
          <div>
            <span class="text-[11px] font-bold text-white block leading-tight mb-0.5">${plan.name}</span>
            <span class="text-[8px] uppercase font-mono tracking-wider text-zinc-500">${plan.type}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[11px] font-mono text-indigo-400 font-extrabold leading-tight block mb-0.5">${symbol}${retailCostEx}</span>
          <span class="text-[8px] uppercase tracking-wider font-extrabold px-1 rounded ${plan.active ? 'text-emerald-400 bg-emerald-500/5' : 'text-zinc-500 bg-zinc-950'}">${plan.active ? 'Active' : 'Disabled'}</span>
        </div>
      `;
      catalogList.appendChild(div);
    });
  }

  // 2. Render Simulated Clients List
  const clientTableBody = document.getElementById('client-table-tbody');
  if (clientTableBody) {
    clientTableBody.innerHTML = '';
    
    const countBadge = document.getElementById('client-count-badge');
    if (countBadge) countBadge.innerText = String(configData.simulatedClients.length);
    const totalClientsText = document.getElementById('stat-total-clients');
    if (totalClientsText) totalClientsText.innerText = String(configData.simulatedClients.length);

    configData.simulatedClients.forEach(c => {
      const row = document.createElement('tr');
      row.className = "hover:bg-white/[0.02] border-b border-white/[0.03] transition duration-150";
      row.innerHTML = `
        <td class="py-4 px-4 font-bold text-white flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-[11px] text-zinc-400 uppercase tracking-widest font-black">${c.name.charAt(0)}</div>
          <span class="text-xs">${c.name}</span>
        </td>
        <td class="py-4 px-4 font-mono text-[11px] text-zinc-400">${c.email}</td>
        <td class="py-4 px-4 text-zinc-300 font-semibold text-xs">${c.activeServices} Assets Deploy</td>
        <td class="py-4 px-4"><span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-extrabold uppercase tracking-wide">active</span></td>
        <td class="py-4 px-4 font-mono text-[11px] text-zinc-500">${c.id}</td>
      `;
      clientTableBody.appendChild(row);
    });
  }

  // 3. Render Simulated Activity Updates
  const logList = document.getElementById('order-log-list');
  if (logList) {
    logList.innerHTML = '';

    configData.simulatedOrders.forEach(ord => {
      const revenueEx = (ord.revenue * rate).toFixed(2);
      const isProvisioned = ord.status === 'provisioned';

      const div = document.createElement('div');
      div.className = "p-4 bg-zinc-950/60 rounded-2xl border border-white/[0.04] flex gap-3.5 items-start hover:border-white/10 transition";
      div.innerHTML = `
        <div class="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center ${isProvisioned ? 'text-emerald-400' : 'text-amber-400'} border border-white/[0.06] shrink-0 mt-0.5">
          <i data-lucide="${isProvisioned ? 'check-circle' : 'activity'}" class="w-4 h-4"></i>
        </div>
        <div class="flex-1 space-y-1 text-xs text-left">
          <div class="flex justify-between items-center">
            <span class="font-extrabold text-white text-[12px]">${ord.clientName}</span>
            <span class="font-mono text-emerald-400 font-extrabold text-[12px]">+${symbol}${revenueEx}</span>
          </div>
          <p class="text-[11px] text-zinc-400">Deployed Cluster: <span class="text-white font-medium">${ord.planName}</span></p>
          <div class="flex items-center justify-between text-[9px] text-zinc-500 font-mono mt-1.5 pt-1.5 border-t border-white/[0.04]">
            <span>ID: ${ord.id}</span>
            <span class="uppercase font-bold tracking-wider ${isProvisioned ? 'text-emerald-400' : 'text-amber-400'}">${ord.status}</span>
          </div>
        </div>
      `;
      logList.appendChild(div);
    });
  }

  if ((window as any).lucide) {
    (window as any).lucide.createIcons();
  }
}

// --- Action Handlers ---

export function switchTab(tabId: string): void {
  // Hide all screens
  const tabs = ['overview', 'products', 'branding', 'clients', 'uplink', 'export', 'crypto'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`btn-${t}`);
    if (el) el.classList.add('hidden');
    if (btn) btn.classList.remove('active-tab');
  });

  // Display targeted view & style nav link
  const activeEl = document.getElementById(`tab-${tabId}`);
  const activeBtn = document.getElementById(`btn-${tabId}`);
  if (activeEl) activeEl.classList.remove('hidden');
  if (activeBtn) activeBtn.classList.add('active-tab');

  if (tabId === 'crypto') {
    loadCryptoDashboardData();
  }
}

export function togglePlanActiveState(planId: string): void {
  const plan = configData.preconfiguredPlans.find(p => p.id === planId);
  if (plan) {
    plan.active = !plan.active;
    saveConfigState();
    showNotification(`Hosting plan "${plan.name}" status updated.`);
  }
}

export function updateIndividualPlanPrice(planId: string, value: string | number): void {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num) || num <= 0) return;
  const plan = configData.preconfiguredPlans.find(p => p.id === planId);
  if (plan) {
    plan.sellingPrice = num;
    saveConfigState();
    showNotification(`"${plan.name}" price margin adjusted to ${getCurrencySymbol()}${num.toFixed(2)}.`);
  }
}

export function addNewCustomPlan(): void {
  const id = 'custom-' + Date.now().toString().slice(-4);
  const newPlan: Plan = {
    id: id,
    name: "Branded Cloud VM - " + id.toUpperCase(),
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
  configData.preconfiguredPlans.push(newPlan);
  saveConfigState();
  showNotification(`Custom Tier "${newPlan.name}" created and loaded into catalogue.`);
}

export function saveBrandingOptions(): void {
  const brandNameInput = document.getElementById('brand-name-input') as HTMLInputElement;
  const brandEmailInput = document.getElementById('brand-email-input') as HTMLInputElement;
  const currencySelect = document.getElementById('brand-currency-select') as HTMLSelectElement;
  const colorPicker = document.getElementById('brand-color-picker') as HTMLInputElement;

  if (brandNameInput) {
    const name = brandNameInput.value.trim();
    if (name) configData.resellerName = name;
  }
  if (brandEmailInput) {
    const email = brandEmailInput.value.trim();
    if (email) configData.supportEmail = email;
  }
  if (currencySelect) {
    configData.currency = currencySelect.value;
  }

  // Handle Nameservers
  const nsBlock = document.getElementById('nameservers-block');
  if (nsBlock) {
    const inputs = nsBlock.getElementsByTagName('input');
    if (inputs.length >= 2) {
      configData.customNameservers = [inputs[0].value.trim(), inputs[1].value.trim()];
    }
  }

  const colorText = document.getElementById('brand-color-text');
  if (colorText && colorPicker) {
    colorText.innerText = colorPicker.value;
  }

  saveConfigState();
  showNotification("Whitelabel brand parameters fully compiled.");
}

export function updateLiveBrandingSimulation(): void {
  const colorPicker = document.getElementById('brand-color-picker') as HTMLInputElement;
  const brandNameInput = document.getElementById('brand-name-input') as HTMLInputElement;
  const hex = colorPicker ? colorPicker.value : '#6366f1';
  const nameValue = brandNameInput ? brandNameInput.value.trim() : "Lumen Whitelabel Host";

  const simHostName = document.getElementById('simulate-brand-name');
  const simColorBlock = document.getElementById('simulate-brand-color-block');
  const simActionButton = document.getElementById('simulate-action-button');

  if (simHostName) simHostName.innerText = nameValue || "Lumen Host";
  if (simColorBlock) simColorBlock.style.backgroundColor = hex;
  if (simActionButton) {
    simActionButton.style.backgroundColor = hex;
    // apply contrasting text class
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 125) {
      simActionButton.style.color = '#000000';
    } else {
      simActionButton.style.color = '#ffffff';
    }
  }

  // Update mock pricing card
  const firstPlan = configData.preconfiguredPlans.find(p => p.active) || configData.preconfiguredPlans[0];
  const rate = getCurrencyRate();
  const symbol = getCurrencySymbol();

  if (firstPlan) {
    const calculatedPrice = (firstPlan.sellingPrice * rate).toFixed(2);
    const simTier = document.getElementById('simulate-tier-preview');
    const simPrice = document.getElementById('simulate-price-preview');
    const simPriceSub = document.getElementById('simulate-price-preview-sub');
    const simPriceTotal = document.getElementById('simulate-price-preview-total');

    if (simTier) simTier.innerText = firstPlan.name;
    if (simPrice) simPrice.innerText = `${symbol}${calculatedPrice}`;
    if (simPriceSub) simPriceSub.innerText = `${symbol}${calculatedPrice}`;
    if (simPriceTotal) simPriceTotal.innerText = `${symbol}${calculatedPrice}`;
  }
}

export function copyToClipboard(elementId: string): void {
  const element = document.getElementById(elementId) as HTMLTextAreaElement | HTMLInputElement;
  if (element) {
    element.select();
    document.execCommand("copy");
    showNotification("Integration code copied to clipboard!");
  }
}

export function updateExportCodePreviews(): void {
  const prices: Record<string, number> = {};
  configData.preconfiguredPlans.forEach(p => {
    prices[p.id] = p.sellingPrice;
  });

  const templateConfig = {
    brandName: configData.resellerName,
    support: configData.supportEmail,
    endpoint: configData.parentApiUrl,
    currency: configData.currency,
    pricing: prices
  };

  const jsonCodeTextarea = document.getElementById('json-config-code') as HTMLTextAreaElement;
  if (jsonCodeTextarea) {
     jsonCodeTextarea.value = JSON.stringify(templateConfig, null, 2);
  }

  const htmlCodeTextarea = document.getElementById('html-integrations-code') as HTMLTextAreaElement;
  if (htmlCodeTextarea) {
    const activePlans = configData.preconfiguredPlans.filter(p => p.active);
    const planMock = activePlans[0] || configData.preconfiguredPlans[0];
    const symbol = getCurrencySymbol();
    
    if (planMock) {
      const textSpecs = Object.entries(planMock.specs)
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join(' • ');
        
      htmlCodeTextarea.value = `<!-- Dynamic Price Widget: ${configData.resellerName} Storefront -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-8 rounded-[40px] text-slate-100 font-sans">
  <div class="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between">
    <div>
      <h3 class="font-bold text-lg text-white">${planMock.name}</h3>
      <p class="text-xs text-slate-400 mt-2">${textSpecs}</p>
    </div>
    <div class="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center animate-pulse">
      <span class="font-bold text-white text-lg font-mono">${symbol}${planMock.sellingPrice.toFixed(2)}/mo</span>
      <button class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-semibold text-white transition">Deploy Instance</button>
    </div>
  </div>
</div>`;
    }
  }
}

export function runFinancialProjections(): void {
  const sliderClients = document.getElementById('slider-clients') as HTMLInputElement;
  const sliderMarkup = document.getElementById('slider-markup') as HTMLInputElement;

  if (!sliderClients || !sliderMarkup) return;

  const sliderClientsNum = parseInt(sliderClients.value);
  const sliderMarkupNum = parseInt(sliderMarkup.value);

  const clientValBadge = document.getElementById('slider-client-val');
  const markupValBadge = document.getElementById('slider-markup-val');

  if (clientValBadge) clientValBadge.innerText = `${sliderClientsNum} Clients`;
  if (markupValBadge) markupValBadge.innerText = `${sliderMarkupNum}% Margin Markup`;

  const activePlans = configData.preconfiguredPlans.filter(p => p.active);
  if (activePlans.length === 0) return;

  let avgCost = 0;
  activePlans.forEach(p => avgCost += p.parentCost);
  avgCost = avgCost / activePlans.length;

  const multiplier = 1 + (sliderMarkupNum / 100);
  const avgSellingPrice = avgCost * multiplier;

  const totalMonthlyCostVal = avgCost * sliderClientsNum;
  const totalMonthlyGrossVal = avgSellingPrice * sliderClientsNum;
  const netMonthlyProfitVal = totalMonthlyGrossVal - totalMonthlyCostVal;

  const symbol = getCurrencySymbol();
  const rate = getCurrencyRate();

  const displayCost = (totalMonthlyCostVal * rate).toFixed(2);
  const displayGross = (totalMonthlyGrossVal * rate).toFixed(2);
  const displayProfit = (netMonthlyProfitVal * rate).toFixed(2);
  const displayAnnualTotal = (netMonthlyProfitVal * 12 * rate).toFixed(2);

  const calcCost = document.getElementById('calc-cost');
  const calcGross = document.getElementById('calc-gross');
  const calcProfit = document.getElementById('calc-profit');
  const annualForecastText = document.getElementById('annual-forecast-total');

  if (calcCost) calcCost.innerText = `${symbol}${displayCost}`;
  if (calcGross) calcGross.innerText = `${symbol}${displayGross}`;
  if (calcProfit) calcProfit.innerText = `${symbol}${displayProfit}`;
  if (annualForecastText) annualForecastText.innerText = `${symbol}${displayAnnualTotal}/yr`;

  // Update summary header metrics based on current ledger values
  let ledgerCost = 0;
  let ledgerGross = 0;

  configData.simulatedOrders.forEach(o => {
    const matchedPlan = configData.preconfiguredPlans.find(p => p.name === o.planName) || configData.preconfiguredPlans[0];
    if (matchedPlan) {
      ledgerCost += matchedPlan.parentCost;
      ledgerGross += matchedPlan.sellingPrice;
    }
  });

  const ledgerProfit = ledgerGross - ledgerCost;
  const ledgerMarginPct = ledgerCost > 0 ? ((ledgerProfit / ledgerCost) * 100).toFixed(0) : '0';

  const statCost = document.getElementById('stat-total-cost');
  const statGross = document.getElementById('stat-gross-revenue');
  const statNet = document.getElementById('stat-net-profit');
  const statMargin = document.getElementById('stat-margin-pct');

  if (statCost) statCost.innerText = `${symbol}${(ledgerCost * rate).toFixed(2)}`;
  if (statGross) statGross.innerText = `${symbol}${(ledgerGross * rate).toFixed(2)}`;
  if (statNet) statNet.innerText = `${symbol}${(ledgerProfit * rate).toFixed(2)}`;
  if (statMargin) statMargin.innerText = `${ledgerMarginPct}% Total Combined Yield`;

  // Redraw cumulative chart svg paths dynamically
  const chartAreaPath = document.getElementById('chart-area-path');
  const chartLinePath = document.getElementById('chart-line-path');

  if (chartAreaPath && chartLinePath) {
    const yMin = Math.max(5, 95 - (sliderClientsNum * 0.18));
    const yMax = Math.max(5, yMin - (sliderMarkupNum * 0.1));

    const pathStringLine = `M 0 100 L 80 ${90 - (yMin * 0.2)} L 160 ${80 - (yMin * 0.3)} L 240 ${70 - (yMin * 0.4)} L 320 ${60 - (yMin * 0.5)} L 400 ${45 - (yMax * 0.4)} L 500 ${yMax}`;
    const pathStringArea = `${pathStringLine} L 500 100 L 0 100`;

    chartLinePath.setAttribute('d', pathStringLine);
    chartAreaPath.setAttribute('d', pathStringArea);
  }
}

export function toggleTokenMask(): void {
  const input = document.getElementById('parent-api-token-input') as HTMLInputElement;
  const icon = document.getElementById('token-eye-icon');
  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      icon.setAttribute('data-lucide', 'eye');
    }
  }
  if ((window as any).lucide) {
    (window as any).lucide.createIcons();
  }
}

export function simulateNewOrder(): void {
  const firstNames = ["Gavin", "Erlich", "Jian", "Dinesh", "Richard", "Monica", "Marc", "Satoshi", "Guido"];
  const lastNames = ["Belson", "Bachman", "Yang", "Chugtai", "Hendricks", "Hall", "Andreessen", "Nakamoto", "van Rossum"];
  const selectedName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const email = `${selectedName.toLowerCase().replace(/\s/g, '')}@lumentechnology.co`;
  const randomId = 'c-' + Math.floor(100 + Math.random() * 900);

  const newClient: Client = {
    id: randomId,
    name: selectedName,
    email: email,
    activeServices: Math.floor(1 + Math.random() * 3),
    status: "active",
    joined: new Date().toISOString().split('T')[0]
  };

  const activePlans = configData.preconfiguredPlans.filter(p => p.active);
  const chosenPlan = activePlans[Math.floor(Math.random() * activePlans.length)] || configData.preconfiguredPlans[0];

  const ordId = 'ord-' + Math.floor(100 + Math.random() * 900);
  const newOrder: Order = {
    id: ordId,
    clientName: selectedName,
    planName: chosenPlan.name,
    cost: chosenPlan.parentCost,
    revenue: chosenPlan.sellingPrice,
    date: new Date().toISOString().split('T')[0],
    status: "provisioned"
  };

  configData.simulatedClients.unshift(newClient);
  configData.simulatedOrders.unshift(newOrder);

  saveConfigState();
  showNotification(`Simulated live purchase! Provisioned ${chosenPlan.name} container for ${selectedName}.`);
}

export function testApiUplink(): void {
  const terminal = document.getElementById('api-output-terminal');
  const urlInput = document.getElementById('parent-api-url-input') as HTMLInputElement;
  
  if (terminal && urlInput) {
    terminal.innerText = `Establishing SSL handshake: [POST] ${urlInput.value}/systems/activate ...`;
    terminal.className = 'font-mono text-[11px] text-amber-400 overflow-y-auto whitespace-pre-wrap flex-1';

    setTimeout(() => {
      terminal.className = 'font-mono text-[11px] text-emerald-400 overflow-y-auto whitespace-pre-wrap flex-1';
      terminal.innerText = JSON.stringify({
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
      }, null, 2);
      showNotification("Hypervisor gateway handshake verified successfully.");
    }, 1000);
  }
}

export function saveUplinkSettings(): void {
  const input = document.getElementById('parent-api-url-input') as HTMLInputElement;
  if (input) {
    configData.parentApiUrl = input.value.trim();
    saveConfigState();
    showNotification("Uplink gateway parameters synchronized successfully.");
  }
}

// --- Helpers ---
function getCurrencySymbol(): string {
  const meta = currencyRates[configData.currency];
  return meta ? meta.symbol : '$';
}

function getCurrencyRate(): number {
  const meta = currencyRates[configData.currency];
  return meta ? meta.rate : 1.0;
}

// --- SECURE CRYPTO CUSTODY BILLING SUITE ---

export async function loadCryptoDashboardData(): Promise<void> {
  const selectClient = document.getElementById('link-client-select') as HTMLSelectElement;
  const selectService = document.getElementById('link-service-select') as HTMLSelectElement;

  // 1. Fill selectors
  if (selectClient) {
    const prevVal = selectClient.value;
    selectClient.innerHTML = '<option value="custom">-- Custom Client --</option>';
    configData.simulatedClients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.email;
      opt.dataset.name = c.name;
      opt.innerText = `${c.name} (${c.email})`;
      selectClient.appendChild(opt);
    });
    if (prevVal) selectClient.value = prevVal;

    if (!selectClient.dataset.listener) {
      selectClient.dataset.listener = "true";
      selectClient.addEventListener('change', () => {
        const fields = document.getElementById('custom-client-fields');
        if (selectClient.value === 'custom') {
          if (fields) fields.classList.remove('hidden');
        } else {
          if (fields) fields.classList.add('hidden');
        }
      });
    }
  }

  if (selectService) {
    const prevVal = selectService.value;
    selectService.innerHTML = '';
    configData.preconfiguredPlans.forEach(p => {
      if (p.active) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.dataset.price = String(p.sellingPrice);
        opt.innerText = `${p.name} ($${p.sellingPrice.toFixed(2)})`;
        selectService.appendChild(opt);
      }
    });
    if (prevVal) selectService.value = prevVal;

    if (!selectService.dataset.listener) {
      selectService.dataset.listener = "true";
      selectService.addEventListener('change', () => {
        const opt = selectService.options[selectService.selectedIndex];
        const priceInput = document.getElementById('link-price-input') as HTMLInputElement;
        if (opt && opt.dataset.price && priceInput) {
          priceInput.value = parseFloat(opt.dataset.price).toFixed(2);
        }
      });
    }
  }

  // Auto populate default price if empty
  const priceInput = document.getElementById('link-price-input') as HTMLInputElement;
  if (priceInput && !priceInput.value) {
    const activePlans = configData.preconfiguredPlans.filter(p => p.active);
    if (activePlans.length > 0) {
      priceInput.value = activePlans[0].sellingPrice.toFixed(2);
    }
  }

  // 2. Query custody status from API gateway server
  try {
    const res = await fetch('/api/crypto/dashboard');
    if (!res.ok) throw new Error('Escrow dashboard fetch failure');
    const data = await res.json();

    // Fill numerical cards
    const balText = document.getElementById('custody-balance-text');
    if (balText) balText.innerText = `$${data.balanceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const grossText = document.getElementById('payout-balance-gross');
    if (grossText) grossText.innerText = `$${(data.balanceUSD + data.totalWithdrawn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const drawnText = document.getElementById('payout-balance-withdrawn');
    if (drawnText) drawnText.innerText = `$${data.totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Render payment link table rows
    const linksBody = document.getElementById('crypto-links-tbody');
    const linksCount = document.getElementById('crypto-links-count');
    if (linksBody) {
      linksBody.innerHTML = '';
      if (linksCount) linksCount.innerText = `${data.links.length} Links`;

      if (data.links.length === 0) {
        linksBody.innerHTML = `
          <tr>
            <td colspan="6" class="py-12 text-center text-zinc-500 font-medium">
              <div class="flex flex-col items-center justify-center space-y-2">
                <i data-lucide="link-2" class="w-6 h-6 text-zinc-600"></i>
                <span>No checkout links generated. Complete the left form to deploy.</span>
              </div>
            </td>
          </tr>
        `;
      } else {
        data.links.forEach((l: any) => {
          const row = document.createElement('tr');
          row.className = "hover:bg-white/[0.02] border-b border-white/[0.03] transition duration-150";

          const isCompleted = l.status === 'completed';
          const statusCls = isCompleted 
            ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' 
            : 'text-amber-400 bg-amber-500/5 border-amber-500/10 animate-pulse';

          const isResellerInPath = window.location.pathname.includes("/reseller-panel");
          const pathPrefix = isResellerInPath ? "/reseller-panel" : "";
          const payUrl = `${window.location.origin}${pathPrefix}/pay.html?id=${l.id}`;

          row.innerHTML = `
            <td class="py-3 px-3 font-mono text-[10px] text-zinc-400 font-bold">${l.id}</td>
            <td class="py-3 px-3">
              <span class="text-xs font-bold text-white block leading-tight">${l.clientName}</span>
              <span class="text-[9px] font-mono text-zinc-500">${l.clientEmail}</span>
            </td>
            <td class="py-3 px-3 text-xs text-zinc-300 font-medium">${l.serviceName}</td>
            <td class="py-3 px-3">
              <span class="text-xs font-mono font-bold text-white block leading-tight">$${l.amountUsd.toFixed(2)}</span>
              <span class="text-[9px] font-mono text-indigo-400">${l.cryptocurrencyAmount} ${l.cryptoType}</span>
            </td>
            <td class="py-3 px-3">
              <span class="px-2 py-0.5 border uppercase text-[8px] font-black tracking-wider rounded-md font-mono ${statusCls}">${l.status}</span>
            </td>
            <td class="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
              <button onclick="copyToClipboardText('${payUrl}')" class="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 font-semibold rounded-lg border border-white/[0.04] transition">Copy Link</button>
              <a href="${payUrl}" target="_blank" class="px-2.5 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/35 text-[10px] text-indigo-300 font-bold rounded-lg border border-indigo-500/25 transition inline-block">Gate</a>
            </td>
          `;
          linksBody.appendChild(row);
        });
      }
    }

    // Render payout logs table rows
    const payoutsBody = document.getElementById('payout-logs-tbody');
    if (payoutsBody) {
      payoutsBody.innerHTML = '';
      if (data.payouts.length === 0) {
        payoutsBody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-zinc-500">No past withdrawal logs cleared.</td></tr>';
      } else {
        data.payouts.forEach((p: any) => {
          const row = document.createElement('tr');
          row.className = "hover:bg-white/[0.02] border-b border-white/[0.03] transition duration-150";

          const isCompleted = p.status === 'completed';
          const statusCls = isCompleted 
            ? 'text-emerald-400 bg-emerald-500/5' 
            : 'text-amber-400 bg-amber-500/5 border-amber-500/10 animate-pulse';

          row.innerHTML = `
            <td class="py-3 px-3 font-mono text-[10px] text-zinc-400 font-bold">${p.id}</td>
            <td class="py-3 px-3 text-xs text-zinc-400 font-semibold">${p.date}</td>
            <td class="py-3 px-3 text-xs font-bold text-white uppercase">${p.cryptoType}</td>
            <td class="py-3 px-3 font-mono text-[10px] text-zinc-500 max-w-[120px] truncate" title="${p.cryptoAddress}">${p.cryptoAddress}</td>
            <td class="py-3 px-3 font-mono text-xs text-white font-extrabold">$${p.amount.toFixed(2)}</td>
            <td class="py-3 px-3 text-right">
              <span class="px-2 py-0.5 border text-[8px] uppercase tracking-wider rounded-md font-mono ${statusCls}">${p.status}</span>
            </td>
          `;
          payoutsBody.appendChild(row);
        });
      }
    }

    if ((window as any).lucide) {
      (window as any).lucide.createIcons();
    }

  } catch (err) {
    console.error('[loadCryptoDashboardData] Error syncing custody metrics:', err);
  }
}

export async function triggerCreatePaymentLink(): Promise<void> {
  const selectClient = document.getElementById('link-client-select') as HTMLSelectElement;
  const selectService = document.getElementById('link-service-select') as HTMLSelectElement;
  const coinSelect = document.getElementById('link-coin-type') as HTMLSelectElement;
  const priceInput = document.getElementById('link-price-input') as HTMLInputElement;

  let name = '';
  let email = '';

  if (selectClient.value === 'custom') {
    const inputName = document.getElementById('link-client-name') as HTMLInputElement;
    const inputEmail = document.getElementById('link-client-email') as HTMLInputElement;
    name = inputName ? inputName.value.trim() : '';
    email = inputEmail ? inputEmail.value.trim() : '';

    if (!name || !email) {
      showNotification('Please specify all custom client fields.');
      return;
    }
  } else {
    const opt = selectClient.options[selectClient.selectedIndex];
    name = opt ? opt.dataset.name || '' : '';
    email = selectClient.value;
  }

  const service = selectService.options[selectService.selectedIndex]?.text.split(' ($')[0] || 'Cloud Service';
  const rawPrice = priceInput ? parseFloat(priceInput.value) : 0;

  if (isNaN(rawPrice) || rawPrice <= 0) {
    showNotification('Provide a valid target sales price.');
    return;
  }

  const cryptoType = coinSelect ? coinSelect.value : 'USDT';

  try {
    const response = await fetch('/api/crypto/create-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: name,
        clientEmail: email,
        serviceName: service,
        amountUsd: rawPrice,
        cryptoType
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Server rejected creation of billing invoice.');
    }

    const created = await response.json();
    
    // Clean inputs
    const inputName = document.getElementById('link-client-name') as HTMLInputElement;
    const inputEmail = document.getElementById('link-client-email') as HTMLInputElement;
    if (inputName) inputName.value = '';
    if (inputEmail) inputEmail.value = '';

    showNotification(`Secured payment link ${created.id} generated!`);
    await loadCryptoDashboardData();

  } catch (err: any) {
    alert(err.message || 'Invoice write error.');
  }
}

export async function triggerPayoutRequest(): Promise<void> {
  const tokenSelect = document.getElementById('payout-token-type') as HTMLSelectElement;
  const amountInput = document.getElementById('payout-amount-input') as HTMLInputElement;
  const addressInput = document.getElementById('payout-address-input') as HTMLInputElement;

  const cryptoType = tokenSelect ? tokenSelect.value : 'USDT';
  const amount = amountInput ? parseFloat(amountInput.value) : 0;
  const cryptoAddress = addressInput ? addressInput.value.trim() : '';

  if (isNaN(amount) || amount <= 0) {
    showNotification('Please provide a valid payout amount.');
    return;
  }

  if (!cryptoAddress) {
    showNotification('Please enter on-chain destination wallet address.');
    return;
  }

  try {
    const response = await fetch('/api/crypto/request-payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        cryptoAddress,
        cryptoType
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to submit with backend.');
    }

    // Clean inputs
    if (amountInput) amountInput.value = '';
    if (addressInput) addressInput.value = '';

    showNotification(`Payout requested successfully! Deducting from balance.`);
    await loadCryptoDashboardData();

  } catch (err: any) {
    alert(err.message || 'Payout creation failed.');
  }
}

// Global text copy helper
(window as any).copyToClipboardText = function(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    showNotification("Billing Checkout link copied!");
  }).catch(() => {
    showNotification("Failed to copy link automatically.");
  });
};
