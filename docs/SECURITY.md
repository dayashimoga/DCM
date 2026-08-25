# Security Architecture & Threat Model — Distributed Compute Marketplace

## 1. Security Core Principles

1. **Untrusted Workloads**: All customer workloads (Docker containers, code scripts) are treated as hostile and untrusted.
2. **Untrusted Hardware Providers**: The platform does not trust self-reported hardware capabilities; hardware is verified via deterministic synthetic benchmarks.
3. **Outbound-Only Connectivity**: Provider Agents never listen on public inbound TCP/UDP ports, mitigating port scanning, DDoS, and firewall infiltration.
4. **Least Privilege**: Workloads run in rootless OCI container sandboxes with strict cgroup limits (memory, CPU, GPU device assignment).
5. **No Hardcoded Secrets**: All credentials, keys, and tokens are supplied via environment variables and secret stores.

---

## 2. Threat Modeling Matrix (STRIDE)

| Threat Category | Potential Attack Vector | Mitigation Strategy |
|---|---|---|
| **Spoofing** | Fake provider node claiming H100 GPU specs | Benchmark verification algorithms; server-side scoring validation; node-level pairing tokens. |
| **Tampering** | Customer modifying metering telemetry or provider forging heartbeat logs | Server-side authoritative wall-clock calculation; timestamped cryptographically verified session pulses. |
| **Repudiation** | Customer denying job submission or billing charge | Immutable append-only audit ledger in PostgreSQL; signed request IDs on every API transaction. |
| **Information Disclosure** | Workload stealing data from another tenant or accessing provider host filesystem | Container sandbox isolation (`--read-only` rootfs, no host volume mounts, network namespace isolation). |
| **Denial of Service** | Rogue workload consuming all host memory/cores | Cgroup v2 hard memory limits (`--memory=Xgb`), CPU quota limits (`--cpus=Y`), and timeout killers. |
| **Elevation of Privilege** | Container breakout or kernel exploit | Rootless Podman/Docker execution; seccomp profiles; dropped Linux capabilities (`--cap-drop=ALL`). |

---

## 3. Workload Isolation Rules

When launching a customer container on a provider node:
```bash
podman run \
  --rm \
  --user 1000:1000 \
  --cap-drop=ALL \
  --security-opt=no-new-privileges \
  --memory=32g \
  --memory-swap=32g \
  --cpus=8.0 \
  --device nvidia.com/gpu=0 \
  --network none (or restricted egress) \
  <CUSTOMER_IMAGE> <COMMAND>
```

---

## 4. RBAC Permission Matrix

| Role | Browse Compute | Submit Job | Cancel Own Job | Manage Nodes | View Platform Ledger |
|---|---|---|---|---|---|
| `GUEST` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `CUSTOMER` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `PROVIDER` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Vulnerability Reporting

Please report security vulnerabilities to `security@distributed-compute.local`.
