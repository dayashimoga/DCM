'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu, Server, DollarSign, Terminal, Shield, ArrowRight,
  CheckCircle2, Copy, Check, Sparkles, Sliders, Wallet, Activity
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';

export default function ProviderOnboardingPage() {
  const { user } = useAuth();
  const [selectedGpu, setSelectedGpu] = useState<'H100' | 'A100' | '4090' | 'CPU'>('H100');
  const [deviceCount, setDeviceCount] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);

  const earningsRates = {
    H100: { name: 'NVIDIA H100 80GB', hourly: 2.50, util: 0.85 },
    A100: { name: 'NVIDIA A100 80GB', hourly: 1.60, util: 0.80 },
    4090: { name: 'GeForce RTX 4090', hourly: 0.65, util: 0.75 },
    CPU: { name: '64-Core EPYC / Xeon', hourly: 0.35, util: 0.70 },
  };

  const currentRate = earningsRates[selectedGpu];
  const monthlyGross = currentRate.hourly * 24 * 30 * deviceCount * currentRate.util;
  const providerTake = monthlyGross * 0.85; // 85% provider commission split

  const runCommand = `podman run -d \\
  --name compute-agent \\
  -e CONTROL_PLANE_URL=https://api.distributed.gpu \\
  -e PAIRING_TOKEN=ptk_sec_auto_gen \\
  localhost/compute-agent:latest`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(runCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          color: 'var(--accent-purple)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
        }}>
          <Sparkles size={14} /> Decentralized Hardware Supply Network
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 900,
          lineHeight: 1.15,
          letterSpacing: '-1px',
          maxWidth: '860px',
          margin: '0 auto 20px auto',
        }}>
          Monetize Your Compute with <span className="gradient-text">85% Revenue Share</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          margin: '0 auto 32px auto',
          lineHeight: 1.6,
        }}>
          Join our decentralized compute marketplace. Install our zero-inbound, rootless agent on your gaming PCs, mining rigs, or datacenters and start earning automated hourly payouts.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/provider/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
            <Server size={16} /> Open Provider Dashboard
          </Link>
          <Link href="/provider/payouts" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
            <Wallet size={16} /> Payout Settings
          </Link>
        </div>
      </section>

      {/* Interactive Earnings Calculator */}
      <section className="glass-panel" style={{ padding: '36px', marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
          <Sliders size={15} /> Earnings Estimator
        </div>
        <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '24px' }}>
          Estimate Your Monthly Hardware Income
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 30vw, 360px), 1fr))', gap: '36px', alignItems: 'center' }}>
          {/* Controls */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Hardware Class
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {(['H100', 'A100', '4090', 'CPU'] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedGpu(tier)}
                    style={{
                      padding: '12px',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedGpu === tier ? 'var(--gradient-primary)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${selectedGpu === tier ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tier === 'CPU' ? 'Multi-Core CPU' : tier}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Number of Accelerators</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{deviceCount} Devices</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                value={deviceCount}
                onChange={(e) => setDeviceCount(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
            </div>
          </div>

          {/* Earnings Projection Card */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '28px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Projected Net Monthly Earnings (85%)
            </div>
            <div style={{ fontSize: '44px', fontWeight: 900, color: 'var(--accent-emerald)', margin: '12px 0 6px 0' }}>
              ${providerTake.toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Based on ${currentRate.hourly.toFixed(2)}/hr rate at ~{(currentRate.util * 100).toFixed(0)}% projected utilization
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-around', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Daily Gross: </span>
                <strong style={{ color: '#ffffff' }}>${(monthlyGross / 30).toFixed(2)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Platform Fee: </span>
                <strong style={{ color: 'var(--accent-cyan)' }}>15%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Quickstart Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', marginBottom: '36px' }}>
          Connect Your Fleet in 3 Simple Steps
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(260px, 28vw, 320px), 1fr))', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.2)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '16px',
            }}>
              1
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Generate Pairing Token</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Sign in to your provider account and generate a cryptographically secured one-time pairing token.
            </p>
            <Link href="/provider/dashboard" style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Get Pairing Token <ArrowRight size={13} />
            </Link>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '16px',
            }}>
              2
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Run Agent Container</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Launch the rootless Python daemon via Podman or Docker. It connects outbound via WSS without requiring open ports.
            </p>
            <Link href="/developers" style={{ fontSize: '13px', color: 'var(--accent-emerald)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Read Architecture Docs <ArrowRight size={13} />
            </Link>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.2)',
              color: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              marginBottom: '16px',
            }}>
              3
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Benchmark & Earn</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              The agent runs synthetic hardware attestation and begins accepting verified sandboxed AI workloads automatically.
            </p>
            <Link href="/provider/payouts" style={{ fontSize: '13px', color: 'var(--accent-purple)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Configure Payouts <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Launch Terminal */}
      <section className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--accent-cyan)" />
            <span style={{ fontSize: '14px', fontWeight: 700 }}>Quick Start Podman Command</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            {copied ? <><Check size={14} color="#34d399" /> Copied!</> : <><Copy size={14} /> Copy Command</>}
          </button>
        </div>

        <div style={{
          background: '#040711',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '18px',
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#38bdf8',
          lineHeight: '1.6',
          overflowX: 'auto',
        }}>
          {runCommand.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
