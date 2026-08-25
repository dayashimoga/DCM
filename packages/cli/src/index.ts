#!/usr/bin/env node
import { DistributedComputeClient } from '@distributed-compute/sdk';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const apiKey = process.env.DISTRIBUTED_COMPUTE_API_KEY || '';
  const baseUrl = process.env.DISTRIBUTED_COMPUTE_BASE_URL || 'http://localhost:4000/api/v1';

  const client = new DistributedComputeClient({
    apiKey,
    baseUrl,
  });

  switch (command) {
    case 'nodes': {
      const subcommand = args[1] || 'list';
      if (subcommand === 'list') {
        const res = await client.nodes.list();
        console.log(`\nFound ${res.total} online compute nodes:`);
        console.table(
          res.nodes.map((n) => ({
            ID: n.id,
            Name: n.name,
            GPU: n.gpus[0]?.model || 'None',
            VRAM: `${n.gpus[0]?.vramGb || 0}GB`,
            Rate: `$${n.hourlyRateUsd}/hr`,
            Score: n.benchmarkScore,
          })),
        );
      }
      break;
    }
    case 'run': {
      const image = args[1] || 'pytorch/pytorch:latest';
      const cmd = args.slice(2).join(' ') || undefined;
      console.log(`Submitting workload container: ${image}...`);
      const job = await client.workloads.submit({
        image,
        command: cmd,
      });
      console.log(`🚀 Job submitted successfully! ID: ${job.id}`);
      console.log(`Status: ${job.status}`);
      break;
    }
    case 'status': {
      const jobId = args[1];
      if (!jobId) {
        console.error('Error: Please provide job ID. Example: dcompute status job-123');
        process.exit(1);
      }
      const job = await client.workloads.get(jobId);
      console.log(`\nJob Status: [${job.status}] - ID: ${job.id}`);
      console.log(`Image: ${job.image}`);
      console.log(`Node: ${job.nodeId}`);
      console.log(`Total GPU Seconds: ${job.totalGpuSeconds}s`);
      console.log(`Total Cost: $${job.totalCostUsd}`);
      break;
    }
    case 'logs': {
      const jobId = args[1];
      if (!jobId) {
        console.error('Error: Please provide job ID. Example: dcompute logs job-123');
        process.exit(1);
      }
      const logs = await client.workloads.getLogs(jobId);
      console.log(`\n--- Workload Logs for ${jobId} ---`);
      logs.forEach((line) => console.log(line));
      break;
    }
    default:
      console.log(`
Distributed Compute CLI (dcompute) v0.1.0

Usage:
  dcompute nodes list                  List available compute nodes
  dcompute run <image> [command]       Submit a container job
  dcompute status <jobId>              Get status of a submitted job
  dcompute logs <jobId>                Fetch container execution logs
      `);
      break;
  }
}

main().catch((err) => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});
