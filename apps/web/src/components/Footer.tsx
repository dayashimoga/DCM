'use client';

import React from 'react';
import { Cpu, ShieldCheck, Github, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-color)',
      background: 'rgba(5, 8, 15, 0.9)',
      padding: '48px 0 24px 0',
      marginTop: '80px',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
          marginBottom: '40px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Cpu size={18} color="#ffffff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>DISTRIBUTED COMPUTE</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
              Production-grade distributed GPU/CPU marketplace. Connecting independent hardware providers with researchers, developers, and AI builders worldwide.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Platform</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><a href="#marketplace">Marketplace Search</a></li>
              <li><a href="#benchmarks">Hardware Benchmarking</a></li>
              <li><a href="#scheduler">Intelligent Scheduler</a></li>
              <li><a href="#billing">Deterministic Billing</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Providers</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><a href="#agent">Download Agent</a></li>
              <li><a href="#payouts">Payout Economics</a></li>
              <li><a href="#isolation">Security & Isolation</a></li>
              <li><a href="#docs">Provider Guide</a></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Security & Open Source</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <li><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} color="#10b981" /> Sandboxed OCI Execution</span></li>
              <li><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Globe size={14} color="#38bdf8" /> Cloudflare Edge Ready</span></li>
              <li><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Github size={14} /> Open Source (Apache 2.0)</span></li>
            </ul>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}>
          <div>© 2026 Distributed Compute Marketplace. All rights reserved.</div>
          <div>Edge-optimized on Cloudflare Pages.</div>
        </div>
      </div>
    </footer>
  );
};
