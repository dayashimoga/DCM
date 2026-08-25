'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Activity, FileText, Download, PlusCircle, ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { UsageLedgerSummary, ProviderEarningsSummary, Invoice, UserRole } from '@distributed-compute/shared-types';

export default function BillingPage() {
  const { user, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'provider'>('overview');
  const [usage, setUsage] = useState<UsageLedgerSummary | null>(null);
  const [providerEarnings, setProviderEarnings] = useState<ProviderEarningsSummary | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const userId = user?.id || 'demo-user';

  const fetchBillingData = async () => {
    try {
      // Customer usage
      const resUsage = await fetch(`${apiUrl}/billing/usage/${userId}`);
      if (resUsage.ok) {
        const data = await resUsage.json();
        setUsage(data);
      }

      // Provider earnings
      const resEarnings = await fetch(`${apiUrl}/billing/provider-earnings/${userId}`);
      if (resEarnings.ok) {
        const data = await resEarnings.json();
        setProviderEarnings(data);
      }

      // Invoice
      const resInvoice = await fetch(`${apiUrl}/billing/invoices/${userId}`);
      if (resInvoice.ok) {
        const data = await resInvoice.json();
        setInvoice(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  // Fallback demo data if backend not reachable
  const displayUsage: UsageLedgerSummary = usage || {
    customerId: userId,
    totalGpuSeconds: 14250,
    totalCostUsd: 18.75,
    currentBurnRateUsdPerHour: 2.70,
    activeJobsCount: 2,
    records: [
      {
        id: 'usg-01',
        jobId: 'job-pytorch-train',
        customerId: userId,
        providerId: 'prov-01',
        nodeId: 'node-h100',
        gpuSeconds: 7200,
        cpuSeconds: 7200,
        ramGbSeconds: 115200,
        hourlyRateUsd: 2.45,
        costUsd: 4.90,
        providerEarningsUsd: 4.165,
        platformFeeUsd: 0.735,
        timestamp: '2026-08-25T13:00:00Z',
      },
      {
        id: 'usg-02',
        jobId: 'job-llama-eval',
        customerId: userId,
        providerId: 'prov-02',
        nodeId: 'node-rtx4090',
        gpuSeconds: 7050,
        cpuSeconds: 7050,
        ramGbSeconds: 56400,
        hourlyRateUsd: 1.35,
        costUsd: 2.64,
        providerEarningsUsd: 2.244,
        platformFeeUsd: 0.396,
        timestamp: '2026-08-25T11:30:00Z',
      },
    ],
  };

  const displayEarnings: ProviderEarningsSummary = providerEarnings || {
    providerId: userId,
    totalGrossEarningsUsd: 145.80,
    totalPlatformFeesUsd: 21.87,
    totalNetEarningsUsd: 123.93,
    pendingPayoutUsd: 123.93,
    totalComputeSecondsServed: 214000,
  };

  const displayInvoice: Invoice = invoice || {
    id: 'inv-aug-2026',
    invoiceNumber: 'INV-2026-8841',
    userId,
    periodStart: '2026-08-01T00:00:00Z',
    periodEnd: '2026-08-25T23:59:59Z',
    subtotalUsd: 18.75,
    platformFeeUsd: 2.81,
    totalUsd: 18.75,
    status: 'PAID',
    lineItems: [
      {
        description: 'H100 SXM5 80GB Instance Lease (2.0 hrs @ $2.45/hr)',
        quantity: 2.0,
        unit: 'GPU-Hours',
        unitPriceUsd: 2.45,
        amountUsd: 4.90,
      },
      {
        description: 'RTX 4090 24GB Instance Lease (1.95 hrs @ $1.35/hr)',
        quantity: 1.95,
        unit: 'GPU-Hours',
        unitPriceUsd: 1.35,
        amountUsd: 2.64,
      },
    ],
    createdAt: '2026-08-25T14:00:00Z',
  };

  const handleTopUp = async () => {
    setLoading(true);
    try {
      await fetch(`${apiUrl}/billing/credits/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountUsd: topUpAmount }),
      });
      if (refreshProfile) await refreshProfile();
      fetchBillingData();
    } catch {}
    setLoading(false);
    setShowTopUpModal(false);
  };

  const balance = user?.balanceUsd ?? 50.00;

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <CreditCard size={14} /> Real-Time Metering & Ledger
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Billing & Usage Accounting
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Sub-second accurate compute metering, automated balance deductions, and provider commission splits.
          </p>
        </div>

        <button
          onClick={() => setShowTopUpModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusCircle size={16} /> Add Credits
        </button>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Add Account Credits</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Top up your balance for instant GPU compute deployment.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              {[25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: topUpAmount === amt ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    background: topUpAmount === amt ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTopUpModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleTopUp} disabled={loading} className="btn btn-primary">
                {loading ? 'Processing...' : `Confirm +$${topUpAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Available Balance</span>
            <DollarSign size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            ${balance.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Auto-terminates on zero balance
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Burn Rate</span>
            <Zap size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            ${displayUsage.currentBurnRateUsdPerHour.toFixed(2)}<span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/hr</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across {displayUsage.activeJobsCount} running workloads
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total GPU Time</span>
            <Activity size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {(displayUsage.totalGpuSeconds / 3600).toFixed(1)} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>hrs</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {displayUsage.totalGpuSeconds.toLocaleString()} GPU-seconds served
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Compute Spend</span>
            <ArrowUpRight size={18} color="var(--accent-indigo)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            ${displayUsage.totalCostUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Lifetime usage cost
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        {[
          { id: 'overview', label: 'Usage Metering Records' },
          { id: 'invoices', label: 'Itemized Invoices' },
          { id: 'provider', label: 'Provider Revenue Splits (85/15)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === t.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview (Usage Records) */}
      {activeTab === 'overview' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Real-Time Telemetry Usage Ledger</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Job ID</th>
                  <th style={{ padding: '10px' }}>Node</th>
                  <th style={{ padding: '10px' }}>GPU Duration</th>
                  <th style={{ padding: '10px' }}>Rate ($/hr)</th>
                  <th style={{ padding: '10px' }}>Total Cost</th>
                  <th style={{ padding: '10px' }}>Provider (85%)</th>
                  <th style={{ padding: '10px' }}>Fee (15%)</th>
                </tr>
              </thead>
              <tbody>
                {displayUsage.records.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{r.jobId}</td>
                    <td style={{ padding: '12px 10px', color: '#ffffff' }}>{r.nodeId}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{r.gpuSeconds}s</td>
                    <td style={{ padding: '12px 10px', color: '#ffffff' }}>${r.hourlyRateUsd.toFixed(2)}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--accent-emerald)' }}>${r.costUsd.toFixed(4)}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>${r.providerEarningsUsd.toFixed(4)}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>${r.platformFeeUsd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Invoices */}
      {activeTab === 'invoices' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Invoice {displayInvoice.invoiceNumber}</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Billing Period: {new Date(displayInvoice.periodStart).toLocaleDateString()} – {new Date(displayInvoice.periodEnd).toLocaleDateString()}
              </div>
            </div>
            <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
              {displayInvoice.status}
            </span>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Description</th>
                  <th style={{ padding: '10px' }}>Quantity</th>
                  <th style={{ padding: '10px' }}>Unit</th>
                  <th style={{ padding: '10px' }}>Unit Price</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {displayInvoice.lineItems.map((li, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 10px', color: '#ffffff' }}>{li.description}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{li.quantity}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{li.unit}</td>
                    <td style={{ padding: '12px 10px', color: '#ffffff' }}>${li.unitPriceUsd.toFixed(2)}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>${li.amountUsd.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ width: '240px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Subtotal:</span>
                <span>${displayInvoice.subtotalUsd.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>Platform Fee (incl. 15%):</span>
                <span>${displayInvoice.platformFeeUsd.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#ffffff', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <span>Total Paid:</span>
                <span style={{ color: 'var(--accent-emerald)' }}>${displayInvoice.totalUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Provider Earnings */}
      {activeTab === 'provider' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <ShieldCheck size={20} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Provider Revenue Share Model</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            Hardware providers receive <strong>85%</strong> of gross compute fees. The platform retains a 15% fee for orchestration, anti-spoofing verification, and networking.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gross Compute Fees</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                ${displayEarnings.totalGrossEarningsUsd.toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Marketplace Fee (15%)</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
                -${displayEarnings.totalPlatformFeesUsd.toFixed(2)}
              </div>
            </div>

            <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>Net Provider Payout (85%)</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                ${displayEarnings.totalNetEarningsUsd.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
