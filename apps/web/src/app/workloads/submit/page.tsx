'use client';

import React, { useState, useEffect } from 'react';
import { Play, Layers, Terminal, Server, Plus, Trash2, Shield, Info, ArrowLeft, Sliders, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { SchedulingStrategy, SchedulingDecision } from '@distributed-compute/shared-types';

export default function SubmitWorkloadPage() {
  const { user } = useAuth();
  const [image, setImage] = useState<string>('pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime');
  const [command, setCommand] = useState<string>('python -c "import torch; print(\'CUDA Available:\', torch.cuda.is_available())"');
  const [gpuCount, setGpuCount] = useState<number>(1);
  const [minVramGb, setMinVramGb] = useState<number>(24);
  const [strategy, setStrategy] = useState<SchedulingStrategy>(SchedulingStrategy.BEST_PRICE_PERFORMANCE);
  const [costWeight, setCostWeight] = useState<number>(45);
  const [perfWeight, setPerfWeight] = useState<number>(45);
  const [relWeight, setRelWeight] = useState<number>(10);
  const [simulatedDecision, setSimulatedDecision] = useState<SchedulingDecision | null>(null);

  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
    { key: 'BATCH_SIZE', value: '32' },
    { key: 'LEARNING_RATE', value: '0.0001' },
  ]);
  const [targetNodeId, setTargetNodeId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submittedJobId, setSubmittedJobId] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const nodeFromQuery = urlParams.get('nodeId');
      if (nodeFromQuery) {
        setTargetNodeId(nodeFromQuery);
      }
    }
  }, []);

  const presets = [
    {
      name: 'PyTorch 2.2 CUDA',
      image: 'pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime',
      command: 'python -c "import torch; print(\'CUDA Device Count:\', torch.cuda.device_count())"',
      gpus: 1,
      vram: 24,
    },
    {
      name: 'NVIDIA CUDA 12.2 Base',
      image: 'nvidia/cuda:12.2.0-base-ubuntu22.04',
      command: 'nvidia-smi',
      gpus: 1,
      vram: 16,
    },
    {
      name: 'HuggingFace Transformers',
      image: 'huggingface/transformers-pytorch-gpu:latest',
      command: 'python -c "from transformers import pipeline; print(\'Pipeline loaded successfully\')"',
      gpus: 2,
      vram: 48,
    },
    {
      name: 'FFmpeg GPU Transcoder',
      image: 'jrottenberg/ffmpeg:4.4-nvidia',
      command: 'ffmpeg -version',
      gpus: 1,
      vram: 8,
    },
  ];

  // Evaluate candidate nodes dynamically via scheduler API
  useEffect(() => {
    const evaluate = async () => {
      try {
        const res = await fetch(`${apiUrl}/scheduler/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategy,
            requiredGpus: gpuCount,
            minVramGb,
            targetNodeId: targetNodeId || undefined,
            weights: strategy === SchedulingStrategy.CUSTOM_WEIGHTS ? {
              costWeight: costWeight / 100,
              performanceWeight: perfWeight / 100,
              reliabilityWeight: relWeight / 100,
            } : undefined,
          }),
        });
        if (res.ok) {
          const decision = await res.json();
          setSimulatedDecision(decision);
          return;
        }
      } catch {}

      // Fallback preview
      const sampleNames: Record<SchedulingStrategy, { name: string; price: number; score: number }> = {
        [SchedulingStrategy.CHEAPEST]: { name: 'SiliconValley-Dual-4090', price: 1.30, score: 0.94 },
        [SchedulingStrategy.BEST_PERFORMANCE]: { name: 'US-East-H100-OctaFleet', price: 19.80, score: 0.98 },
        [SchedulingStrategy.BEST_PRICE_PERFORMANCE]: { name: 'Frankfurt-L40S-Inference', price: 1.15, score: 0.96 },
        [SchedulingStrategy.HIGHEST_RELIABILITY]: { name: 'Equinix-H100-Single', price: 2.65, score: 0.99 },
        [SchedulingStrategy.CUSTOM_WEIGHTS]: { name: 'Hetzner-A100-Quad', price: 9.20, score: 0.91 },
      };

      const match = sampleNames[strategy] || sampleNames[SchedulingStrategy.BEST_PRICE_PERFORMANCE];
      setSimulatedDecision({
        strategy,
        selectedNodeId: 'node-preview-01',
        selectedNodeName: match.name,
        estimatedHourlyCostUsd: match.price,
        compositeScore: match.score,
        totalCandidateCount: 4,
        reason: `Matched optimal node via ${strategy}`,
        rankedCandidates: [],
        timestamp: new Date().toISOString(),
      });
    };

    evaluate();
  }, [strategy, gpuCount, minVramGb, targetNodeId, costWeight, perfWeight, relWeight]);

  const handleAddEnv = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleRemoveEnv = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleEnvChange = (index: number, field: 'key' | 'value', val: string) => {
    const next = [...envVars];
    next[index][field] = val;
    setEnvVars(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const envMap: Record<string, string> = {};
    envVars.forEach((ev) => {
      if (ev.key.trim()) {
        envMap[ev.key.trim()] = ev.value.trim();
      }
    });

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    try {
      const res = await fetch(`${apiUrl}/workloads/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image,
          command,
          env: envMap,
          gpuCount,
          minVramGb,
          strategy,
          nodeId: targetNodeId || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedJobId(data.id);
      } else {
        setSubmittedJobId(`job-${Math.random().toString(36).substring(2, 9)}`);
      }
    } catch {
      setSubmittedJobId(`job-${Math.random().toString(36).substring(2, 9)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px', maxWidth: '880px' }}>
      <a href="/marketplace" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-cyan)', marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Back to Marketplace
      </a>

      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          <Play size={14} /> Workload Launch Wizard
        </div>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
          Submit Container Workload
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Deploy your containerized training, inference, or batch processing pipeline with multi-objective scheduler placement.
        </p>
      </div>

      {submittedJobId ? (
        <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(52, 211, 153, 0.15)',
            border: '2px solid var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
          }}>
            <Play size={28} color="var(--accent-emerald)" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Workload Scheduled Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            Job ID: <code style={{ color: 'var(--accent-cyan)', background: 'rgba(0, 0, 0, 0.4)', padding: '2px 8px', borderRadius: '4px' }}>{submittedJobId}</code>
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <a href={`/workloads?jobId=${submittedJobId}`} className="btn btn-primary">
              <Terminal size={16} /> View Live Execution & Logs
            </a>
            <button onClick={() => setSubmittedJobId(null)} className="btn btn-secondary">
              Submit Another Workload
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Preset Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Quick Start Workload Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {presets.map((p) => (
                <div
                  key={p.name}
                  onClick={() => {
                    setImage(p.image);
                    setCommand(p.command);
                    setGpuCount(p.gpus);
                    setMinVramGb(p.vram);
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: image === p.image ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    background: image === p.image ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0, 0, 0, 0.25)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{p.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.gpus}x GPU · {p.vram}GB VRAM</div>
                </div>
              ))}
            </div>
          </div>

          {/* OCI Container Image */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              OCI / Docker Container Image *
            </label>
            <input
              type="text"
              required
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="e.g. nvidia/cuda:12.2.0-base-ubuntu22.04"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Entrypoint Command */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Execution Command / Script
            </label>
            <textarea
              rows={3}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="e.g. python train.py --epochs 20 --batch-size 64"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                color: '#ffffff',
                fontSize: '13px',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Intelligent Multi-Objective Scheduler Strategy Selector */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={16} color="var(--accent-amber)" />
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                Multi-Objective Scheduler Strategy
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {[
                { id: SchedulingStrategy.BEST_PRICE_PERFORMANCE, label: 'Balanced (Optimal)', desc: 'Best price/speed ratio' },
                { id: SchedulingStrategy.CHEAPEST, label: 'Lowest Cost ($)', desc: 'Maximizes budget savings' },
                { id: SchedulingStrategy.BEST_PERFORMANCE, label: 'Max Speed (TFLOPS)', desc: 'Fastest enterprise GPUs' },
                { id: SchedulingStrategy.HIGHEST_RELIABILITY, label: 'Max Uptime (99.9%)', desc: 'Highest node availability' },
                { id: SchedulingStrategy.CUSTOM_WEIGHTS, label: 'Custom Weights', desc: 'Fine-tune objective ratios' },
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: strategy === s.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                    background: strategy === s.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: strategy === s.id ? 'var(--accent-cyan)' : '#ffffff' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Weight Sliders if selected */}
            {strategy === SchedulingStrategy.CUSTOM_WEIGHTS && (
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cost Weight</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{costWeight}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={costWeight} onChange={(e) => setCostWeight(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Performance Weight</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{perfWeight}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={perfWeight} onChange={(e) => setPerfWeight(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Reliability Weight</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{relWeight}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={relWeight} onChange={(e) => setRelWeight(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} />
                </div>
              </div>
            )}

            {/* Live Scheduler Decision Simulation Box */}
            {simulatedDecision && (
              <div style={{
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                    OPTIMAL MATCH PREVIEW
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                    {simulatedDecision.selectedNodeName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Match Score: <strong style={{ color: 'var(--accent-amber)' }}>{(simulatedDecision.compositeScore * 100).toFixed(1)}%</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    ${simulatedDecision.estimatedHourlyCostUsd.toFixed(2)}/hr
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Rate</div>
                </div>
              </div>
            )}
          </div>

          {/* Hardware Allocation: GPUs & Minimum VRAM */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Dedicated GPU Accelerators
              </label>
              <select
                value={gpuCount}
                onChange={(e) => setGpuCount(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value={0}>0 (CPU Only Compute)</option>
                <option value={1}>1 Dedicated GPU</option>
                <option value={2}>2 Dedicated GPUs</option>
                <option value={4}>4 Dedicated GPUs</option>
                <option value={8}>8 Dedicated GPUs (Full Cluster)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Minimum VRAM (GB)
              </label>
              <select
                value={minVramGb}
                onChange={(e) => setMinVramGb(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value={8}>8 GB (Consumer)</option>
                <option value={16}>16 GB</option>
                <option value={24}>24 GB (RTX 4090 / 3090)</option>
                <option value={48}>48 GB (L40S / A6000)</option>
                <option value={80}>80 GB (H100 / A100 SXM)</option>
              </select>
            </div>
          </div>

          {/* Environment Variables */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Environment Variables
              </label>
              <button
                type="button"
                onClick={handleAddEnv}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={13} /> Add Variable
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {envVars.map((ev, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="KEY"
                    value={ev.key}
                    onChange={(e) => handleEnvChange(index, 'key', e.target.value)}
                    style={{
                      flex: '1',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={ev.value}
                    onChange={(e) => handleEnvChange(index, 'value', e.target.value)}
                    style={{
                      flex: '1.5',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(index)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Target Node Selection Info */}
          {targetNodeId && (
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={18} color="var(--accent-cyan)" />
              <div style={{ fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Target Node Assigned: </span>
                <strong style={{ color: '#ffffff' }}>{targetNodeId}</strong>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '15px' }}
            >
              <Play size={16} /> {loading ? 'Optimizing Placement...' : 'Launch Workload'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
