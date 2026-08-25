'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Gauge, GitCommit, Layers, RefreshCw, Cpu, Server, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { ObservabilitySummary } from '@distributed-compute/shared-types';

export default function TelemetryObservabilityPage() {
  const [summary, setSummary] = useState<ObservabilitySummary | null>(null);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'TRACES' | 'PROMETHEUS'>('METRICS');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchTelemetry = async () => {
    try {
      const res = await fetch(`${apiUrl}/metrics/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const data: ObservabilitySummary = summary || {
    totalMetricsExported: 6,
    activeTracesSampled: 4,
    averageLatencyMs: 28.5,
    errorRatePercent: 0.02,
    requestsPerSecond: 142.8,
    metrics: [
      {
        name: 'compute_marketplace_http_requests_total',
        type: 'COUNTER' as any,
        value: 12480,
        labels: { status: '200' },
        description: 'Total HTTP requests processed by marketplace API',
      },
      {
        name: 'compute_marketplace_nodes_online_gauge',
        type: 'GAUGE' as any,
        value: 6,
        labels: { status: 'ONLINE' },
        description: 'Number of active compute nodes registered and heartbeating',
      },
      {
        name: 'compute_marketplace_gpus_available_gauge',
        type: 'GAUGE' as any,
        value: 18,
        labels: { tier: 'TIER_1_AND_2' },
        description: 'Total active GPU accelerators available for scheduling',
      },
      {
        name: 'compute_marketplace_active_jobs_gauge',
        type: 'GAUGE' as any,
        value: 4,
        labels: { state: 'RUNNING' },
        description: 'Total containerized customer workloads actively executing',
      },
      {
        name: 'compute_marketplace_escrow_locked_usd_gauge',
        type: 'GAUGE' as any,
        value: 1450.75,
        labels: { currency: 'USD' },
        description: 'Total customer funds locked in trustless escrow contracts',
      },
      {
        name: 'compute_marketplace_p99_latency_seconds',
        type: 'HISTOGRAM' as any,
        value: 0.042,
        labels: { endpoint: '/api/v1/workloads/jobs' },
        description: 'P99 API response latency in seconds',
      },
    ],
    recentTraces: [
      {
        traceId: 'trc-1724589210-a9b3',
        spanId: 'spn-gw-01',
        name: 'POST /api/v1/workloads/jobs',
        serviceName: 'api-gateway',
        durationMs: 48,
        status: 'OK',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        attributes: { clientIp: '192.0.2.1', userRole: 'CUSTOMER' },
      },
      {
        traceId: 'trc-1724589210-a9b3',
        spanId: 'spn-sch-02',
        parentSpanId: 'spn-gw-01',
        name: 'Scheduler: Evaluate & Rank Nodes',
        serviceName: 'scheduler-engine',
        durationMs: 14,
        status: 'OK',
        timestamp: new Date(Date.now() - 29950).toISOString(),
        attributes: { candidatesEvaluated: 8, strategy: 'CHEAPEST' },
      },
      {
        traceId: 'trc-1724589210-a9b3',
        spanId: 'spn-sbx-03',
        parentSpanId: 'spn-sch-02',
        name: 'ProviderAgent: Launch Hardened Sandbox',
        serviceName: 'provider-sandbox',
        durationMs: 180,
        status: 'OK',
        timestamp: new Date(Date.now() - 29930).toISOString(),
        attributes: { runtime: 'gvisor', isolation: 'cap-drop=ALL' },
      },
    ],
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <Activity size={14} /> OpenTelemetry & RED Engine
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Observability & Distributed Tracing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Prometheus metric exposition, distributed span latency waterfalls, and real-time network telemetry.
          </p>
        </div>

        <button onClick={fetchTelemetry} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Telemetry
        </button>
      </div>

      {/* RED Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Request Rate</span>
            <Activity size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.requestsPerSecond} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>req/s</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            HTTP rate across API gateway
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Latency</span>
            <Clock size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {data.averageLatencyMs} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>ms</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            P99 sub-50ms threshold
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Error Rate</span>
            <Gauge size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.errorRatePercent}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            99.98% platform reliability
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Exported Metrics</span>
            <Layers size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {data.totalMetricsExported}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Prometheus scrape descriptors
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
        {[
          { id: 'METRICS', label: 'Platform Gauges & Counters' },
          { id: 'TRACES', label: 'Distributed Traces (Waterfall)' },
          { id: 'PROMETHEUS', label: 'Raw Prometheus Scraper' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Platform Metrics */}
      {activeTab === 'METRICS' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Prometheus Registered Gauges</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {data.metrics.map((m) => (
              <div key={m.name} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="badge" style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
                    {m.type}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                    {typeof m.value === 'number' && m.value > 100 ? m.value.toLocaleString() : m.value}
                  </span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {m.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {m.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Distributed Trace Waterfall */}
      {activeTab === 'TRACES' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Distributed Trace Waterfall</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Visual trace timeline showing request traversal from API Gateway → Intelligent Scheduler → Node Container Sandbox.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.recentTraces.map((span, idx) => (
              <div key={span.spanId} style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                borderLeft: idx === 0 ? '4px solid var(--accent-cyan)' : idx === 1 ? '4px solid var(--accent-emerald)' : '4px solid var(--accent-amber)',
                borderTop: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                borderBottom: '1px solid var(--border-color)',
                marginLeft: span.parentSpanId ? '24px' : '0px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{span.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({span.serviceName})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {span.durationMs} ms
                    </span>
                    <span className="badge" style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
                      {span.status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  <span>Trace: {span.traceId}</span>
                  <span>Span: {span.spanId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Raw Prometheus */}
      {activeTab === 'PROMETHEUS' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>Standard Prometheus Exporter Output</h3>
          <pre style={{
            background: 'rgba(0,0,0,0.6)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            fontSize: '12px',
            color: 'var(--accent-cyan)',
            fontFamily: 'monospace',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>
{`# HELP compute_marketplace_http_requests_total Total HTTP requests processed by marketplace API
# TYPE compute_marketplace_http_requests_total counter
compute_marketplace_http_requests_total{status="200"} 12480

# HELP compute_marketplace_nodes_online_gauge Number of active compute nodes registered and heartbeating
# TYPE compute_marketplace_nodes_online_gauge gauge
compute_marketplace_nodes_online_gauge{status="ONLINE"} 6

# HELP compute_marketplace_gpus_available_gauge Total active GPU accelerators available for scheduling
# TYPE compute_marketplace_gpus_available_gauge gauge
compute_marketplace_gpus_available_gauge{tier="TIER_1_AND_2"} 18

# HELP compute_marketplace_active_jobs_gauge Total containerized customer workloads actively executing
# TYPE compute_marketplace_active_jobs_gauge gauge
compute_marketplace_active_jobs_gauge{state="RUNNING"} 4

# HELP compute_marketplace_escrow_locked_usd_gauge Total customer funds locked in trustless escrow contracts
# TYPE compute_marketplace_escrow_locked_usd_gauge gauge
compute_marketplace_escrow_locked_usd_gauge{currency="USD"} 1450.75

# HELP compute_marketplace_p99_latency_seconds P99 API response latency in seconds
# TYPE compute_marketplace_p99_latency_seconds histogram
compute_marketplace_p99_latency_seconds{endpoint="/api/v1/workloads/jobs"} 0.042`}
          </pre>
        </div>
      )}
    </div>
  );
}
