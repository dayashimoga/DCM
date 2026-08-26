'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Server, Plus, Copy, Check, Activity, ShieldCheck, HardDrive, RefreshCw, Terminal, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { ComputeNode, NodeStatus, PairingTokenResponse } from '@distributed-compute/shared-types';

export default function ProviderDashboardPage() {
  const { user, tokens } = useAuth();
  const [nodes, setNodes] = useState<ComputeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [pairingData, setPairingData] = useState<PairingTokenResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchNodes = async () => {
    if (!tokens?.accessToken) {
      // Mock fallback nodes for preview
      setNodes([
        {
          id: 'node-01-demo',
          providerId: 'prov-01',
          name: 'Datacenter-H100-RackA',
          status: NodeStatus.ONLINE,
          cpu: { model: 'AMD EPYC 9654', cores: 96, threads: 192 },
          gpus: [{ model: 'NVIDIA H100 80GB HBM3', vendor: 'NVIDIA', vramGb: 80, count: 2 }],
          ramGb: 256,
          diskGb: 2000,
          hourlyRateUsd: 3.50,
          benchmarkScore: 980,
          reliabilityScore: 99.9,
          lastHeartbeat: new Date().toISOString(),
          latestTelemetry: {
            cpuUsagePercent: 18.5,
            ramUsagePercent: 32.0,
            ramUsedGb: 82.0,
            gpuUtilizationPercent: 45.0,
            gpuTemperatureCelsius: 51.0,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'node-02-demo',
          providerId: 'prov-01',
          name: 'HomeRig-RTX4090',
          status: NodeStatus.ONLINE,
          cpu: { model: 'AMD Ryzen 9 7950X', cores: 16, threads: 32 },
          gpus: [{ model: 'NVIDIA GeForce RTX 4090', vendor: 'NVIDIA', vramGb: 24, count: 1 }],
          ramGb: 64,
          diskGb: 1000,
          hourlyRateUsd: 0.65,
          benchmarkScore: 780,
          reliabilityScore: 98.5,
          lastHeartbeat: new Date().toISOString(),
          latestTelemetry: {
            cpuUsagePercent: 8.2,
            ramUsagePercent: 24.0,
            ramUsedGb: 15.3,
            gpuUtilizationPercent: 0.0,
            gpuTemperatureCelsius: 38.0,
          },
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/providers/nodes`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes();
    const interval = setInterval(fetchNodes, 10000);
    return () => clearInterval(interval);
  }, [tokens]);

  const handleCreatePairingToken = async () => {
    setTokenLoading(true);
    try {
      if (tokens?.accessToken) {
        const res = await fetch(`${apiUrl}/providers/pairing-tokens`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPairingData(data);
          setShowAddModal(true);
          return;
        }
      }

      // Mock pairing token for unauthenticated preview
      const mockToken = `ptk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setPairingData({
        pairingToken: mockToken,
        providerId: 'prov-mock',
        expiresInSeconds: 3600,
        quickstartCommand: `podman run -d --name compute-agent -e PAIRING_TOKEN=${mockToken} localhost/compute-agent:latest`,
      });
      setShowAddModal(true);
    } finally {
      setTokenLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ paddingTop: '32px', minHeight: '85vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <Server size={14} /> Provider Hardware Fleet
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>
            My Compute Nodes
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <a href="/provider/payouts" className="btn btn-secondary" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="var(--accent-emerald)" /> Earnings & Payouts
          </a>
          <button onClick={fetchNodes} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            <RefreshCw size={14} /> Refresh Telemetry
          </button>
          <button
            onClick={handleCreatePairingToken}
            disabled={tokenLoading}
            className="btn btn-primary"
            style={{ fontSize: '13px' }}
          >
            <Plus size={16} /> Add Machine
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Registered Nodes</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {nodes.length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Online & Available</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {nodes.filter(n => n.status === NodeStatus.ONLINE).length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Contributed VRAM</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {nodes.reduce((acc, n) => acc + (n.gpus[0]?.vramGb || 0) * (n.gpus[0]?.count || 1), 0)} GB
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Earning Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '4px' }}>
            ${nodes.reduce((acc, n) => acc + n.hourlyRateUsd, 0).toFixed(2)}<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-muted)' }}>/hr</span>
          </div>
        </div>
      </div>

      {/* Nodes Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>
          Connected Machines
        </h2>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading node telemetry...
          </div>
        ) : nodes.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Server size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No machines registered yet</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Connect your first GPU/CPU worker by installing the Provider Agent.
            </p>
            <button onClick={handleCreatePairingToken} className="btn btn-primary">
              <Plus size={15} /> Add First Machine
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Machine Name</th>
                <th style={{ padding: '12px 16px' }}>Accelerators (GPU)</th>
                <th style={{ padding: '12px 16px' }}>CPU / RAM</th>
                <th style={{ padding: '12px 16px' }}>Live Telemetry</th>
                <th style={{ padding: '12px 16px' }}>Rate ($/hr)</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${node.status === NodeStatus.ONLINE ? 'badge-online' : 'badge-busy'}`}>
                      ● {node.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {node.name}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {node.id.substring(0, 12)}...</div>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    {node.gpus && node.gpus.length > 0 ? (
                      <div>
                        <strong style={{ color: '#ffffff' }}>{node.gpus[0].count}x {node.gpus[0].model}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>{node.gpus[0].vramGb * node.gpus[0].count} GB total VRAM</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>CPU-Only Worker</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                    <div>{node.cpu.cores} Cores ({node.cpu.model.split(' ')[0]})</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{node.ramGb} GB RAM • {node.diskGb} GB NVMe</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {node.latestTelemetry ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                        <div>CPU: <span style={{ color: '#ffffff', fontWeight: 600 }}>{node.latestTelemetry.cpuUsagePercent}%</span> | RAM: <span style={{ color: '#ffffff', fontWeight: 600 }}>{node.latestTelemetry.ramUsagePercent}%</span></div>
                        {node.latestTelemetry.gpuUtilizationPercent > 0 && (
                          <div style={{ color: 'var(--accent-cyan)' }}>
                            GPU: {node.latestTelemetry.gpuUtilizationPercent}% ({node.latestTelemetry.gpuTemperatureCelsius}°C)
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No active stream</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                    ${node.hourlyRateUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Machine Modal */}
      {showAddModal && pairingData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '24px',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '36px', background: '#090d16', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Terminal size={20} color="#ffffff" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Connect New Machine</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              Run the following one-line command on your provider machine. The agent will automatically detect your GPUs, run verified benchmarks, and connect to this dashboard.
            </p>

            {/* Token details */}
            <div style={{
              background: '#040711',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '6px' }}>ONE-LINE PODMAN COMMAND (EXPIRES IN 60 MINS):</div>
              <div style={{ color: '#38bdf8', wordBreak: 'break-all', marginBottom: '12px' }}>
                {pairingData.quickstartCommand}
              </div>
              <button
                onClick={() => copyToClipboard(pairingData.quickstartCommand)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Command'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowAddModal(false)} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
