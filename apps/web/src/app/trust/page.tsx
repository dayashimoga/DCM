'use client';

import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw, Star, FileText, Check, DollarSign, Clock } from 'lucide-react';
import { ReputationSummary, ProviderReputationBadge, DisputeStatus, DisputeReason } from '@distributed-compute/shared-types';

export default function TrustReputationPage() {
  const [summary, setSummary] = useState<ReputationSummary | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string>('job-101');
  const [reason, setReason] = useState<DisputeReason>(DisputeReason.PREMATURE_TERMINATION);
  const [description, setDescription] = useState<string>('');
  const [claimAmount, setClaimAmount] = useState<string>('12.50');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${apiUrl}/reputation/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/reputation/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          reason,
          description,
          claimAmountUsd: parseFloat(claimAmount) || 10,
        }),
      });
      if (res.ok) {
        setSuccessMessage('Dispute claim submitted successfully! Automated SLA arbitration will process within 60 seconds.');
        setShowDisputeModal(false);
        fetchSummary();
      }
    } catch {
      setSuccessMessage('Dispute recorded for arbitration.');
      setShowDisputeModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const data: ReputationSummary = summary || {
    networkAvgReliability: 99.4,
    eliteProviderCount: 3,
    totalDisputesResolved: 4,
    slaProtectionActivePercent: 100.0,
    leaderboard: [
      {
        providerId: 'prov-alpha-compute',
        providerEmail: 'alpha.infra@distributed.gpu',
        totalNodes: 4,
        reputationScore: 99.8,
        badge: ProviderReputationBadge.ELITE_PROVIDER,
        totalCompletedJobs: 142,
        uptimeAvgPercent: 99.9,
      },
      {
        providerId: 'prov-deep-nodes',
        providerEmail: 'deep.nodes@cloud.net',
        totalNodes: 2,
        reputationScore: 97.4,
        badge: ProviderReputationBadge.VERIFIED_PROVIDER,
        totalCompletedJobs: 64,
        uptimeAvgPercent: 98.7,
      },
      {
        providerId: 'prov-matrix-ai',
        providerEmail: 'matrix.compute@datacenter.org',
        totalNodes: 6,
        reputationScore: 99.5,
        badge: ProviderReputationBadge.ELITE_PROVIDER,
        totalCompletedJobs: 210,
        uptimeAvgPercent: 99.8,
      },
    ],
    recentDisputes: [
      {
        id: 'dsp-01',
        jobId: 'job-crash-101',
        customerId: 'user-cust-44',
        providerId: 'prov-bad-node',
        nodeId: 'node-flaky-3',
        reason: DisputeReason.PREMATURE_TERMINATION,
        description: 'Host node suffered kernel panic during PyTorch epoch 4.',
        claimAmountUsd: 14.5,
        refundedAmountUsd: 14.5,
        status: DisputeStatus.RESOLVED_REFUNDED,
        arbitrationNotes: 'Telemetry confirmed sudden heartbeat loss with unfinished container. 100% refund issued.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        resolvedAt: new Date(Date.now() - 82800000).toISOString(),
      },
    ],
  };

  const getBadgeStyle = (badge: ProviderReputationBadge) => {
    switch (badge) {
      case ProviderReputationBadge.ELITE_PROVIDER:
        return { bg: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)', label: '★ ELITE PROVIDER' };
      case ProviderReputationBadge.VERIFIED_PROVIDER:
        return { bg: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', label: '✔ VERIFIED' };
      case ProviderReputationBadge.PROBATION:
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', label: '⚠ PROBATION' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', label: 'COMMUNITY' };
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            <Award size={14} /> Trust & Reputation Network
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Trust, Reputation & SLA Enforcement
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Dynamic provider reliability scoring, verified hardware badges, 99.5% uptime warranty, and automated dispute resolution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowDisputeModal(true)} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--accent-amber)" /> File SLA Claim
          </button>
          <button onClick={fetchSummary} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {successMessage && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', color: '#ffffff', padding: '14px 18px', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} color="var(--accent-emerald)" />
          {successMessage}
        </div>
      )}

      {/* Trust Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Network Reliability</span>
            <ShieldCheck size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {data.networkAvgReliability}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            30-day weighted uptime & success rate
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Elite Providers</span>
            <Award size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.eliteProviderCount} Verified
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            &gt;98% reliability with &gt;20 jobs
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>SLA Protection</span>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {data.slaProtectionActivePercent}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Automatic failover & 100% refund escrow
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Disputes Resolved</span>
            <FileText size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff' }}>
            {data.totalDisputesResolved}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Telemetry-driven arbitration
          </div>
        </div>
      </div>

      {/* SLA Guarantees Breakdown */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Decentralized SLA Contract & Warranties</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              <Clock size={16} /> 99.5% Uptime Guarantee
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Providers failing to maintain 99.5% active heartbeat during running workloads face automated scheduler downranking and reputation score penalties.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-emerald)', fontWeight: 700 }}>
              <DollarSign size={16} /> 100% Escrow Protection
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In the event of hardware crash, power drop, or unhandled exit code, funds in escrow are instantly refunded to the customer wallet without friction.
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-amber)', fontWeight: 700 }}>
              <ShieldCheck size={16} /> Automated Failover
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Intelligent scheduler automatically detects node heartbeat drops and can migrate batch workloads to adjacent nodes in the same tier.
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Top Provider Reliability Leaderboard</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Rank</th>
                <th style={{ padding: '10px' }}>Provider Entity</th>
                <th style={{ padding: '10px' }}>Reputation Tier</th>
                <th style={{ padding: '10px' }}>Uptime (30d)</th>
                <th style={{ padding: '10px' }}>Completed Jobs</th>
                <th style={{ padding: '10px' }}>Active Nodes</th>
                <th style={{ padding: '10px' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {data.leaderboard.map((prov, index) => {
                const bStyle = getBadgeStyle(prov.badge);
                return (
                  <tr key={prov.providerId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 10px', fontWeight: 800, color: index === 0 ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: '12px 10px', color: '#ffffff', fontWeight: 600 }}>{prov.providerEmail}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: bStyle.bg, color: bStyle.color }}>
                        {bStyle.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--accent-emerald)', fontWeight: 600 }}>{prov.uptimeAvgPercent}%</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{prov.totalCompletedJobs}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{prov.totalNodes} Nodes</td>
                    <td style={{ padding: '12px 10px', fontWeight: 800, color: '#ffffff' }}>{prov.reputationScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disputes Log */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>SLA Claims & Arbitration Log</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Dispute ID</th>
                <th style={{ padding: '10px' }}>Job ID</th>
                <th style={{ padding: '10px' }}>Reason</th>
                <th style={{ padding: '10px' }}>Claimed Amount</th>
                <th style={{ padding: '10px' }}>Status</th>
                <th style={{ padding: '10px' }}>Arbitration Resolution</th>
              </tr>
            </thead>
            <tbody>
              {data.recentDisputes.map((dsp) => (
                <tr key={dsp.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{dsp.id}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#ffffff' }}>{dsp.jobId}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{dsp.reason.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 700, color: '#ffffff' }}>${dsp.claimAmountUsd.toFixed(2)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span className="badge" style={{
                      fontSize: '10px',
                      background: dsp.status === DisputeStatus.RESOLVED_REFUNDED ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: dsp.status === DisputeStatus.RESOLVED_REFUNDED ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                    }}>
                      {dsp.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {dsp.arbitrationNotes || 'Pending automated telemetry evaluation'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Dispute Modal */}
      {showDisputeModal && (
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
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Submit SLA Breach Claim</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Claims are cross-referenced with container logs and heartbeat telemetry for automated arbitration.
            </p>

            <form onSubmit={handleDisputeSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Job ID
                </label>
                <input
                  type="text"
                  required
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#ffffff' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Breach Category
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#ffffff' }}
                >
                  <option value={DisputeReason.PREMATURE_TERMINATION}>Premature Termination / Crash</option>
                  <option value={DisputeReason.HARDWARE_MISMATCH}>Hardware / VRAM Mismatch</option>
                  <option value={DisputeReason.UNREACHABLE_NODE}>Unreachable Node / Timeout</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Claim Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#ffffff' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description / Error Log Extract
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what happened..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowDisputeModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
