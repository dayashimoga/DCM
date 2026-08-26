'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, Zap, ShieldCheck, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DisplayNode {
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
  isLive: boolean;
}

const fallbackNodes: DisplayNode[] = [
  {
    id: 'node-preview-01',
    name: 'US-East-H100-OctaFleet',
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
    isLive: false,
  },
  {
    id: 'node-preview-02',
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
    isLive: false,
  },
  {
    id: 'node-preview-03',
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
    isLive: false,
  },
  {
    id: 'node-preview-04',
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
    isLive: false,
  },
];

export const MarketplacePreview: React.FC = () => {
  const [nodes, setNodes] = useState<DisplayNode[]>(fallbackNodes);
  const [filterGpu, setFilterGpu] = useState('ALL');
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    let isMounted = true;
    const loadMarketplace = async () => {
      try {
        const res = await fetch(`${apiUrl}/marketplace/nodes`);
        if (res.ok) {
          const data = await res.json();
          if (data.nodes && data.nodes.length > 0 && isMounted) {
            const mapped: DisplayNode[] = data.nodes.map((n: any) => ({
              id: n.id,
              name: n.name || 'Verified Compute Node',
              gpuModel: n.gpus?.[0]?.model || 'Standard Accelerator',
              gpuCount: n.gpus?.[0]?.count || 1,
              vramGb: (n.gpus?.[0]?.vramGb || 24) * (n.gpus?.[0]?.count || 1),
              cpuModel: n.cpu?.model || 'High Performance CPU',
              cpuCores: n.cpu?.cores || 16,
              ramGb: n.ramGb || 64,
              diskGb: n.diskGb || 500,
              hourlyRateUsd: n.hourlyRateUsd || 1.50,
              benchmarkScore: n.benchmarkScore || 750,
              reliabilityScore: n.reliabilityScore || 99.0,
              region: 'global-decentralized',
              status: n.status === 'ONLINE' ? 'ONLINE' : 'BUSY',
              isLive: true,
            }));
            setNodes(mapped);
            setIsLiveFeed(true);
            return;
          }
        }
      } catch {
        // Fallback gracefully to simulated tier inventory
      }
      if (isMounted) {
        setIsLiveFeed(false);
      }
    };

    loadMarketplace();
    return () => { isMounted = false; };
  }, [apiUrl]);

  const filteredNodes = filterGpu === 'ALL'
    ? nodes
    : nodes.filter(n => n.gpuModel.toLowerCase().includes(filterGpu.toLowerCase()));

  return (
    <section id="marketplace" style={{ margin: '60px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            <Zap size={14} /> Real-Time Compute Market
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Available Distributed Compute Nodes
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span className={`badge ${isLiveFeed ? 'badge-online' : 'badge-busy'}`} style={{ fontSize: '11px' }}>
              {isLiveFeed ? (
                <><CheckCircle2 size={12} /> AUTHORITATIVE LIVE DATABASE FEED</>
              ) : (
                <><ShieldAlert size={12} /> SIMULATED INVENTORY (Real Hardware Verification Pending)</>
              )}
            </span>
          </div>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 28vw, 360px), 1fr))', gap: '24px' }}>
        {filteredNodes.map((node) => (
          <div key={node.id} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className={`badge ${node.status === 'ONLINE' ? 'badge-online' : 'badge-busy'}`}>● {node.status}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {node.isLive ? 'LIVE NODE' : 'SIMULATED TIER'} • {node.region}
                </span>
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
              <Link href={`/workloads/submit?nodeId=${node.id}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                Rent Now <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
