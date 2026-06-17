"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface TransactionsTabsProps {
  transactionsPanel: ReactNode;
  importPanel: ReactNode;
}

type Tab = "transactions" | "import";

const TAB_LABELS: Record<Tab, string> = {
  transactions: "Transactions",
  import: "Import",
};

export default function TransactionsTabs({
  transactionsPanel,
  importPanel,
}: TransactionsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("transactions");

  return (
    <div>
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 16,
        }}
      >
        {(["transactions", "import"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? "#1e293b" : "#64748b",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottom:
                activeTab === tab
                  ? "2px solid #1e293b"
                  : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Tab panels — both rendered to preserve server-component children,
          hidden via display:none so client state (scroll pos, form input) is
          preserved when switching tabs */}
      <div style={{ display: activeTab === "transactions" ? "block" : "none" }}>
        {transactionsPanel}
      </div>
      <div style={{ display: activeTab === "import" ? "block" : "none" }}>
        {importPanel}
      </div>
    </div>
  );
}
