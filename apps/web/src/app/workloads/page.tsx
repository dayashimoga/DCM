'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Play, CheckCircle2, AlertCircle, Clock, DollarSign, RefreshCw, XCircle, ChevronRight, Server } from 'lucide-react';
import { Job, JobStatus } from '@distributed-compute/shared-types';

export default function WorkloadsDashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const defaultJobs: Job[] = [
    {
      id: 'job-pytorch-train-771',
      customerId: 'cust-demo',
      nodeId: 'node-h100-cluster-01',
      status: JobStatus.RUNNING,
      image: 'pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime',
      command: 'python train_llm.py --batch_size 64 --fp16',
      startedAt: new Date(Date.now() - 145000).toISOString(),
      completedAt: null,
      totalGpuSeconds: 145 * 8,
      totalCostUsd: 0.82,
      createdAt: new Date(Date.now() - 150000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'job-whisper-transcribe-882',
      customerId: 'cust-demo',
      nodeId: 'node-rtx4090-dual-04',
      status: JobStatus.COMPLETED,
      image: 'openai/whisper:latest',
      command: 'whisper audio.wav --model large-v3',
      startedAt: new Date(Date.now() - 620000).toISOString(),
      completedAt: new Date(Date.now() - 120000).toISOString(),
      totalGpuSeconds: 500 * 2,
      totalCostUsd: 0.18,
      createdAt: new Date(Date.now() - 630000).toISOString(),
      updatedAt: new Date(Date.now() - 120000).toISOString(),
    },
    {
      id: 'job-sdxl-inference-993',
      customerId: 'cust-demo',
      nodeId: 'node-l40s-single-05',
      status: JobStatus.COMPLETED,
      image: 'stabilityai/sdxl:latest',
      command: 'python generate.py --prompt "Cyberpunk city" --steps 30',
      startedAt: new Date(Date.now() - 1200000).toISOString(),
      completedAt: new Date(Date.now() - 1050000).toISOString(),
      totalGpuSeconds: 150,
      totalCostUsd: 0.05,
      createdAt: new Date(Date.now() - 1210000).toISOString(),
      updatedAt: new Date(Date.now() - 1050000).toISOString(),
    },
  ];

  const fetchJobs = async () => {
    setRefreshing(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    try {
      const res = await fetch(`${apiUrl}/workloads/jobs`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setJobs(data);
          if (!selectedJob) setSelectedJob(data[0]);
          setRefreshing(false);
          setLoading(false);
          return;
        }
      }
    } catch {}

    setJobs(defaultJobs);
    if (!selectedJob) setSelectedJob(defaultJobs[0]);
    setRefreshing(false);
    setLoading(false);
  };

  const fetchLogs = async (jobId: string) => {
    try {
      const res = await fetch(`${apiUrl}/workloads/jobs/${jobId}/logs`);
      if (res.ok) {
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
          return;
        }
      }
    } catch {}

    setLogs([
      `[${new Date(Date.now() - 145000).toISOString()}] [SANDBOX] Initializing isolated OCI runtime container...`,
      `[${new Date(Date.now() - 140000).toISOString()}] [SANDBOX] Image pulled: pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime`,
      `[${new Date(Date.now() - 135000).toISOString()}] [SANDBOX] Device passthrough: 8x NVIDIA H100 80GB mapped`,
      `[${new Date(Date.now() - 130000).toISOString()}] [STDOUT] PyTorch 2.2.0+cu121 initialized. Found 8 devices.`,
      `[${new Date(Date.now() - 100000).toISOString()}] [STDOUT] Epoch 1/10 | Step 100/5000 | Loss: 1.842 | Throughput: 4200 samples/sec`,
      `[${new Date(Date.now() - 50000).toISOString()}] [STDOUT] Epoch 1/10 | Step 200/5000 | Loss: 1.219 | GPU VRAM: 72.4 GB / 80 GB`,
      `[${new Date(Date.now() - 10000).toISOString()}] [STDOUT] Checkpoint saved: ./checkpoints/model_step_200.pt`,
      `[${new Date().toISOString()}] [STDOUT] Training active... stream connected.`,
    ]);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchLogs(selectedJob.id);
      const interval = setInterval(() => fetchLogs(selectedJob.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedJob]);

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.RUNNING:
        return <span className="badge badge-online">● RUNNING</span>;
      case JobStatus.COMPLETED:
        return <span className="badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(52, 211, 153, 0.3)' }}>✓ COMPLETED</span>;
      case JobStatus.FAILED:
        return <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}>✕ FAILED</span>;
      case JobStatus.CANCELLED:
        return <span className="badge" style={{ background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }}>CANCELLED</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>⏳ SCHEDULED</span>;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <Terminal size={14} /> Workload Control Plane
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Customer Compute Workloads
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchJobs} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
          <a href="/workloads/submit" className="btn btn-primary" style={{ fontSize: '13px' }}>
            <Play size={14} /> Launch Workload
          </a>
        </div>
      </div>

      {/* Main Grid: Jobs List + Live Terminal Inspector */}
      <div className="workloads-layout-grid">
        {/* Left Side: Jobs History List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Submitted Workloads ({jobs.length})
          </div>

          {jobs.map((job) => {
            const isSelected = selectedJob?.id === job.id;
            return (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="glass-panel"
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.65)',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)', fontWeight: 700 }}>
                    {job.id.substring(0, 22)}...
                  </span>
                  {getStatusBadge(job.status)}
                </div>

                <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {job.image}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Node: {job.nodeId.substring(0, 14)}...</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${job.totalCostUsd.toFixed(2)} USD</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Selected Job Live Inspector & Terminal Logs */}
        {selectedJob ? (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Job Overview Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>{selectedJob.id}</h2>
                  {getStatusBadge(selectedJob.status)}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  Image: <span style={{ color: 'var(--accent-cyan)' }}>{selectedJob.image}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>
                  ${selectedJob.totalCostUsd.toFixed(4)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accrued Compute Cost</div>
              </div>
            </div>

            {/* Metrics Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>HOST NODE</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>{selectedJob.nodeId}</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GPU SECONDS</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>{selectedJob.totalGpuSeconds}s</div>
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SUBMITTED</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                  {new Date(selectedJob.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Command */}
            {selectedJob.command && (
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8' }}>
                $ {selectedJob.command}
              </div>
            )}

            {/* Live Terminal Log Streamer */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  <Terminal size={14} /> Real-time Container stdout / stderr
                </div>
                <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }}></span> Stream Live
                </span>
              </div>

              <div style={{
                background: '#030712',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                height: '340px',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.6',
                color: '#e2e8f0',
              }}>
                {logs.map((line, idx) => (
                  <div key={idx} style={{ color: line.includes('[SANDBOX]') ? '#38bdf8' : line.includes('Loss') ? '#34d399' : '#e2e8f0' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
