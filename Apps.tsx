import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ResellerPanelDashboard from "./pages/ResellerPanelDashboard";
import ResellerPaymentGateway from "./pages/ResellerPaymentGateway";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Reseller Dashboard Options */}
        <Route path="/" element={<ResellerPanelDashboard />} />
        <Route path="/reseller-panel" element={<ResellerPanelDashboard />} />
        <Route path="/reseller-panel/index.html" element={<ResellerPanelDashboard />} />

        {/* Reseller Payment Gate Options */}
        <Route path="/pay" element={<ResellerPaymentGateway />} />
        <Route path="/pay.html" element={<ResellerPaymentGateway />} />
        <Route path="/reseller-panel/pay" element={<ResellerPaymentGateway />} />
        <Route path="/reseller-panel/pay.html" element={<ResellerPaymentGateway />} />

        {/* Fallback redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
