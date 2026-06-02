import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Paths for standalone persistent storage (JSON fallback databases)
const isResellerSubdir = fs.existsSync(path.resolve(process.cwd(), "reseller-panel"));
const BASE_DIR = isResellerSubdir 
  ? path.resolve(process.cwd(), "reseller-panel") 
  : process.cwd();

const STORAGE_DIR = path.resolve(BASE_DIR, "db_data");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const LINKS_FILE = path.join(STORAGE_DIR, "crypto_links.json");
const PAYOUTS_FILE = path.join(STORAGE_DIR, "crypto_payouts.json");
const PLANS_FILE = path.join(STORAGE_DIR, "master_plans.json");
const RESELLERS_FILE = path.join(STORAGE_DIR, "resellers.json");

// Direct routes to guarantee config.json is accessible under all environments
app.get("/config.json", (req, res) => {
  const configFile = path.join(BASE_DIR, "config.json");
  if (fs.existsSync(configFile)) {
    res.sendFile(configFile);
  } else {
    res.status(404).json({ error: "config.json not found" });
  }
});

app.get("/reseller-panel/config.json", (req, res) => {
  const configFile = path.join(BASE_DIR, "config.json");
  if (fs.existsSync(configFile)) {
    res.sendFile(configFile);
  } else {
    res.status(404).json({ error: "config.json not found" });
  }
});

// Helper to write/read JSON stores safely
const readJson = (filePath: string, fallback: any) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return fallback;
  }
};

