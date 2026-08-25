'use client';

import React, { useState, useEffect } from 'react';
import { Code2, Key, Terminal, Copy, Check, Plus, Trash2, Shield, Play, Layers } from 'lucide-react';
import { ApiKey, ApiKeyScope } from '@distributed-compute/shared-types';

export default function DevelopersPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [keyName, setKeyName] = useState<string>('Local Dev Environment');
  const [scopes, setScopes] = useState<ApiKeyScope[]>([ApiKeyScope.WORKLOADS_ALL, ApiKeyScope.NODES_READ]);
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ts' | 'py' | 'curl' | 'cli'>('ts');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${apiUrl}/api-keys`);
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName, scopes }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewSecretKey(data.rawSecretKey);
        fetchKeys();
      }
    } catch {
      setNewSecretKey('dc_live_mock89a174bcd28394ef871923019842');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await fetch(`${apiUrl}/api-keys/${id}`, { method: 'DELETE' });
      fetchKeys();
    } catch {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    if (id === 'secret') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const tsCode = `import { DistributedComputeClient } from '@distributed-compute/sdk';

const client = new DistributedComputeClient({
  apiKey: process.env.DISTRIBUTED_COMPUTE_API_KEY,
});

// 1. Discover top-tier GPUs
const { nodes } = await client.nodes.list({
  tier: 'TIER_1_ENTERPRISE_GPU',
  minVramGb: 48,
});

// 2. Submit a high-performance training container
const job = await client.workloads.submit({
  image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
  command: 'python train_distributed.py --epochs 50',
  gpuCount: 4,
  strategy: 'BEST_PRICE_PERFORMANCE',
});

console.log(\`Job submitted: \${job.id} on node \${job.nodeId}\`);`;

  const pyCode = `from distributed_compute import DistributedComputeClient

# Initialize with context manager
with DistributedComputeClient(api_key="dc_live_...") as client:
    # 1. Search for available H100 nodes
    nodes = client.list_nodes(gpu_model="H100", min_vram_gb=80)
    
    # 2. Launch containerized workload
    job = client.submit_workload(
        image="vllm/vllm-openai:latest",
        command="--model meta-llama/Llama-3-70b-Instruct",
        gpu_count=4,
        strategy="HIGHEST_RELIABILITY"
    )
    print(f"Running LLM inference job: {job['id']}")`;

  const curlCode = `# Submit container workload via REST API
curl -X POST https://api.distributed.gpu/api/v1/workloads/jobs \\
  -H "Authorization: Bearer dc_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "image": "pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime",
    "command": "python benchmark.py",
    "gpuCount": 2,
    "strategy": "CHEAPEST"
  }'`;

  const cliCode = `# Install CLI tool
npm install -g @distributed-compute/cli

# Export your API key
export DISTRIBUTED_COMPUTE_API_KEY="dc_live_..."

# List available cluster nodes
dcompute nodes list

# Launch container job directly from terminal
dcompute run pytorch/pytorch:latest "python train.py"`;

  const initialKeysList: ApiKey[] = keys.length > 0 ? keys : [
    {
      id: 'key-init-01',
      userId: 'user-cust-default',
      name: 'Default CI/CD Training Key',
      keyPrefix: 'dc_live_7fa9...1238',
      scopes: [ApiKeyScope.WORKLOADS_ALL, ApiKeyScope.NODES_READ, ApiKeyScope.BILLING_READ],
      lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 604800000).toISOString(),
    },
  ];

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <Code2 size={14} /> Developer Platform & SDKs
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Developer Portal & API Keys
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Integrate distributed compute nodes directly into your training pipelines with official SDKs and CLI.
          </p>
        </div>

        <button onClick={() => { setNewSecretKey(null); setShowCreateModal(true); }} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={14} /> Create API Key
        </button>
      </div>

      {/* API Keys Table */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Active API Keys</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scoped Bearer authentication for REST & SDK</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Key Name</th>
                <th style={{ padding: '10px' }}>Token Prefix</th>
                <th style={{ padding: '10px' }}>Permissions</th>
                <th style={{ padding: '10px' }}>Created</th>
                <th style={{ padding: '10px' }}>Last Used</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialKeysList.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 600, color: '#ffffff' }}>{k.name}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{k.keyPrefix}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {k.scopes.map((s) => (
                        <span key={s} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-cyan)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString() : 'Never'}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRevokeKey(k.id)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '11px', color: '#f87171' }}
                      title="Revoke key"
                    >
                      <Trash2 size={12} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Snippets & Quickstarts */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>SDK Quickstart & Code Recipes</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Select your preferred language or toolchain to get started in seconds.
        </p>

        {/* Language Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('ts')}
            className={`btn ${activeTab === 'ts' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            TypeScript SDK
          </button>
          <button
            onClick={() => setActiveTab('py')}
            className={`btn ${activeTab === 'py' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Python SDK
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            className={`btn ${activeTab === 'curl' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            cURL / REST
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`btn ${activeTab === 'cli' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            CLI Tool
          </button>
        </div>

        {/* Code Box */}
        <div style={{ position: 'relative', background: 'rgba(0, 0, 0, 0.6)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', padding: '20px' }}>
          <button
            onClick={() => copyToClipboard(
              activeTab === 'ts' ? tsCode : activeTab === 'py' ? pyCode : activeTab === 'curl' ? curlCode : cliCode,
              activeTab
            )}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid var(--border-color)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {copiedSnippet === activeTab ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
            {copiedSnippet === activeTab ? 'Copied' : 'Copy'}
          </button>

          <pre style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--accent-cyan)', fontFamily: 'monospace', overflowX: 'auto' }}>
            <code>
              {activeTab === 'ts' && tsCode}
              {activeTab === 'py' && pyCode}
              {activeTab === 'curl' && curlCode}
              {activeTab === 'cli' && cliCode}
            </code>
          </pre>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '28px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Create API Key</h3>
            
            {newSecretKey ? (
              <div>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', padding: '14px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '4px' }}>
                    ✔ API Key Created! Save it now.
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    This key will never be displayed again. Store it securely in your secret manager.
                  </div>
                </div>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                  <input
                    type="text"
                    readOnly
                    value={newSecretKey}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => copyToClipboard(newSecretKey, 'secret')}
                    style={{ position: 'absolute', right: '8px', top: '8px', padding: '6px 10px', background: 'var(--accent-cyan)', color: '#000000', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {copiedKey ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreateModal(false)} className="btn btn-primary">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Key Name / Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#ffffff' }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Key Scopes & Permissions
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: ApiKeyScope.WORKLOADS_ALL, label: 'workloads:all (Submit, manage & stream logs)' },
                      { id: ApiKeyScope.NODES_READ, label: 'nodes:read (Query GPU catalog and benchmarks)' },
                      { id: ApiKeyScope.BILLING_READ, label: 'billing:read (View usage and invoice ledgers)' },
                    ].map((scope) => (
                      <label key={scope.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#ffffff', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={scopes.includes(scope.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScopes((prev) => [...prev, scope.id]);
                            } else {
                              setScopes((prev) => prev.filter((s) => s !== scope.id));
                            }
                          }}
                        />
                        {scope.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Generate Secret
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
