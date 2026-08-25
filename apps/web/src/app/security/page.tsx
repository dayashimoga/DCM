'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Lock, Terminal, Cpu, FileCheck2, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { SecurityAuditSummary, SecuritySeverity } from '@distributed-compute/shared-types';

export default function SecurityCompliancePage() {
  const [summary, setSummary] = useState<SecurityAuditSummary | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchAudit = async () => {
    try {
      const res = await fetch(`${apiUrl}/security/audit`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  // Fallback demo data
  const data: SecurityAuditSummary = summary || {
    totalEventsLogged: 14,
    criticalThreatsBlocked: 3,
    activeSandboxesHardened: 12,
    systemComplianceScorePercent: 99.8,
    policy: {
      runtime: 'GVISOR_RUNSC' as any,
      dropCapabilities: ['ALL', 'CAP_SYS_ADMIN', 'CAP_NET_ADMIN', 'CAP_SYS_PTRACE'],
      readOnlyRootfs: true,
      noNewPrivileges: true,
      runAsUser: '10001:10001',
      seccompProfile: 'default-hardened-v2.json',
      networkMode: 'ISOLATED_NONE' as any,
      memoryLimitMb: 32768,
      cpuQuotaPercent: 800,
      pidsLimit: 1024,
      tmpfsMounts: ['/tmp:rw,noexec,nosuid,size=512m'],
    },
    recentSecurityEvents: [
      {
        id: 'sec-01',
        type: 'RESTRICTED_SYSCALL_BLOCKED' as any,
        severity: SecuritySeverity.CRITICAL,
        source: 'PROVIDER_SANDBOX',
        targetId: 'job-pytorch-probe',
        details: { syscall: 'ptrace', action: 'SIGKILL' },
        mitigation: 'Seccomp filter intercepted unauthorized syscall and killed thread',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'sec-02',
        type: 'MALICIOUS_IMAGE_BLOCKED' as any,
        severity: SecuritySeverity.HIGH,
        source: 'PROVIDER_SANDBOX',
        targetId: 'job-xmrig-miner',
        details: { image: 'docker.io/library/xmrig:latest' },
        mitigation: 'Cryptominer signature matched; job submission rejected',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'sec-03',
        type: 'RATE_LIMIT_EXCEEDED' as any,
        severity: SecuritySeverity.LOW,
        source: 'API_GATEWAY',
        targetId: 'ip-198.51.100.24',
        details: { rate: '120 req/min', limit: '60 req/min' },
        mitigation: 'HTTP 429 Too Many Requests response with 60s cooldown',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
  };

  const filteredEvents = data.recentSecurityEvents.filter((ev) => {
    if (filterSeverity === 'ALL') return true;
    return ev.severity === filterSeverity;
  });

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <ShieldCheck size={14} /> Zero-Trust Defense Layer
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Security Hardening & Sandboxing
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Multi-tenant container isolation, gVisor micro-sandboxing, strict non-root enforcement, and real-time threat detection.
          </p>
        </div>

        <button onClick={fetchAudit} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} /> Refresh Audit Stream
        </button>
      </div>

      {/* Security Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Compliance Score</span>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {data.systemComplianceScorePercent}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            SOC2 / ISO 27001 readiness posture
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Sandboxes</span>
            <Lock size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.activeSandboxesHardened} Isolated
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hardened with gVisor & seccomp
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Threats Blocked</span>
            <ShieldAlert size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-amber)' }}>
            {data.criticalThreatsBlocked} Critical
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Escapes & cryptominers auto-mitigated
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Audit Events</span>
            <FileCheck2 size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.totalEventsLogged}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Real-time telemetry audit trail
          </div>
        </div>
      </div>

      {/* Sandboxing Architecture Blueprint */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Defense-in-Depth Sandboxing Baseline</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              <Cpu size={16} /> Runtime & Kernel Isolation
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Workloads run inside <strong>gVisor (runsc)</strong> user-space kernel sandbox. Kernel syscalls from guest code never directly hit the host Linux kernel.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              <Lock size={16} /> Privilege Stripping
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              All Linux capabilities dropped (<code>--cap-drop=ALL</code>), <code>no-new-privileges:true</code> enforced, and execution constrained to unprivileged UID <code>10001:10001</code>.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-amber)', fontWeight: 700 }}>
              <Terminal size={16} /> Storage & Memory Sandbox
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Root filesystem is strictly <code>--read-only</code> with ephemeral in-memory tmpfs scratchpad (<code>/tmp</code> with <code>noexec,nosuid</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Threat Interception & Audit Log</h3>

          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilterSeverity(sev)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: filterSeverity === sev ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                  background: filterSeverity === sev ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Severity</th>
                <th style={{ padding: '10px' }}>Event Type</th>
                <th style={{ padding: '10px' }}>Target</th>
                <th style={{ padding: '10px' }}>Mitigation Action</th>
                <th style={{ padding: '10px' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      background: ev.severity === SecuritySeverity.CRITICAL ? 'rgba(239, 68, 68, 0.2)' : ev.severity === SecuritySeverity.HIGH ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: ev.severity === SecuritySeverity.CRITICAL ? '#f87171' : ev.severity === SecuritySeverity.HIGH ? 'var(--accent-amber)' : 'var(--accent-cyan)',
                    }}>
                      {ev.severity}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#ffffff', fontWeight: 600 }}>{ev.type.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ev.targetId}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--accent-emerald)', fontSize: '12px' }}>{ev.mitigation}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{new Date(ev.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