const writeJson = (filePath: string, data: any) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error writing to ${filePath}:`, e);
  }
};

// Seeding Default Data if empty
const defaultMasterPlans = [
  {
    id: "vps-developer",
    name: "Developer Micro Node",
    type: "vps",
    cpu: "1 vCPU",
    ram: "2 GB ECC",
    storage: "35 GB NVMe",
    bandwidth: "1 TB",
    parentCost: 1.99,
    suggestedPrice: 4.99,
    active: true
  },
  {
    id: "vps-scale",
    name: "Standard Scale Engine",
    type: "vps",
    cpu: "2 vCPU",
    ram: "4 GB ECC",
    storage: "90 GB NVMe",
    bandwidth: "4 TB",
    parentCost: 4.80,
    suggestedPrice: 12.00,
    active: true
  },
  {
    id: "vps-dedicated",
    name: "Premium Dedicated Cluster",
    type: "vps",
    cpu: "4 vCPU Dedicated",
    ram: "16 GB ECC",
    storage: "250 GB NVMe",
    bandwidth: "10 TB",
    parentCost: 14.50,
    suggestedPrice: 38.00,
    active: true
  },
  {
    id: "dns-anycast",
    name: "Gold Anycast DNS Tier",
    type: "dns",
    cpu: "Anycast Latency",
    ram: "Instant Prop",
    storage: "ddosWaf Active",
    bandwidth: "Unlimited Queries",
    parentCost: 0.80,
    suggestedPrice: 2.50,
    active: true
  }
];

const defaultResellers = [
  {
    id: "lumen_host_demo",
    name: "Lumen Host Whitelabel Portal",
    email: "support@lumenhost.pro",
    escrowBalance: 1254.80,
    escrowWithdrawn: 150.00,
    resellerWallet: 84.80,
    lumenProfit: 1170.00,
    status: "active",
    joined: "2026-01-12",
    marginFactor: 1.4
  },
  {
    id: "master_reseller_demo",
    name: "Master Reseller Gate",
    email: "admin@mastergate.cloud",
    escrowBalance: 2450.00,
    escrowWithdrawn: 300.00,
    resellerWallet: 410.00,
    lumenProfit: 2040.00,
    status: "active",
    joined: "2026-02-18",
    marginFactor: 1.5
  },
  {
    id: "cybersphere",
    name: "CyberSphere VPS Solutions",
    email: "billing@cybersphere.net",
    escrowBalance: 0.00,
    escrowWithdrawn: 0.00,
    resellerWallet: 0.00,
    lumenProfit: 0.00,
    status: "suspended",
    joined: "2026-03-01",
    marginFactor: 1.3
  }
];

const defaultLinks = [
  {
    id: "pay-7749",
    clientName: "Alex Mercer",
    clientEmail: "alex@mercerdev.io",
    serviceName: "Developer Micro Node",
    amountUsd: 12.00,
    parentCost: 1.99,
    markupAmount: 10.01,
    cryptoType: "USDT",
    cryptoAddress: "0x3fff75865f2d0a44671857994a69daeb53994a69",
    cryptocurrencyAmount: 12.00,
    status: "completed",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    resellerId: "master_reseller_demo"
  },
  {
    id: "pay-1104",
    clientName: "Sophia Carter",
    clientEmail: "sophia@carterconsulting.pro",
    serviceName: "Standard Scale Engine",
    amountUsd: 25.00,
    parentCost: 4.80,
    markupAmount: 20.20,
    cryptoType: "BTC",
    cryptoAddress: "bc1qxy2kg3ctynxu7ej6774ry2w7aspyuv7cjzsz8p",
    cryptocurrencyAmount: 0.000312,
    status: "pending",
    createdAt: new Date().toISOString(),
    resellerId: "master_reseller_demo"
  }
];

const defaultPayouts = [
  {
    id: "wd-091",
    amount: 150.00,
    cryptoAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    cryptoType: "USDT",
    status: "completed",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    resellerId: "master_reseller_demo"
  }
];

// Read databases on startup
let masterPlans = readJson(PLANS_FILE, defaultMasterPlans);
let resellers = readJson(RESELLERS_FILE, defaultResellers);
let cryptoLinks = readJson(LINKS_FILE, defaultLinks);
let payoutLogs = readJson(PAYOUTS_FILE, defaultPayouts);

// Wallet configs
const walletPoolAddresses: Record<string, string> = {
  USDT: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  BTC: "bc1qxy2kg3ctynxu7ej6774ry2w7aspyuv7cjzsz8p",
  ETH: "0x3fff75865f2d0a44671857994a69daeb53994a69",
  SOL: "HN7cABviGo3B4vud6vD1483B89Gndy4df1c2d9GNDY4c"
};

const cryptoRatesUsd: Record<string, number> = {
  USDT: 1.0,
  BTC: 89000.0,
  ETH: 3200.0,
  SOL: 185.0
};

// --- CLIENT APIS ---

app.get("/api/crypto/dashboard", (req, res) => {
  const resellerId = (req.query.resellerId as string) || "master_reseller_demo";
  const rIdx = resellers.findIndex((r: any) => r.id === resellerId);
  const r = rIdx !== -1 ? resellers[rIdx] : resellers[0];

  const matchedLinks = cryptoLinks.filter((l: any) => l.resellerId === r.id);
  const matchedPayouts = payoutLogs.filter((p: any) => p.resellerId === r.id);

  res.json({
    balanceUSD: r.escrowBalance,
    totalWithdrawn: r.escrowWithdrawn,
    resellerWallet: r.resellerWallet,
    lumenProfit: r.lumenProfit,
    payouts: matchedPayouts,
    links: matchedLinks
  });
});

app.post("/api/crypto/create-link", (req, res) => {
  const { clientName, clientEmail, serviceName, amountUsd, cryptoType, parentCost, resellerId } = req.body;
  if (!clientName || !clientEmail || !serviceName || !amountUsd || !cryptoType) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const usdValue = parseFloat(String(amountUsd));
  if (isNaN(usdValue) || usdValue <= 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }

  const rId = resellerId || "master_reseller_demo";
  const token = String(cryptoType).toUpperCase();
  const address = walletPoolAddresses[token] || walletPoolAddresses.USDT;
  const rate = cryptoRatesUsd[token] || 1.0;
  const cryptoAmount = parseFloat((usdValue / rate).toFixed(token === 'BTC' ? 6 : token === 'ETH' ? 5 : 4));

  const finalParentCost = parentCost !== undefined ? parseFloat(String(parentCost)) : parseFloat((usdValue * 0.75).toFixed(2));
  const finalMarkup = parseFloat((usdValue - finalParentCost).toFixed(2));

  const newLink = {
    id: `pay-${Math.floor(1000 + Math.random() * 9000)}`,
    clientName,
    clientEmail,
    serviceName,
    amountUsd: usdValue,
    parentCost: finalParentCost,
    markupAmount: finalMarkup,
    cryptoType: token,
    cryptoAddress: address,
    cryptocurrencyAmount: cryptoAmount,
    status: "pending",
    createdAt: new Date().toISOString(),
    resellerId: rId
  };

  cryptoLinks.unshift(newLink);
  writeJson(LINKS_FILE, cryptoLinks);

  res.json(newLink);
});

app.get("/api/crypto/link-info/:id", (req, res) => {
  const { id } = req.params;
  const match = cryptoLinks.find((l: any) => l.id === id);
  if (!match) {
    return res.status(404).json({ error: "Invoice billing link not found." });
  }
  res.json(match);
});

app.post("/api/crypto/pay-simulate/:id", (req, res) => {
  const { id } = req.params;
  const linkIdx = cryptoLinks.findIndex((l: any) => l.id === id);
  if (linkIdx === -1) {
    return res.status(404).json({ error: "Payment links records not found." });
  }

  const link = cryptoLinks[linkIdx];
  if (link.status === "completed") {
    return res.status(400).json({ error: "Invoice already settled." });
  }

  link.status = "completed";
  cryptoLinks[linkIdx] = link;
  writeJson(LINKS_FILE, cryptoLinks);

  const rId = link.resellerId || "master_reseller_demo";
  const rIdx = resellers.findIndex((res: any) => res.id === rId);
  if (rIdx !== -1) {
    const parentCost = link.parentCost || (link.amountUsd * 0.75);
    const markup = link.amountUsd - parentCost;

    resellers[rIdx].escrowBalance = parseFloat((resellers[rIdx].escrowBalance + link.amountUsd).toFixed(2));
    resellers[rIdx].resellerWallet = parseFloat((resellers[rIdx].resellerWallet + markup).toFixed(2));
    resellers[rIdx].lumenProfit = parseFloat((resellers[rIdx].lumenProfit + parentCost).toFixed(2));
    writeJson(RESELLERS_FILE, resellers);
  }

  res.json({ success: true, link });
});

app.post("/api/crypto/request-payout", (req, res) => {
  const { amount, cryptoAddress, cryptoType, resellerId } = req.body;
  if (!amount || !cryptoAddress || !cryptoType) {
    return res.status(400).json({ error: "Missing payout metadata." });
  }

  const withdrawalVal = parseFloat(String(amount));
  if (isNaN(withdrawalVal) || withdrawalVal <= 0) {
    return res.status(400).json({ error: "Invalid withdraw amount value." });
  }

  const rId = resellerId || "master_reseller_demo";
  const rIdx = resellers.findIndex((res: any) => res.id === rId);
  if (rIdx === -1) {
    return res.status(404).json({ error: "Reseller account registry not found." });
  }

  const r = resellers[rIdx];
  if (r.resellerWallet < withdrawalVal) {
    return res.status(400).json({ error: `Insufficient reseller balance. Maximum withdrawable: $${r.resellerWallet.toFixed(2)}` });
  }

  const newPayout = {
    id: `wd-${Math.floor(100 + Math.random() * 900)}`,
    amount: withdrawalVal,
    cryptoAddress,
    cryptoType: String(cryptoType).toUpperCase(),
    status: "pending",
    createdAt: new Date().toISOString(),
    resellerId: rId
  };

  payoutLogs.unshift(newPayout);
  writeJson(PAYOUTS_FILE, payoutLogs);

  resellers[rIdx].resellerWallet = parseFloat((resellers[rIdx].resellerWallet - withdrawalVal).toFixed(2));
  writeJson(RESELLERS_FILE, resellers);

  res.json({ success: true, payout: newPayout });
});


// --- ADMIN APIS ---

app.get("/api/admin/resellers", (req, res) => {
  res.json(resellers);
});

app.put("/api/admin/resellers/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, resellerWallet, status, marginFactor } = req.body;
  
  const idx = resellers.findIndex((r: any) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Reseller registration not found." });
  }

  if (name !== undefined) resellers[idx].name = name;
  if (email !== undefined) resellers[idx].email = email;
  if (resellerWallet !== undefined) resellers[idx].resellerWallet = parseFloat(String(resellerWallet));
  if (status !== undefined) resellers[idx].status = status;
  if (marginFactor !== undefined) resellers[idx].marginFactor = parseFloat(String(marginFactor));

  writeJson(RESELLERS_FILE, resellers);
  res.json({ success: true, reseller: resellers[idx] });
});

app.post("/api/admin/resellers", (req, res) => {
  const { id, name, email, marginFactor } = req.body;
  if (!id || !name || !email) {
    return res.status(400).json({ error: "Missing required reseller details." });
  }

  const already = resellers.some((r: any) => r.id === id);
  if (already) {
    return res.status(400).json({ error: "Reseller ID portal already registered." });
  }

  const newR = {
    id,
    name,
    email,
    escrowBalance: 0.0,
    escrowWithdrawn: 0.0,
    resellerWallet: 0.0,
    lumenProfit: 0.0,
    status: "active",
    joined: new Date().toISOString().split('T')[0],
    marginFactor: parseFloat(String(marginFactor || 1.4))
  };

  resellers.push(newR);
  writeJson(RESELLERS_FILE, resellers);
  res.json({ success: true, reseller: newR });
});

app.get("/api/admin/plans", (req, res) => {
  res.json(masterPlans);
});

app.post("/api/admin/plans", (req, res) => {
  const { id, name, type, cpu, ram, storage, bandwidth, parentCost, suggestedPrice } = req.body;
  if (!id || !name || !parentCost) {
    return res.status(400).json({ error: "Missing fields." });
  }

  const newP = {
    id,
    name,
    type: type || "vps",
    cpu: cpu || "2 vCPU",
    ram: ram || "4 GB",
    storage: storage || "50 GB",
    bandwidth: bandwidth || "3 TB",
    parentCost: parseFloat(String(parentCost)),
    suggestedPrice: parseFloat(String(suggestedPrice || parentCost * 1.5)),
    active: true
  };

  masterPlans.push(newP);
  writeJson(PLANS_FILE, masterPlans);
  res.json({ success: true, plan: newP });
});

app.put("/api/admin/plans/:id", (req, res) => {
  const { id } = req.params;
  const { name, parentCost, suggestedPrice, cpu, ram, storage, bandwidth, active } = req.body;

  const idx = masterPlans.findIndex((p: any) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Master plan not found." });
  }

  if (name !== undefined) masterPlans[idx].name = name;
  if (cpu !== undefined) masterPlans[idx].cpu = cpu;
  if (ram !== undefined) masterPlans[idx].ram = ram;
  if (storage !== undefined) masterPlans[idx].storage = storage;
  if (bandwidth !== undefined) masterPlans[idx].bandwidth = bandwidth;
  if (parentCost !== undefined) masterPlans[idx].parentCost = parseFloat(String(parentCost));
  if (suggestedPrice !== undefined) masterPlans[idx].suggestedPrice = parseFloat(String(suggestedPrice));
  if (active !== undefined) masterPlans[idx].active = !!active;

  writeJson(PLANS_FILE, masterPlans);
  res.json({ success: true, plan: masterPlans[idx] });
});

app.delete("/api/admin/plans/:id", (req, res) => {
  const { id } = req.params;
  const originalSize = masterPlans.length;
  masterPlans = masterPlans.filter((p: any) => p.id !== id);
  
  if (masterPlans.length === originalSize) {
    return res.status(404).json({ error: "Master plan not found." });
  }

  writeJson(PLANS_FILE, masterPlans);
  res.json({ success: true, message: "Master Plan deleted successfully." });
});

app.get("/api/admin/links", (req, res) => {
  res.json(cryptoLinks);
});

app.get("/api/admin/payouts", (req, res) => {
  res.json(payoutLogs);
});

app.post("/api/admin/payouts/approve/:id", (req, res) => {
  const { id } = req.params;
  const payIdx = payoutLogs.findIndex((p: any) => p.id === id);
  if (payIdx === -1) {
    return res.status(404).json({ error: "Payout transaction ticket not found." });
  }

  const payout = payoutLogs[payIdx];
  if (payout.status !== "pending") {
    return res.status(400).json({ error: "Payout ticket has already been finalized." });
  }

  payout.status = "completed";
  payoutLogs[payIdx] = payout;
  writeJson(PAYOUTS_FILE, payoutLogs);

  const rId = payout.resellerId || "master_reseller_demo";
  const rIdx = resellers.findIndex((res: any) => res.id === rId);
  if (rIdx !== -1) {
    resellers[rIdx].escrowWithdrawn = parseFloat((resellers[rIdx].escrowWithdrawn + payout.amount).toFixed(2));
    resellers[rIdx].escrowBalance = parseFloat((resellers[rIdx].escrowBalance - payout.amount).toFixed(2));
    writeJson(RESELLERS_FILE, resellers);
  }

  res.json({ success: true, payout });
});

app.post("/api/admin/payouts/reject/:id", (req, res) => {
  const { id } = req.params;
  const payIdx = payoutLogs.findIndex((p: any) => p.id === id);
  if (payIdx === -1) {
    return res.status(404).json({ error: "Payout transaction ticket not found." });
  }

  const payout = payoutLogs[payIdx];
  if (payout.status !== "pending") {
    return res.status(400).json({ error: "Payout ticket is already finalized." });
  }

  payout.status = "rejected";
  payoutLogs[payIdx] = payout;
  writeJson(PAYOUTS_FILE, payoutLogs);

  const rId = payout.resellerId || "master_reseller_demo";
  const rIdx = resellers.findIndex((res: any) => res.id === rId);
  if (rIdx !== -1) {
    resellers[rIdx].resellerWallet = parseFloat((resellers[rIdx].resellerWallet + payout.amount).toFixed(2));
    writeJson(RESELLERS_FILE, resellers);
  }

  res.json({ success: true, payout });
});

app.get("/api/admin/system-stats", (req, res) => {
  const activeNodesCount = resellers.length;
  let totalEscrow = 0;
  let totalWithdrawn = 0;
  let totalResellerWallet = 0;
  let totalPlatformRevenue = 0;

  resellers.forEach((r: any) => {
    totalEscrow += r.escrowBalance || 0;
    totalWithdrawn += r.escrowWithdrawn || 0;
    totalResellerWallet += r.resellerWallet || 0;
    totalPlatformRevenue += r.lumenProfit || 0;
  });

  res.json({
    nodes: activeNodesCount,
    aggregatedEscrow: parseFloat(totalEscrow.toFixed(2)),
    aggregatedWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
    aggregatedResellerCredits: parseFloat(totalResellerWallet.toFixed(2)),
    aggregatedSystemEarnings: parseFloat(totalPlatformRevenue.toFixed(2)),
    monitoring: {
      hypervisors: [
        { name: "Node-1.KVM-London", status: "online", load: "42%", containers: 184, ramUsage: "64.8%" },
        { name: "Node-2.KVM-Frankfurt", status: "online", load: "31%", containers: 110, ramUsage: "48.2%" },
        { name: "Node-3.KVM-Singapore", status: "online", load: "18%", containers: 75, ramUsage: "39.0%" },
        { name: "Database.Cluster-Failover", status: "online", load: "12%", containers: 8, ramUsage: "22.5%" }
      ],
      backupsHealthy: true,
      ddosMitigationsLastHour: 4
    }
  });
});

// Serve static frontend assets for development & production building outputs
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(BASE_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lumen Standalone Full Stack Server listening on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Initialization failed:", err);
});