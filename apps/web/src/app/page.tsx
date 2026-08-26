import React from 'react';
import { LiveStats } from '../components/LiveStats';
import { MarketplacePreview } from '../components/MarketplacePreview';
import { ProviderCTA } from '../components/ProviderCTA';
import { Sparkles, Terminal, ArrowRight, Shield, Cpu, Activity, Lock, RefreshCw } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '60px 0 20px 0' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          color: 'var(--accent-cyan)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '24px',
        }}>
          <Sparkles size={14} /> Open-Source Distributed Compute Network
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5.5vw, 56px)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          maxWidth: '900px',
          margin: '0 auto 20px auto',
        }}>
          Rent Distributed GPUs for <span className="gradient-text">80% Less</span> with Zero Lock-in
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 18px)',
          color: 'var(--text-secondary)',
          maxWidth: '680px',
          margin: '0 auto 36px auto',
          lineHeight: 1.6,
        }}>
          Aggregate idle NVIDIA & AMD compute from independent providers worldwide.
          Launch PyTorch, vLLM, and OCI containers with deterministic billing and sandboxed isolation.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#marketplace" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '15px' }}>
            Explore Available GPUs <ArrowRight size={16} />
          </a>
          <a href="#provider" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '15px' }}>
            <Cpu size={16} /> Monetize Your Hardware
          </a>
        </div>
      </section>

      {/* Live Marketplace Statistics */}
      <LiveStats />

      {/* Core Architectural Pillars */}
      <section style={{ margin: '60px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Activity size={22} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Intelligent Scheduler</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Multi-objective optimization algorithm matches workloads against real-time latency, pricing, and hardware capabilities.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Lock size={22} color="var(--accent-emerald)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Sandboxed Isolation</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Rootless container execution with cgroups memory limits, dedicated device passthrough, and zero host network exposure.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <RefreshCw size={22} color="var(--accent-purple)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Verified Benchmarks</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Hardware is verified via standardized FLOPS and memory bandwidth synthetic benchmarks before listing on the marketplace.
            </p>
          </div>
        </div>
      </section>

      {/* Real-time Compute Marketplace Preview */}
      <MarketplacePreview />

      {/* Provider Onboarding CTA */}
      <ProviderCTA />
    </div>
  );
}
