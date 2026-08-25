'use client';

import React, { useState } from 'react';
import { Cpu, HardDrive, Zap, Star, ShieldCheck, Filter, ArrowRight } from 'lucide-react';

interface MockNode {
  id: string;
  name: string;
  gpuModel: string;
  gpuCount: number;
  vramGb: number;
  cpuModel: string;
  cpuCores: number;
  ramGb: number;
  diskGb: number;
  hourlyRateUsd: number;
  benchmarkScore: number;
  reliabilityScore: number;
  region: string;
  status: 'ONLINE' | 'BUSY';
}

const mockNodes: MockNode[] = [
  {
    id: 'node-01',
    name: 'US-East-H100-Ultra',
    gpuModel: 'NVIDIA H100 80GB HBM3',
    gpuCount: 8,
    vramGb: 640,
    cpuModel: 'AMD EPYC 9654 96-Core',
    cpuCores: 96,
    ramGb: 512,
    diskGb: 4000,
    hourlyRateUsd: 14.50,
    benchmarkScore: 985,
    reliabilityScore: 99.9,
    region: 'us-east (Virginia)',
    status: 'ONLINE',
  },
  {
    id: 'node-02',
    name: 'EU-Central-A100-Dual',
    gpuModel: 'NVIDIA A100 80GB SXM4',
    gpuCount: 2,
    vramGb: 160,
    cpuModel: 'Intel Xeon Platinum 8358',
    cpuCores: 64,
    ramGb: 256,
    diskGb: 2000,
    hourlyRateUsd: 3.20,
    benchmarkScore: 890,
    reliabilityScore: 99.7,
    region: 'eu-central (Frankfurt)',
    status: 'ONLINE',
  },
  {
    id: 'node-03',
    name: 'AP-Tokyo-RTX4090-Pro',
    gpuModel: 'NVIDIA GeForce RTX 4090',
    gpuCount: 4,
    vramGb: 96,
    cpuModel: 'AMD Ryzen 9 7950X',
    cpuCores: 32,
    ramGb: 128,
    diskGb: 1500,
    hourlyRateUsd: 1.75,
    benchmarkScore: 780,
    reliabilityScore: 98.9,
    region: 'ap-northeast (Tokyo)',
    status: 'ONLINE',
  },
  {
    id: 'node-04',
    name: 'US-West-L40S-HighMem',
    gpuModel: 'NVIDIA L40S 48GB',
    gpuCount: 1,
    vramGb: 48,
    cpuModel: 'AMD EPYC 7763 64-Core',
    cpuCores: 32,
    ramGb: 128,
    diskGb: 1000,
    hourlyRateUsd: 0.95,
    benchmarkScore: 740,
    reliabilityScore: 99.4,
    region: 'us-west (Oregon)',
    status: 'ONLINE',
  },
];

export const MarketplacePreview: React.FC = () => {
  const [filterGpu, setFilterGpu] = useState('ALL');

  const filteredNodes = filterGpu === 'ALL'
    ? mockNodes
    : mockNodes.filter(n => n.gpuModel.toLowerCase().includes(filterGpu.toLowerCase()));

  return (
    <section id="marketplace" style={{ margin: '60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            <Zap size={14} /> Real-Time Compute Market
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Available Distributed Compute Nodes
          </h2>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'H100', 'A100', '4090', 'L40S'].map((gpu) => (
            <button
              key={gpu}
              onClick={() => setFilterGpu(gpu)}
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                background: filterGpu === gpu ? 'rgba(56, 189, 248, 0.2)' : undefined,
                borderColor: filterGpu === gpu ? 'var(--accent-cyan)' : undefined,
                color: filterGpu === gpu ? '#ffffff' : undefined,
              }}
            >
              {gpu === 'ALL' ? 'All Accelerators' : gpu}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Nodes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {filteredNodes.map((node) => (
          <div key={node.id} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className="badge badge-online">● {node.status}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{node.region}</span>
              </div>

              {/* Title & GPU */}
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                {node.gpuCount}x {node.gpuModel}
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                {node.vramGb} GB total VRAM • {node.name}
              </div>

              {/* Hardware Specs Grid */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px',
                fontSize: '13px',
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>CPU Cores</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.cpuCores} Cores</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>System RAM</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.ramGb} GB DDR5</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>NVMe Storage</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{node.diskGb} GB</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Benchmark Score</div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{node.benchmarkScore} / 1000</div>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)',
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${node.hourlyRateUsd.toFixed(2)}<span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 400 }}>/hr</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} /> {node.reliabilityScore}% reliability
                </div>
              </div>
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Rent Now <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
