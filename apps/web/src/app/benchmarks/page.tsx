'use client';

import React, { useState } from 'react';
import { Cpu, Zap, ShieldCheck, Award, Filter, Gauge, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { ComputeTier, HardwareVerificationStatus } from '@distributed-compute/shared-types';

export default function BenchmarksPage() {
  const [selectedTier, setSelectedTier] = useState<string>('ALL');

  const tiers = [
    {
      id: ComputeTier.TIER_1_ENTERPRISE_GPU,
      name: 'Tier 1 — Enterprise AI Accelerators',
      badge: 'Flagship AI',
      color: 'var(--accent-purple)',
      minScore: 850,
      description: 'Built for large-scale LLM pre-training, fine-tuning, and high-throughput production inference.',
      models: ['NVIDIA H100 80GB HBM3', 'NVIDIA A100 80GB SXM4', 'NVIDIA H200', 'AMD Instinct MI300X'],
      priceRange: '$2.50 - $4.80 / hr',
    },
    {
      id: ComputeTier.TIER_2_PRO_GPU,
      name: 'Tier 2 — Professional Workstations',
      badge: 'Pro Compute',
      color: 'var(--accent-cyan)',
      minScore: 650,
      description: 'High-VRAM workstation GPUs optimized for diffusion models, multi-modal workloads, and LoRA tuning.',
      models: ['NVIDIA RTX 4090 24GB', 'NVIDIA RTX A6000 48GB', 'NVIDIA L40S 48GB'],
      priceRange: '$0.60 - $1.80 / hr',
    },
    {
      id: ComputeTier.TIER_3_CONSUMER_GPU,
      name: 'Tier 3 — Mainstream Consumer GPUs',
      badge: 'Efficient GPU',
      color: 'var(--accent-emerald)',
      minScore: 400,
      description: 'Cost-effective GPU nodes ideal for small model inference, batch embeddings, and graphics rendering.',
      models: ['NVIDIA RTX 3090 24GB', 'NVIDIA RTX 4080 16GB', 'NVIDIA Tesla T4 16GB'],
      priceRange: '$0.25 - $0.55 / hr',
    },
    {
      id: ComputeTier.TIER_4_CPU_ONLY,
      name: 'Tier 4 — High-Core CPU Compute',
      badge: 'CPU Fleet',
      color: 'var(--accent-amber)',
      minScore: 50,
      description: 'Multi-core CPU compute workers suitable for data preprocessing, web scraping, and CI/CD pipelines.',
      models: ['AMD EPYC 9654 96-Core', 'Intel Xeon Platinum 8480+'],
      priceRange: '$0.08 - $0.25 / hr',
    },
  ];

  const sampleNodes = [
    {
      id: 'node-us-east-h100-01',
      name: 'Equinix-H100-Cluster-A',
      tier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      gpus: '8x NVIDIA H100 80GB HBM3',
      cpu: '2x AMD EPYC 9654 (192 Cores)',
      tflops: 536.0,
      memBandwidth: 26.8,
      diskIops: 125000,
      score: 994,
      verification: HardwareVerificationStatus.VERIFIED,
      rate: 19.80,
    },
    {
      id: 'node-eu-west-a100-02',
      name: 'Hetzner-A100-Dedicated',
      tier: ComputeTier.TIER_1_ENTERPRISE_GPU,
      gpus: '4x NVIDIA A100 80GB SXM4',
      cpu: 'AMD EPYC 7763 (64 Cores)',
      tflops: 78.0,
      memBandwidth: 19.4,
      diskIops: 85000,
      score: 940,
      verification: HardwareVerificationStatus.VERIFIED,
      rate: 9.60,
    },
    {
      id: 'node-us-west-4090-01',
      name: 'SiliconValley-RTX4090-Rig',
      tier: ComputeTier.TIER_2_PRO_GPU,
      gpus: '2x NVIDIA GeForce RTX 4090 24GB',
      cpu: 'AMD Ryzen 9 7950X (16 Cores)',
      tflops: 66.0,
      memBandwidth: 21.2,
      diskIops: 42000,
      score: 820,
      verification: HardwareVerificationStatus.VERIFIED,
      rate: 1.30,
    },
    {
      id: 'node-ap-south-3090-01',
      name: 'Mumbai-Inference-Node',
      tier: ComputeTier.TIER_3_CONSUMER_GPU,
      gpus: '1x NVIDIA GeForce RTX 3090 24GB',
      cpu: 'Intel Core i9-13900K (24 Cores)',
      tflops: 14.2,
      memBandwidth: 15.6,
      diskIops: 24000,
      score: 580,
      verification: HardwareVerificationStatus.VERIFIED,
      rate: 0.38,
    },
    {
      id: 'node-us-central-cpu-01',
      name: 'Chicago-EPYC-DataWorker',
      tier: ComputeTier.TIER_4_CPU_ONLY,
      gpus: 'CPU Only',
      cpu: 'AMD EPYC 9354 (32 Cores)',
      tflops: 0.0,
      memBandwidth: 14.8,
      diskIops: 32000,
      score: 185,
      verification: HardwareVerificationStatus.VERIFIED,
      rate: 0.18,
    },
  ];

  const filteredNodes = selectedTier === 'ALL'
    ? sampleNodes
    : sampleNodes.filter(n => n.tier === selectedTier);

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 48px auto' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: 'var(--accent-cyan)',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '16px',
        }}>
          <ShieldCheck size={15} /> Standardized Synthetic Benchmarking Suite v1.0
        </div>
        <h1 style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Hardware Discovery & Benchmarking Leaderboard
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Every compute node on the platform is subjected to cryptographic proof-of-work challenges, matrix FLOPS benchmarking, memory bandwidth tests, and anti-spoofing verification algorithms before being scheduled.
        </p>
      </div>

      {/* Compute Tiers Grid */}
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
        Compute Tier Classifications
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '48px' }}>
        {tiers.map((t) => (
          <div key={t.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: t.color }}>
                  {t.badge}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  Score ≥ {t.minScore}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                {t.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                {t.description}
              </p>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>TARGET ACCELERATORS:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                {t.models.map((m, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: t.color }}>•</span> {m}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Typical Range:</span>
              <span style={{ color: '#ffffff' }}>{t.priceRange}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard Table Section */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Top Verified Network Compute Nodes
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Live verified compute performance ranked by normalized composite score (1–1000)
            </p>
          </div>

          {/* Tier Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', ComputeTier.TIER_1_ENTERPRISE_GPU, ComputeTier.TIER_2_PRO_GPU, ComputeTier.TIER_3_CONSUMER_GPU, ComputeTier.TIER_4_CPU_ONLY].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid var(--border-color)',
                  background: selectedTier === tier ? 'var(--gradient-primary)' : 'rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  transition: 'all 0.2s ease',
                }}
              >
                {tier === 'ALL' ? 'All Tiers' : tier.replace('TIER_', 'Tier ').replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Rank & Verification</th>
                <th style={{ padding: '12px 16px' }}>Node Name</th>
                <th style={{ padding: '12px 16px' }}>Hardware Specification</th>
                <th style={{ padding: '12px 16px' }}>Measured TFLOPS</th>
                <th style={{ padding: '12px 16px' }}>Memory BW</th>
                <th style={{ padding: '12px 16px' }}>Score (1–1000)</th>
                <th style={{ padding: '12px 16px' }}>Hourly Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node, index) => (
                <tr key={node.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: index === 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                        #{index + 1}
                      </span>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '10px' }}>
                        <CheckCircle2 size={11} style={{ marginRight: '3px' }} /> VERIFIED
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {node.name}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{node.id}</div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{node.gpus}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{node.cpu}</div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {node.tflops > 0 ? `${node.tflops.toFixed(1)} TFLOPS` : 'CPU Only'}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    {node.memBandwidth} GB/s
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(node.score / 1000) * 100}%`, height: '100%', background: 'var(--gradient-primary)' }} />
                      </div>
                      <span style={{ fontWeight: 800, color: '#ffffff' }}>{node.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                    ${node.rate.toFixed(2)}/hr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
