"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var isResellerSubdir = import_fs.default.existsSync(import_path.default.resolve(process.cwd(), "reseller-panel"));
var BASE_DIR = isResellerSubdir ? import_path.default.resolve(process.cwd(), "reseller-panel") : process.cwd();
var STORAGE_DIR = import_path.default.resolve(BASE_DIR, "db_data");
if (!import_fs.default.existsSync(STORAGE_DIR)) {
  import_fs.default.mkdirSync(STORAGE_DIR, { recursive: true });
}
var LINKS_FILE = import_path.default.join(STORAGE_DIR, "crypto_links.json");
var PAYOUTS_FILE = import_path.default.join(STORAGE_DIR, "crypto_payouts.json");
var PLANS_FILE = import_path.default.join(STORAGE_DIR, "master_plans.json");
var RESELLERS_FILE = import_path.default.join(STORAGE_DIR, "resellers.json");
app.get("/config.json", (req, res) => {
  const configFile = import_path.default.join(BASE_DIR, "config.json");
  if (import_fs.default.existsSync(configFile)) {
    res.sendFile(configFile);
  } else {
    res.status(404).json({ error: "config.json not found" });
  }
});
app.get("/reseller-panel/config.json", (req, res) => {
  const configFile = import_path.default.join(BASE_DIR, "config.json");
  if (import_fs.default.existsSync(configFile)) {
    res.sendFile(configFile);
  } else {
    res.status(404).json({ error: "config.json not found" });
  }
});
var readJson = (filePath, fallback) => {
  if (!import_fs.default.existsSync(filePath)) {
    import_fs.default.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
    return fallback;
  }
  try {
    return JSON.parse(import_fs.default.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return fallback;
  }
};
var writeJson = (filePath, data) => {
  try {
    import_fs.default.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error writing to ${filePath}:`, e);
  }
};
var defaultMasterPlans = [
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
    parentCost: 4.8,
    suggestedPrice: 12,
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
    parentCost: 14.5,
    suggestedPrice: 38,
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
    parentCost: 0.8,
    suggestedPrice: 2.5,
    active: true
  }
];
var defaultResellers = [
  {
    id: "lumen_host_demo",
    name: "Lumen Host Whitelabel Portal",
    email: "support@lumenhost.pro",
    escrowBalance: 1254.8,
    escrowWithdrawn: 150,
    resellerWallet: 84.8,
    lumenProfit: 1170,
    status: "active",
    joined: "2026-01-12",
    marginFactor: 1.4
  },
  {
    id: "master_reseller_demo",
    name: "Master Reseller Gate",
    email: "admin@mastergate.cloud",
    escrowBalance: 2450,
    escrowWithdrawn: 300,
    resellerWallet: 410,
    lumenProfit: 2040,
    status: "active",
    joined: "2026-02-18",
    marginFactor: 1.5
  },
  {
    id: "cybersphere",
    name: "CyberSphere VPS Solutions",
    email: "billing@cybersphere.net",
    escrowBalance: 0,
    escrowWithdrawn: 0,
    resellerWallet: 0,
    lumenProfit: 0,
    status: "suspended",
    joined: "2026-03-01",
    marginFactor: 1.3
  }
];
var defaultLinks = [
  {
    id: "pay-7749",
    clientName: "Alex Mercer",
    clientEmail: "alex@mercerdev.io",
    serviceName: "Developer Micro Node",
    amountUsd: 12,
    parentCost: 1.99,
    markupAmount: 10.01,
    cryptoType: "USDT",
    cryptoAddress: "0x3fff75865f2d0a44671857994a69daeb53994a69",
    cryptocurrencyAmount: 12,
    status: "completed",
    createdAt: new Date(Date.now() - 36 * 3600 * 1e3).toISOString(),
    resellerId: "master_reseller_demo"
  },
  {
    id: "pay-1104",
    clientName: "Sophia Carter",
    clientEmail: "sophia@carterconsulting.pro",
    serviceName: "Standard Scale Engine",
    amountUsd: 25,
    parentCost: 4.8,
    markupAmount: 20.2,
    cryptoType: "BTC",
    cryptoAddress: "bc1qxy2kg3ctynxu7ej6774ry2w7aspyuv7cjzsz8p",
    cryptocurrencyAmount: 312e-6,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    resellerId: "master_reseller_demo"
  }
];
var defaultPayouts = [
  {
    id: "wd-091",
    amount: 150,
    cryptoAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    cryptoType: "USDT",
    status: "completed",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1e3).toISOString(),
    resellerId: "master_reseller_demo"
  }
];
var masterPlans = readJson(PLANS_FILE, defaultMasterPlans);
var resellers = readJson(RESELLERS_FILE, defaultResellers);
var cryptoLinks = readJson(LINKS_FILE, defaultLinks);
var payoutLogs = readJson(PAYOUTS_FILE, defaultPayouts);
var walletPoolAddresses = {
  USDT: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  BTC: "bc1qxy2kg3ctynxu7ej6774ry2w7aspyuv7cjzsz8p",
  ETH: "0x3fff75865f2d0a44671857994a69daeb53994a69",
  SOL: "HN7cABviGo3B4vud6vD1483B89Gndy4df1c2d9GNDY4c"
};
var cryptoRatesUsd = {
  USDT: 1,
  BTC: 89e3,
  ETH: 3200,
  SOL: 185
};
app.get("/api/crypto/dashboard", (req, res) => {
  const resellerId = req.query.resellerId || "master_reseller_demo";
  const rIdx = resellers.findIndex((r2) => r2.id === resellerId);
  const r = rIdx !== -1 ? resellers[rIdx] : resellers[0];
  const matchedLinks = cryptoLinks.filter((l) => l.resellerId === r.id);
  const matchedPayouts = payoutLogs.filter((p) => p.resellerId === r.id);
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
  const rate = cryptoRatesUsd[token] || 1;
  const cryptoAmount = parseFloat((usdValue / rate).toFixed(token === "BTC" ? 6 : token === "ETH" ? 5 : 4));
  const finalParentCost = parentCost !== void 0 ? parseFloat(String(parentCost)) : parseFloat((usdValue * 0.75).toFixed(2));
  const finalMarkup = parseFloat((usdValue - finalParentCost).toFixed(2));
  const newLink = {
    id: `pay-${Math.floor(1e3 + Math.random() * 9e3)}`,
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    resellerId: rId
  };
  cryptoLinks.unshift(newLink);
  writeJson(LINKS_FILE, cryptoLinks);
  res.json(newLink);
});
app.get("/api/crypto/link-info/:id", (req, res) => {
  const { id } = req.params;
  const match = cryptoLinks.find((l) => l.id === id);
  if (!match) {
    return res.status(404).json({ error: "Invoice billing link not found." });
  }
  res.json(match);
});
app.post("/api/crypto/pay-simulate/:id", (req, res) => {
  const { id } = req.params;
  const linkIdx = cryptoLinks.findIndex((l) => l.id === id);
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
  const rIdx = resellers.findIndex((res2) => res2.id === rId);
  if (rIdx !== -1) {
    const parentCost = link.parentCost || link.amountUsd * 0.75;
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
  const rIdx = resellers.findIndex((res2) => res2.id === rId);
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    resellerId: rId
  };
  payoutLogs.unshift(newPayout);
  writeJson(PAYOUTS_FILE, payoutLogs);
  resellers[rIdx].resellerWallet = parseFloat((resellers[rIdx].resellerWallet - withdrawalVal).toFixed(2));
  writeJson(RESELLERS_FILE, resellers);
  res.json({ success: true, payout: newPayout });
});
app.get("/api/admin/resellers", (req, res) => {
  res.json(resellers);
});
app.put("/api/admin/resellers/:id", (req, res) => {
  const { id } = req.params;
  const { name, email, resellerWallet, status, marginFactor } = req.body;
  const idx = resellers.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Reseller registration not found." });
  }
  if (name !== void 0) resellers[idx].name = name;
  if (email !== void 0) resellers[idx].email = email;
  if (resellerWallet !== void 0) resellers[idx].resellerWallet = parseFloat(String(resellerWallet));
  if (status !== void 0) resellers[idx].status = status;
  if (marginFactor !== void 0) resellers[idx].marginFactor = parseFloat(String(marginFactor));
  writeJson(RESELLERS_FILE, resellers);
  res.json({ success: true, reseller: resellers[idx] });
});
app.post("/api/admin/resellers", (req, res) => {
  const { id, name, email, marginFactor } = req.body;
  if (!id || !name || !email) {
    return res.status(400).json({ error: "Missing required reseller details." });
  }
  const already = resellers.some((r) => r.id === id);
  if (already) {
    return res.status(400).json({ error: "Reseller ID portal already registered." });
  }
  const newR = {
    id,
    name,
    email,
    escrowBalance: 0,
    escrowWithdrawn: 0,
    resellerWallet: 0,
    lumenProfit: 0,
    status: "active",
    joined: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
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
  const idx = masterPlans.findIndex((p) => p.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Master plan not found." });
  }
  if (name !== void 0) masterPlans[idx].name = name;
  if (cpu !== void 0) masterPlans[idx].cpu = cpu;
  if (ram !== void 0) masterPlans[idx].ram = ram;
  if (storage !== void 0) masterPlans[idx].storage = storage;
  if (bandwidth !== void 0) masterPlans[idx].bandwidth = bandwidth;
  if (parentCost !== void 0) masterPlans[idx].parentCost = parseFloat(String(parentCost));
  if (suggestedPrice !== void 0) masterPlans[idx].suggestedPrice = parseFloat(String(suggestedPrice));
  if (active !== void 0) masterPlans[idx].active = !!active;
  writeJson(PLANS_FILE, masterPlans);
  res.json({ success: true, plan: masterPlans[idx] });
});
app.delete("/api/admin/plans/:id", (req, res) => {
  const { id } = req.params;
  const originalSize = masterPlans.length;
  masterPlans = masterPlans.filter((p) => p.id !== id);
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
  const payIdx = payoutLogs.findIndex((p) => p.id === id);
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
  const rIdx = resellers.findIndex((res2) => res2.id === rId);
  if (rIdx !== -1) {
    resellers[rIdx].escrowWithdrawn = parseFloat((resellers[rIdx].escrowWithdrawn + payout.amount).toFixed(2));
    resellers[rIdx].escrowBalance = parseFloat((resellers[rIdx].escrowBalance - payout.amount).toFixed(2));
    writeJson(RESELLERS_FILE, resellers);
  }
  res.json({ success: true, payout });
});
app.post("/api/admin/payouts/reject/:id", (req, res) => {
  const { id } = req.params;
  const payIdx = payoutLogs.findIndex((p) => p.id === id);
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
  const rIdx = resellers.findIndex((res2) => res2.id === rId);
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
  resellers.forEach((r) => {
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
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(BASE_DIR, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lumen Standalone Full Stack Server listening on http://localhost:${PORT}`);
  });
}
bootstrap().catch((err) => {
  console.error("Initialization failed:", err);
});
//# sourceMappingURL=server.cjs.map
