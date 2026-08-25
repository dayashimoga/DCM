'use client';

import React, { useState, useEffect } from 'react';
import { Wallet, CreditCard, Lock, RefreshCw, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { WalletSummary, PaymentMethod, TransactionType } from '@distributed-compute/shared-types';

export default function WalletPage() {
  const { user, refreshProfile } = useAuth();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>(PaymentMethod.FIAT_STRIPE);
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('USDC');
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const userId = user?.id || 'demo-user';

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${apiUrl}/payments/wallet/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  // Fallback demo data if backend not reachable
  const displayWallet: WalletSummary = wallet || {
    userId,
    availableBalanceUsd: user?.balanceUsd ?? 50.00,
    lockedInEscrowUsd: 12.50,
    totalDepositedUsd: 62.50,
    cryptoAddresses: [
      {
        symbol: 'USDC',
        network: 'Solana (SPL)',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyT844e',
        minDepositUsd: 5.0,
      },
      {
        symbol: 'USDT',
        network: 'Ethereum (ERC-20)',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7844e',
        minDepositUsd: 10.0,
      },
      {
        symbol: 'SOL',
        network: 'Solana Mainnet',
        address: 'So11111111111111111111111111111111111111112844e',
        minDepositUsd: 5.0,
      },
      {
        symbol: 'ETH',
        network: 'Ethereum Mainnet',
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e844e',
        minDepositUsd: 20.0,
      },
    ],
    recentTransactions: [
      {
        id: 'tx-01',
        userId,
        type: TransactionType.DEPOSIT,
        amountUsd: 50.00,
        currency: 'USD',
        method: PaymentMethod.FIAT_STRIPE,
        description: 'Card Deposit via Stripe Checkout',
        status: 'CONFIRMED',
        createdAt: '2026-08-25T12:00:00Z',
      },
      {
        id: 'tx-02',
        userId,
        type: TransactionType.ESCROW_LOCK,
        amountUsd: 12.50,
        currency: 'USD',
        description: 'Escrow Hold Locked for Job job-pytorch-01',
        status: 'CONFIRMED',
        createdAt: '2026-08-25T13:15:00Z',
      },
    ],
    activeEscrows: [
      {
        id: 'escrow-job-pytorch-01',
        jobId: 'job-pytorch-01',
        customerId: userId,
        providerId: 'prov-01',
        amountLockedUsd: 12.50,
        amountSettledUsd: 0,
        amountRefundedUsd: 0,
        status: 'HELD' as any,
        createdAt: '2026-08-25T13:15:00Z',
      },
    ],
  };

  const handleDeposit = async () => {
    setLoading(true);
    try {
      await fetch(`${apiUrl}/payments/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amountUsd: depositAmount,
          method: depositMethod,
        }),
      });
      if (refreshProfile) await refreshProfile();
      fetchWallet();
    } catch {}
    setLoading(false);
    setShowDepositModal(false);
  };

  const handleCopy = (addr: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(addr);
      setCopiedAddr(addr);
      setTimeout(() => setCopiedAddr(null), 2000);
    }
  };

  const currentCrypto = displayWallet.cryptoAddresses.find((c) => c.symbol === selectedCrypto) || displayWallet.cryptoAddresses[0];

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <Wallet size={14} /> Multi-Rail Vault & Escrow
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Customer Wallet & Escrow
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Multi-currency deposits (Fiat & Crypto) with trustless automated escrow budget locking.
          </p>
        </div>

        <button
          onClick={() => setShowDepositModal(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <CreditCard size={16} /> Deposit Funds
        </button>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
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
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Multi-Rail Deposit</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Choose your preferred funding source (Fiat Card or On-Chain Crypto).
            </p>

            {/* Payment Method Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setDepositMethod(PaymentMethod.FIAT_STRIPE)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: depositMethod === PaymentMethod.FIAT_STRIPE ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: depositMethod === PaymentMethod.FIAT_STRIPE ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                💳 Credit Card (Stripe)
              </button>
              <button
                type="button"
                onClick={() => setDepositMethod(PaymentMethod.CRYPTO_USDC)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: depositMethod !== PaymentMethod.FIAT_STRIPE ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: depositMethod !== PaymentMethod.FIAT_STRIPE ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ⚡ Crypto (Instant)
              </button>
            </div>

            {depositMethod === PaymentMethod.FIAT_STRIPE ? (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Deposit Amount (USD)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                  {[25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        border: depositAmount === amt ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: depositAmount === amt ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Select Asset</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
                  {['USDC', 'USDT', 'SOL', 'ETH'].map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setSelectedCrypto(sym)}
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-sm)',
                        border: selectedCrypto === sym ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        background: selectedCrypto === sym ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Network: {currentCrypto.network}</div>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--accent-cyan)', wordBreak: 'break-all', marginTop: '6px' }}>
                    {currentCrypto.address}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(currentCrypto.address)}
                    style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '12px', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Copy size={13} /> {copiedAddr === currentCrypto.address ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDepositModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeposit} disabled={loading} className="btn btn-primary">
                {loading ? 'Confirming...' : `Deposit $${depositAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Balance & Escrow Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Available Balance</span>
            <Wallet size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            ${displayWallet.availableBalanceUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Ready for instant compute allocation
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Locked in Escrow</span>
            <Lock size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)' }}>
            ${displayWallet.lockedInEscrowUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Protected in active workload contracts
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Vault Value</span>
            <ShieldCheck size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            ${displayWallet.totalDepositedUsd.toFixed(2)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Combined balance + escrow
          </div>
        </div>
      </div>

      {/* Active Escrow Holds */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Lock size={18} color="var(--accent-amber)" />
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Active Escrow Contracts</h3>
        </div>

        {displayWallet.activeEscrows.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No active escrow holds currently locked.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Escrow ID</th>
                  <th style={{ padding: '10px' }}>Job</th>
                  <th style={{ padding: '10px' }}>Locked Budget</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {displayWallet.activeEscrows.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{e.id}</td>
                    <td style={{ padding: '12px 10px', color: '#ffffff' }}>{e.jobId}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--accent-amber)' }}>${e.amountLockedUsd.toFixed(2)}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                        {e.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Transaction History</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Type</th>
                <th style={{ padding: '10px' }}>Description</th>
                <th style={{ padding: '10px' }}>Amount</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {displayWallet.recentTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.ESCROW_REFUND ? 'rgba(52, 211, 153, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.ESCROW_REFUND ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                    }}>
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#ffffff' }}>{tx.description}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 700, color: tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.ESCROW_REFUND ? 'var(--accent-emerald)' : '#ffffff' }}>
                    {tx.type === TransactionType.DEPOSIT || tx.type === TransactionType.ESCROW_REFUND ? '+' : '-'}${tx.amountUsd.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{tx.status}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
