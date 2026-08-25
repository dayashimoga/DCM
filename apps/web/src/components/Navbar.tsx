'use client';

import React from 'react';
import { Cpu, Terminal, Shield, ShieldCheck, Zap, User, LogOut, LayoutDashboard, Search, Play, Wallet, Activity, Award, Code2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { UserRole } from '@distributed-compute/shared-types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
          }}>
            <Cpu size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.5px' }}>
              DISTRIBUTED<span className="gradient-text">COMPUTE</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              GPU/CPU Marketplace
            </div>
          </div>
        </a>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="/marketplace" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} /> Marketplace
          </a>
          <a href="/workloads" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} /> Workloads
          </a>
          <a href="/billing" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} /> Billing
          </a>
          <a href="/wallet" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wallet size={14} /> Wallet
          </a>
          <a href="/benchmarks" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            Benchmarks
          </a>
          <a href="/trust" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} /> Trust & SLA
          </a>
          <a href="/developers" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code2 size={14} /> Developers
          </a>
          <a href="/security" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} /> Security
          </a>
          <a href="/telemetry" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} /> Telemetry
          </a>
          <a href="/provider/dashboard" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', transition: 'color 0.2s' }}>
            Provider Fleet
          </a>
        </nav>

        {/* User / Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {user.role === UserRole.PROVIDER && (
                <a href="/provider/dashboard" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <LayoutDashboard size={14} /> My Fleet
                </a>
              )}
              <a href="/workloads/submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <Play size={13} /> Launch Job
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(56, 189, 248, 0.2)',
                  border: '1px solid var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={16} color="var(--accent-cyan)" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>{user.email.split('@')[0]}</div>
                  <span className="badge" style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }} title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <>
              <a href="/auth/login" className="btn btn-secondary" style={{ fontSize: '13px' }}>
                <Terminal size={15} />
                Sign In
              </a>
              <a href="/auth/register" className="btn btn-primary" style={{ fontSize: '13px' }}>
                <Zap size={15} />
                Get Started
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
