'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Cpu, Terminal, Zap, User, LogOut, LayoutDashboard, Search, Play,
  Wallet, Activity, Award, Code2, ShieldCheck, Menu, X, ChevronDown
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { UserRole } from '@distributed-compute/shared-types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const primaryLinks = [
    { href: '/marketplace', label: 'Marketplace', icon: Search },
    { href: '/workloads', label: 'Workloads', icon: Terminal },
    { href: '/billing', label: 'Billing', icon: Zap },
    { href: '/provider/dashboard', label: 'Provider Fleet', icon: LayoutDashboard },
  ];

  const secondaryLinks = [
    { href: '/wallet', label: 'Wallet & Escrow', icon: Wallet },
    { href: '/benchmarks', label: 'Hardware Benchmarks', icon: Activity },
    { href: '/trust', label: 'Trust & SLA Reputation', icon: Award },
    { href: '/developers', label: 'SDK & CLI Docs', icon: Code2 },
    { href: '/security', label: 'Security & Sandboxing', icon: ShieldCheck },
    { href: '/telemetry', label: 'Prometheus Telemetry', icon: Activity },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(9, 13, 22, 0.90)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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
            <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.5px' }}>
              DISTRIBUTED<span className="gradient-text">COMPUTE</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Decentralized Marketplace
            </div>
          </div>
        </Link>

        {/* Desktop Primary Navigation */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  transition: 'color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon size={15} /> {link.label}
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
              }}
              aria-expanded={moreDropdownOpen}
              aria-label="More navigation items"
            >
              More <ChevronDown size={14} style={{ transform: moreDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {moreDropdownOpen && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  left: '-20px',
                  width: '240px',
                  padding: '8px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {secondaryLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMoreDropdownOpen(false)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                      className="nav-dropdown-item"
                    >
                      <Icon size={14} color="var(--accent-cyan)" /> {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* User / Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/workloads/submit" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
                <Play size={13} /> Launch Job
              </Link>
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
                <div className="user-email-badge">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>{user.email.split('@')[0]}</div>
                  <span className="badge" style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 10px', fontSize: '12px' }} title="Log out">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link href="/auth/login" className="btn btn-secondary" style={{ fontSize: '13px', padding: '8px 14px' }}>
                <Terminal size={14} /> Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 14px' }}>
                <Zap size={14} /> Get Started
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              padding: '6px',
              cursor: 'pointer',
              display: 'none',
            }}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="glass-panel"
          style={{
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            borderRadius: 0,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Main Marketplace Navigation
          </div>
          {[...primaryLinks, ...secondaryLinks].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <Icon size={16} color="var(--accent-cyan)" /> {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
