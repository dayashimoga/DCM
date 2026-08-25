'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Search, Filter, ArrowUpDown, ShieldCheck, Zap, Server, Sliders, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { ComputeNode, ComputeTier, NodeStatus, SortByOption } from '@distributed-compute/shared-types';

export default function MarketplacePage() {
  const [nodes, setNodes] = useState<ComputeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [minVram, setMinVram] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(30);
  const [sortBy, setSortBy] = useState<SortByOption>(SortByOption.PRICE_ASC);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const defaultNodes: ComputeNode[] = [
    {
      id: 'node-h100-cluster-01',
      providerId: 'prov-01',
      name: 'US-East-H100-OctaFleet',
      status: NodeStatus.ONLINE,
      cpu: { model: 'AMD EPYC 9654', cores: 192, threads: 384 },
      gpus: [{ model: 'NVIDIA H100 80GB HBM3', vendor: 'NVIDIA', vramGb: 80, count: 8 }],
      ramGb: 1024,
      diskGb: 8000,
      hourlyRateUsd: 19.80,
      benchmarkScore: 996,
      computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      reliabilityScore: 99.9,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'node-h100-single-02',
      providerId: 'prov-01',
      name: 'Equinix-H100-Single',
      status: NodeStatus.ONLINE,
      cpu: { model: 'AMD EPYC 9354', cores: 32, threads: 64 },
      gpus: [{ model: 'NVIDIA H100 80GB SXM5', vendor: 'NVIDIA', vramGb: 80, count: 1 }],
      ramGb: 256,
      diskGb: 2000,
      hourlyRateUsd: 2.65,
      benchmarkScore: 980,
      computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      reliabilityScore: 99.8,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'node-a100-quad-03',
      providerId: 'prov-02',
      name: 'Hetzner-A100-Quad',
      status: NodeStatus.ONLINE,
      cpu: { model: 'AMD EPYC 7763', cores: 64, threads: 128 },
      gpus: [{ model: 'NVIDIA A100 80GB SXM4', vendor: 'NVIDIA', vramGb: 80, count: 4 }],
      ramGb: 512,
      diskGb: 4000,
      hourlyRateUsd: 9.20,
      benchmarkScore: 945,
      computeTier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      reliabilityScore: 99.7,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'node-rtx4090-dual-04',
      providerId: 'prov-03',
      name: 'SiliconValley-Dual-4090',
      status: NodeStatus.ONLINE,
      cpu: { model: 'AMD Ryzen 9 7950X', cores: 16, threads: 32 },
      gpus: [{ model: 'NVIDIA GeForce RTX 4090', vendor: 'NVIDIA', vramGb: 24, count: 2 }],
      ramGb: 128,
      diskGb: 2000,
      hourlyRateUsd: 1.30,
      benchmarkScore: 830,
      computeTier: ComputeTier.TIER_2_PRO_GPU,
      reliabilityScore: 99.2,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'node-l40s-single-05',
      providerId: 'prov-02',
      name: 'Frankfurt-L40S-Inference',
      status: NodeStatus.ONLINE,
      cpu: { model: 'Intel Xeon Gold 6430', cores: 32, threads: 64 },
      gpus: [{ model: 'NVIDIA L40S 48GB', vendor: 'NVIDIA', vramGb: 48, count: 1 }],
      ramGb: 128,
      diskGb: 2000,
      hourlyRateUsd: 1.15,
      benchmarkScore: 860,
      computeTier: ComputeTier.TIER_2_PRO_GPU,
      reliabilityScore: 99.5,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 'node-rtx3090-single-06',
      providerId: 'prov-04',
      name: 'Tokyo-RTX3090-Worker',
      status: NodeStatus.ONLINE,
      cpu: { model: 'Intel Core i9-13900K', cores: 24, threads: 32 },
      gpus: [{ model: 'NVIDIA GeForce RTX 3090', vendor: 'NVIDIA', vramGb: 24, count: 1 }],
      ramGb: 64,
      diskGb: 1000,
      hourlyRateUsd: 0.38,
      benchmarkScore: 610,
      computeTier: ComputeTier.TIER_3_CONSUMER_GPU,
      reliabilityScore: 98.6,
      lastHeartbeat: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const fetchNodes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchQuery', searchQuery);
      if (selectedTier !== 'ALL') params.append('tier', selectedTier);
      if (minVram > 0) params.append('minVramGb', minVram.toString());
      if (maxPrice < 30) params.append('maxHourlyRateUsd', maxPrice.toString());
      params.append('sortBy', sortBy);

      const res = await fetch(`${apiUrl}/marketplace/nodes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.nodes && data.nodes.length > 0) {
          setNodes(data.nodes);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Use fallback
    }

    // Filter fallback nodes locally for offline static mode
    let result = [...defaultNodes];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.name.toLowerCase().includes(q) ||
        (n.gpus[0]?.model || '').toLowerCase().includes(q) ||
        n.cpu.model.toLowerCase().includes(q)
      );
    }
    if (selectedTier !== 'ALL') {
      result = result.filter(n => n.computeTier === selectedTier);
    }
    if (minVram > 0) {
      result = result.filter(n => (n.gpus[0]?.vramGb || 0) * (n.gpus[0]?.count || 1) >= minVram);
    }
    if (maxPrice < 30) {
      result = result.filter(n => n.hourlyRateUsd <= maxPrice);
    }

    if (sortBy === SortByOption.PRICE_ASC) {
      result.sort((a, b) => a.hourlyRateUsd - b.hourlyRateUsd);
    } else if (sortBy === SortByOption.PRICE_DESC) {
      result.sort((a, b) => b.hourlyRateUsd - a.hourlyRateUsd);
    } else if (sortBy === SortByOption.SCORE_DESC) {
      result.sort((a, b) => b.benchmarkScore - a.benchmarkScore);
    }

    setNodes(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchNodes();
  }, [searchQuery, selectedTier, minVram, maxPrice, sortBy]);

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Search & Stats Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              <Zap size={14} /> Live Compute Marketplace
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Browse & Rent Verified Compute
            </h1>
          </div>

          {/* Quick Summary Pill */}
          <div style={{
            display: 'flex',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 18px',
            fontSize: '13px',
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Online Nodes: </span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{nodes.length}</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <span style={{ color: 'var(--text-muted)' }}>From: </span>
              <strong style={{ color: '#ffffff' }}>${Math.min(...(nodes.map(n => n.hourlyRateUsd).concat([0.38]))).toFixed(2)}/hr</strong>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by GPU model (e.g. H100, RTX 4090, A100), CPU, or node name..."
            style={{
              width: '100%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px 14px 48px',
              color: '#ffffff',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
          />
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Results Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <aside className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px' }}>
              <Filter size={16} /> Filters
            </div>
            {(selectedTier !== 'ALL' || minVram > 0 || maxPrice < 30 || searchQuery) && (
              <button
                onClick={() => { setSelectedTier('ALL'); setMinVram(0); setMaxPrice(30); setSearchQuery(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '12px', cursor: 'pointer' }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Compute Tier Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Compute Tier
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'ALL', label: 'All Tiers' },
                { id: ComputeTier.TIER_1_ENTERPRISE_GPU, label: 'Tier 1: Enterprise AI' },
                { id: ComputeTier.TIER_2_PRO_GPU, label: 'Tier 2: Workstation Pro' },
                { id: ComputeTier.TIER_3_CONSUMER_GPU, label: 'Tier 3: Consumer GPU' },
                { id: ComputeTier.TIER_4_CPU_ONLY, label: 'Tier 4: CPU Compute' },
              ].map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: selectedTier === tier.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: `1px solid ${selectedTier === tier.id ? 'var(--accent-cyan)' : 'transparent'}`,
                    color: selectedTier === tier.id ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tier.label}
                </div>
              ))}
            </div>
          </div>

          {/* Minimum VRAM Quick Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Minimum Total VRAM
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[0, 16, 24, 80].map((vram) => (
                <button
                  key={vram}
                  onClick={() => setMinVram(vram)}
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    background: minVram === vram ? 'var(--gradient-primary)' : 'rgba(0, 0, 0, 0.3)',
                    color: '#ffffff',
                  }}
                >
                  {vram === 0 ? 'Any VRAM' : `${vram}GB+`}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Price Ceiling</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>${maxPrice.toFixed(2)}/hr</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="30"
              step="0.50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>
        </aside>

        {/* Results Container */}
        <div>
          {/* Controls bar (Count & Sort) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: '#ffffff' }}>{nodes.length}</strong> matching compute nodes
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpDown size={14} color="var(--text-muted)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortByOption)}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                <option value={SortByOption.PRICE_ASC}>Lowest Price ($/hr)</option>
                <option value={SortByOption.SCORE_DESC}>Highest Benchmark Score</option>
                <option value={SortByOption.PRICE_DESC}>Highest Price ($/hr)</option>
              </select>
            </div>
          </div>

          {/* Compute Nodes Grid */}
          {nodes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
              <Server size={44} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No compute nodes found</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Try loosening your filters or clearing search keywords.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {nodes.map((node) => (
                <div key={node.id} className="glass-panel node-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header: Name + Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{node.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {node.id.substring(0, 16)}...</div>
                      </div>
                      <span className="badge badge-online">
                        ● ONLINE
                      </span>
                    </div>

                    {/* Accelerator Specification */}
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px',
                      marginBottom: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ACCELERATOR CONFIGURATION</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                        {node.gpus && node.gpus.length > 0 ? (
                          `${node.gpus[0].count}x ${node.gpus[0].model}`
                        ) : (
                          'CPU Compute Node'
                        )}
                      </div>
                      {node.gpus && node.gpus.length > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                          {(node.gpus[0].vramGb * node.gpus[0].count)} GB Aggregate VRAM
                        </div>
                      )}
                    </div>

                    {/* Hardware Metrics Table */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>CPU: </span>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{node.cpu.cores} Cores</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>RAM: </span>
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{node.ramGb} GB</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Verified Score: </span>
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{node.benchmarkScore}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Reliability: </span>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>{node.reliabilityScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Button */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ${node.hourlyRateUsd.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>per GPU-hour</div>
                    </div>

                    <a href={`/workloads/submit?nodeId=${node.id}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Rent Now <ChevronRight size={15} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
