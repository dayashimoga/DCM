'use client';

import React from 'react';
import { Cpu, Server, Activity, DollarSign } from 'lucide-react';

export const LiveStats: React.FC = () => {
  const stats = [
    { label: 'Active Compute Nodes', value: '1,428', icon: Server, change: '+18% this week', color: 'var(--accent-cyan)' },
    { label: 'Aggregated GPUs', value: '4,892', icon: Cpu, change: 'NVIDIA H100, A100, 4090', color: 'var(--accent-purple)' },
    { label: 'Network TFLOPS', value: '840.5K', icon: Activity, change: 'Verified Benchmarks', color: 'var(--accent-emerald)' },
    { label: 'Avg Customer Savings', value: '72%', icon: DollarSign, change: 'vs Hyperscalers', color: 'var(--accent-amber)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '20px',
      margin: '40px 0',
    }}>
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{stat.label}</span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={18} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {stat.change}
            </div>
          </div>
        );
      })}
    </div>
  );
};
