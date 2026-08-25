# Production Launch & Operations Runbook

## 1. Production Architecture Overview

The **Distributed Compute Marketplace** is structured across two deployment tiers:
- **Edge UI Layer**: Next.js 15 App Router statically exported to **Cloudflare Free Pages** with global CDN edge caching, automatic HTTPS termination, and zero egress cost.
- **Control Plane Layer**: NestJS Modular Monolith containerized on **Kubernetes (EKS / GKE / Self-Hosted)** backed by multi-AZ **PostgreSQL 16** and clustered **Redis 7**.
- **Provider Fleet**: Outbound-only Python Provider Agents establishing mTLS WebSocket/HTTPS tunnels with gVisor container sandboxing.

---

## 2. Day-1 Deployment Checklist

### Step 1: Provision Infrastructure with Terraform
```bash
cd infra/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```
*Outputs: VPC ID, RDS Primary Endpoint, Redis Cluster Endpoint.*

### Step 2: Initialize Database & Run Prisma Migrations
```bash
export DATABASE_URL="postgresql://compute_admin:<PASSWORD>@<POSTGRES_ENDPOINT>:5432/distributed_compute_prod?sslmode=require"
cd apps/api
npx prisma migrate deploy
```

### Step 3: Configure Kubernetes Secrets & Deploy
```bash
cp infra/k8s/secrets.template.yaml infra/k8s/secrets.yaml
# Edit secrets.yaml with real production secrets
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secrets.yaml
kubectl apply -f infra/k8s/api-deployment.yaml
kubectl apply -f infra/k8s/api-service.yaml
kubectl apply -f infra/k8s/api-hpa.yaml
kubectl apply -f infra/k8s/network-policy.yaml
kubectl apply -f infra/k8s/ingress.yaml
```

### Step 4: Deploy Frontend to Cloudflare Free Pages
```bash
# Via GitHub Actions CI/CD automatically on git push to main, or manually:
./scripts/deploy-cloudflare.sh
```

---

## 3. Monitoring, Telemetry & Alerting Matrix

| Alert Name | Condition | Severity | Escalation / Remediation Action |
|---|---|---|---|
| `ComputeNodeDroppedOffline` | Heartbeat missed for >45s during active workload | P1 High | Intelligent Scheduler triggers automated failover to standby node; auto-refund escrow. |
| `HighJobFailureRate` | Job error rate > 5% over 5m window | P1 High | Trigger sandbox kernel log inspection; check provider hardware driver stability. |
| `ApiHighP99Latency` | P99 HTTP latency > 250ms for 3m | P2 Medium | Kubernetes HPA auto-scales API pods from 3 up to 20 replicas. |
| `SecuritySyscallThreat` | gVisor blocks prohibited syscall or container escape attempt | P0 Critical | Immediately terminate container, blacklist workload image, notify admin. |

---

## 4. Disaster Recovery & Failover Plan

- **Recovery Point Objective (RPO)**: $< 5$ minutes (Continuous WAL replication to S3).
- **Recovery Time Objective (RTO)**: $< 15$ minutes (Multi-AZ automated failover).
- **PostgreSQL Failover**: AWS RDS Multi-AZ automatically promotes synchronous standby replica with zero data loss.
- **Redis Failover**: ElastiCache Multi-AZ promotes reader replica within 15 seconds.
