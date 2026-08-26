'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, ArrowRight, DollarSign, CheckCircle2 } from 'lucide-react';

export const ProviderCTA: React.FC = () => {
  return (
    <section id="provider" className="glass-panel" style={{
      margin: '80px 0',
      padding: '48px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 30vw, 360px), 1fr))',
        gap: '48px',
        alignItems: 'center',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent-purple)',
            fontSize: '13px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
          }}>
            <DollarSign size={15} /> Monetize Idle Hardware
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
            Earn Passive Income with Your <span className="gradient-text">GPU & CPU Fleet</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            Install our lightweight, rootless agent on your gaming rigs, mining rigs, or datacenter servers. The platform automatically benchmarks, registers, and routes verified paying AI workloads to your hardware.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <strong>Zero Inbound Ports</strong>: Secure outbound-only WSS communication.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <strong>Strict Container Sandboxing</strong>: Rootless OCI execution isolates your host OS.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
              <CheckCircle2 size={16} color="var(--accent-emerald)" />
              <strong>Automated Payouts</strong>: Hourly usage calculations credited straight to your wallet.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/provider" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
              Register as Provider <ArrowRight size={16} />
            </Link>
            <Link href="/developers" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }}>
              <Terminal size={16} /> View Agent Docs
            </Link>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div style={{
          background: '#040711',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          fontFamily: 'Consolas, Monaco, Courier New, monospace',
          fontSize: '13px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflowX: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '8px' }}>provider-agent-quickstart.sh</span>
          </div>

          <div style={{ color: 'var(--text-muted)' }}># 1. Pull & Run Agent via Podman</div>
          <div style={{ color: '#38bdf8', margin: '8px 0 16px 0', wordBreak: 'break-all' }}>
            podman run -d \<br />
            &nbsp;&nbsp;--name compute-agent \<br />
            &nbsp;&nbsp;--device nvidia.com/gpu=all \<br />
            &nbsp;&nbsp;-e PAIRING_TOKEN=ptk_sec_9941a8 \<br />
            &nbsp;&nbsp;ghcr.io/distributed-compute/agent:latest
          </div>

          <div style={{ color: 'var(--text-muted)' }}># 2. Output Log Verification</div>
          <div style={{ color: '#34d399' }}>
            [INFO] Detected 2x NVIDIA H100 80GB HBM3<br />
            [INFO] Synthetic FLOPS Benchmark: 985/1000<br />
            [INFO] Node registered successfully: node-01<br />
            [INFO] Listening for container workloads...
          </div>
        </div>
      </div>
    </section>
  );
};
