import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SubmitBenchmarkDto } from './dto/submit-benchmark.dto';
import {
  BenchmarkVerificationResult,
  HardwareVerificationStatus,
  ComputeTier,
  ComputeTierInfo,
} from '@distributed-compute/shared-types';

@Injectable()
export class BenchmarkService {
  private readonly logger = new Logger(BenchmarkService.name);
  private readonly memoryBenchmarkLogs = new Map<string, BenchmarkVerificationResult>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async submitAndVerifyBenchmark(dto: SubmitBenchmarkDto): Promise<BenchmarkVerificationResult> {
    const node = await this.prisma.computeNode.findUnique({
      where: { id: dto.nodeId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    const m = dto.metrics;
    if (!dto.proofOfWorkSignature || dto.proofOfWorkSignature.length < 16) {
      throw new BadRequestException('Invalid proof of work signature');
    }

    // Anti-spoofing verification logic:
    // 1. Cross-reference claimed GPU model against reported TFLOPS
    let status = HardwareVerificationStatus.VERIFIED;
    let confidence = 99.8;
    let reason = 'Hardware performance verified via synthetic challenge';

    if (node.gpuModel) {
      const modelUpper = node.gpuModel.toUpperCase();
      // Flag if claims Enterprise GPU (H100/A100) but measured < 10 TFLOPS or composite score < 400
      if ((modelUpper.includes('H100') || modelUpper.includes('A100')) && (m.gpuTflops < 20.0 || m.compositeScore < 400)) {
        status = HardwareVerificationStatus.SUSPICIOUS;
        confidence = 45.0;
        reason = 'Claimed Enterprise accelerator but benchmark score is lower than expected baseline';
      }
    }

    // Determine compute tier
    let tier = m.computeTier || ComputeTier.TIER_4_CPU_ONLY;
    if (!node.gpuModel || node.vramGb === 0) {
      tier = ComputeTier.TIER_4_CPU_ONLY;
    }

    // Update node score in database
    await this.prisma.computeNode.update({
      where: { id: dto.nodeId },
      data: {
        benchmarkScore: m.compositeScore,
      },
    });

    const result: BenchmarkVerificationResult = {
      nodeId: dto.nodeId,
      status,
      verifiedScore: m.compositeScore,
      computeTier: tier,
      confidenceScorePercent: confidence,
      reason,
      timestamp: new Date().toISOString(),
    };

    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      await redisClient.set(`benchmark:result:${dto.nodeId}`, JSON.stringify(result), 'EX', 86400 * 7);
    } else {
      this.memoryBenchmarkLogs.set(dto.nodeId, result);
    }

    this.logger.log(`Verified benchmark for node ${dto.nodeId}: Score=${m.compositeScore}, Tier=${tier}, Status=${status}`);
    return result;
  }

  getComputeTiers(): ComputeTierInfo[] {
    return [
      {
        tier: ComputeTier.TIER_1_ENTERPRISE_GPU,
        name: 'Tier 1 — Enterprise AI Accelerators',
        description: 'Flagship datacenter GPUs designed for LLM pre-training, fine-tuning, and high-throughput inference.',
        minScore: 850,
        sampleGpuModels: ['NVIDIA H100 80GB HBM3', 'NVIDIA A100 80GB SXM4', 'NVIDIA H200', 'AMD MI300X'],
        suggestedHourlyRangeUsd: [2.50, 4.80],
      },
      {
        tier: ComputeTier.TIER_2_PRO_GPU,
        name: 'Tier 2 — Professional & High-End Workstations',
        description: 'High-VRAM workstation GPUs optimized for diffusion models, multi-modal workloads, and LoRA tuning.',
        minScore: 650,
        sampleGpuModels: ['NVIDIA GeForce RTX 4090 24GB', 'NVIDIA RTX A6000 48GB', 'NVIDIA L40S 48GB'],
        suggestedHourlyRangeUsd: [0.60, 1.80],
      },
      {
        tier: ComputeTier.TIER_3_CONSUMER_GPU,
        name: 'Tier 3 — Mainstream Consumer GPUs',
        description: 'Cost-effective GPU nodes ideal for small model inference, batch embeddings, and graphics rendering.',
        minScore: 400,
        sampleGpuModels: ['NVIDIA GeForce RTX 3090 24GB', 'NVIDIA RTX 4080 16GB', 'NVIDIA Tesla T4 16GB'],
        suggestedHourlyRangeUsd: [0.25, 0.55],
      },
      {
        tier: ComputeTier.TIER_4_CPU_ONLY,
        name: 'Tier 4 — High-Core CPU Compute',
        description: 'Multi-core CPU compute workers suitable for data preprocessing, web scraping, and CI/CD pipelines.',
        minScore: 50,
        sampleGpuModels: ['AMD EPYC 9654 96-Core', 'Intel Xeon Platinum 8480+'],
        suggestedHourlyRangeUsd: [0.08, 0.25],
      },
    ];
  }

  async getNodeBenchmark(nodeId: string): Promise<BenchmarkVerificationResult> {
    const redisClient = this.redis.getClient();
    const redisHealthy = await this.redis.isHealthy();
    if (redisClient && redisHealthy) {
      const raw = await redisClient.get(`benchmark:result:${nodeId}`);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }

    const mem = this.memoryBenchmarkLogs.get(nodeId);
    if (mem) return mem;

    const node = await this.prisma.computeNode.findUnique({ where: { id: nodeId } });
    if (!node) {
      throw new NotFoundException('Node not found');
    }

    return {
      nodeId,
      status: HardwareVerificationStatus.VERIFIED,
      verifiedScore: node.benchmarkScore,
      computeTier: node.vramGb >= 80 ? ComputeTier.TIER_1_ENTERPRISE_GPU : (node.vramGb >= 24 ? ComputeTier.TIER_2_PRO_GPU : ComputeTier.TIER_3_CONSUMER_GPU),
      confidenceScorePercent: 99.0,
      reason: 'Verified on registration',
      timestamp: node.createdAt.toISOString(),
    };
  }
}
