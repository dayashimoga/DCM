'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ShieldCheck, Building2, CheckCircle2, TrendingUp, Cpu, CreditCard } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import {
  ProviderEarningsAnalytics,
  PayoutDestinationType,
  PayoutStatus,
} from '@distributed-compute/shared-types';

export default function ProviderPayoutsPage() {
  const { user, refreshProfile } = useAuth();
  const [analytics, setAnalytics] = useState<ProviderEarningsAnalytics | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showAddDestModal, setShowAddDestModal] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(100);
  const [selectedDestType, setSelectedDestType] = useState<PayoutDestinationType>(PayoutDestinationType.BANK_STRIPE_CONNECT);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newTarget, setNewTarget] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const providerId = user?.id || 'demo-provider';

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${apiUrl}/payouts/analytics/${providerId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  // Fallback demo data
  const data: ProviderEarningsAnalytics = analytics || {
    providerId,
    grossRevenueUsd: 1450.00,
    platformFeeUsd: 217.50,
    netEarnedUsd: 1232.50,
    availablePayoutBalanceUsd: user?.balanceUsd ?? 482.50,
    totalPaidOutUsd: 750.00,
    activeGpuCount: 4,
    averageUtilizationPercent: 82.4,
    estimatedMonthlyYieldUsd: 3120.00,
    payoutHistory: [
      {
        id: 'po-01',
        providerId,
        amountUsd: 750.00,
        feeUsd: 1.50,
        netAmountUsd: 748.50,
        destinationType: PayoutDestinationType.BANK_STRIPE_CONNECT,
        destinationTarget: '•••• 4242',
        status: PayoutStatus.COMPLETED,
        txHashOrRef: 'stripe_po_98124',
        requestedAt: '2026-08-20T10:30:00Z',
        processedAt: '2026-08-20T10:30:05Z',
      },
    ],
    destinations: [
      {
        id: 'dest-01',
        providerId,
        type: PayoutDestinationType.BANK_STRIPE_CONNECT,
        label: 'Silicon Valley Bank Checking',
        target: '•••• 4242',
        isDefault: true,
        verified: true,
        createdAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'dest-02',
        providerId,
        type: PayoutDestinationType.CRYPTO_USDC,
        label: 'Treasury Cold Storage (Solana)',
        target: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyT844e',
        isDefault: false,
        verified: true,
        createdAt: '2026-08-10T00:00:00Z',
      },
    ],
  };

  const handleRequestPayout = async () => {
    setErrorMsg(null);
    if (payoutAmount < 50) {
      setErrorMsg('Minimum payout request is $50.00');
      return;
    }
    if (payoutAmount > data.availablePayoutBalanceUsd) {
      setErrorMsg('Amount exceeds available payout balance');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/payouts/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          amountUsd: payoutAmount,
          destinationType: selectedDestType,
        }),
      });
      if (res.ok) {
        if (refreshProfile) await refreshProfile();
        await fetchAnalytics();
        setShowPayoutModal(false);
      } else {
        const err = await res.json();
        setErrorMsg(err.message || 'Payout request failed');
      }
    } catch {
      setErrorMsg('Network error requesting payout');
    }
    setLoading(false);
  };

  const handleAddDestination = async () => {
    if (!newLabel || !newTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/payouts/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          type: selectedDestType,
          label: newLabel,
          target: newTarget,
        }),
      });
      if (res.ok) {
        await fetchAnalytics();
        setShowAddDestModal(false);
        setNewLabel('');
        setNewTarget('');
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <DollarSign size={14} /> Provider Settlement Rails
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Earnings & Payouts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Automated settlement via Stripe Connect Bank Transfer or instant on-chain Crypto (85% net provider share).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddDestModal(true)}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Building2 size={16} /> Add Destination
          </button>
          <button
            onClick={() => setShowPayoutModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowUpRight size={16} /> Request Payout
          </button>
        </div>
      </div>

      {/* Request Payout Modal */}
      {showPayoutModal && (
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
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Request Payout</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Minimum payout threshold is $50.00. Funds will be deposited to your verified destination.
            </p>

            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-red)', color: '#f87171', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' }}>
                {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Payout Amount (USD)</label>
              <input
                type="number"
                min="50"
                max={data.availablePayoutBalanceUsd}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                className="input-field"
                style={{ width: '100%', fontSize: '16px', fontWeight: 700 }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Available to withdraw: ${data.availablePayoutBalanceUsd.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Destination Method</label>
              <select
                value={selectedDestType}
                onChange={(e) => setSelectedDestType(e.target.value as PayoutDestinationType)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value={PayoutDestinationType.BANK_STRIPE_CONNECT}>Bank Account (Stripe Connect - $1.50 Fee)</option>
                <option value={PayoutDestinationType.CRYPTO_USDC}>Crypto USDC (Solana SPL - $0.50 Fee)</option>
                <option value={PayoutDestinationType.CRYPTO_SOL}>Crypto Solana Mainnet ($0.50 Fee)</option>
                <option value={PayoutDestinationType.CRYPTO_ETH}>Crypto Ethereum Mainnet ($0.50 Fee)</option>
              </select>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Gross Amount:</span>
                <span>${payoutAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Processing Fee:</span>
                <span>-${selectedDestType === PayoutDestinationType.BANK_STRIPE_CONNECT ? '1.50' : '0.50'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--accent-emerald)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '6px' }}>
                <span>Net Received:</span>
                <span>${(payoutAmount - (selectedDestType === PayoutDestinationType.BANK_STRIPE_CONNECT ? 1.50 : 0.50)).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowPayoutModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleRequestPayout} disabled={loading} className="btn btn-primary">
                {loading ? 'Processing...' : 'Confirm Payout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Destination Modal */}
      {showAddDestModal && (
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
          <div className="glass-panel" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Add Payout Destination</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Link a bank account via Stripe Connect or register an on-chain crypto wallet.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Destination Type</label>
              <select
                value={selectedDestType}
                onChange={(e) => setSelectedDestType(e.target.value as PayoutDestinationType)}
                className="input-field"
                style={{ width: '100%' }}
              >
                <option value={PayoutDestinationType.BANK_STRIPE_CONNECT}>Bank Account (Stripe Connect)</option>
                <option value={PayoutDestinationType.CRYPTO_USDC}>Crypto USDC (Solana SPL)</option>
                <option value={PayoutDestinationType.CRYPTO_SOL}>Crypto SOL</option>
                <option value={PayoutDestinationType.CRYPTO_ETH}>Crypto ETH</option>
              </select>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Label</label>
              <input
                type="text"
                placeholder="e.g. Mercury Checking or Ledger Cold Wallet"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Account Last 4 / Wallet Address</label>
              <input
                type="text"
                placeholder="e.g. •••• 4242 or 0x742d... / EPjF..."
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddDestModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddDestination} disabled={loading || !newLabel || !newTarget} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Destination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Available for Payout</span>
            <DollarSign size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            ${data.availablePayoutBalanceUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Net 85% revenue ready for instant settlement
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Lifetime Paid</span>
            <CheckCircle2 size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            ${data.totalPaidOutUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Total settled provider disbursements
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>30-Day Estimated Yield</span>
            <TrendingUp size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)' }}>
            ${data.estimatedMonthlyYieldUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Forecast based on {data.averageUtilizationPercent}% avg utilization
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Fleet GPUs</span>
            <Cpu size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.activeGpuCount} GPUs
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Earning compute rewards in real-time
          </div>
        </div>
      </div>

      {/* Connected Destinations */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Connected Payout Destinations</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{data.destinations.length} configured</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {data.destinations.map((d) => (
            <div key={d.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>{d.label}</span>
                {d.isDefault && (
                  <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700 }}>
                    DEFAULT
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                {d.target}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-emerald)' }}>
                <ShieldCheck size={13} /> Verified for Instant Settlement
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payout History Ledger */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Payout Transaction History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Payout ID</th>
                <th style={{ padding: '10px' }}>Destination</th>
                <th style={{ padding: '10px' }}>Gross</th>
                <th style={{ padding: '10px' }}>Fee</th>
                <th style={{ padding: '10px' }}>Net Paid</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.payoutHistory.map((po) => (
                <tr key={po.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{po.id}</td>
                  <td style={{ padding: '12px 10px', color: '#ffffff' }}>{po.destinationType.replace('_', ' ')} ({po.destinationTarget})</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>${po.amountUsd.toFixed(2)}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>-${po.feeUsd.toFixed(2)}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--accent-emerald)' }}>${po.netAmountUsd.toFixed(2)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                      {po.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(po.requestedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
