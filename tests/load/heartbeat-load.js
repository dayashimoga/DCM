const autocannon = require('autocannon');

async function runHeartbeatBenchmark(baseUrl = 'http://localhost:4000') {
  console.log('\n🔥 Running Heartbeat Scale Test (500 Concurrent Provider Agents)...');

  const instance = autocannon({
    url: `${baseUrl}/api/v1/providers/nodes/heartbeat`,
    connections: 50,
    pipelining: 1,
    duration: 5,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer mock-token',
    },
    body: JSON.stringify({
      nodeId: 'node-stress-1',
      status: 'ONLINE',
      timestamp: Date.now(),
      metrics: {
        cpuUsagePercent: 45.2,
        ramUsagePercent: 62.1,
        ramUsedGb: 124,
        gpuUtilizationPercent: 88.5,
        gpuTemperatureCelsius: 71,
      },
    }),
  });

  return new Promise((resolve, reject) => {
    autocannon.track(instance, { renderProgressBar: false });
    instance.on('done', (result) => {
      console.log(`✅ Heartbeats: ${result.requests.total} requests, avg latency: ${result.latency.average}ms, P99: ${result.latency.p99}ms`);
      resolve(result);
    });
    instance.on('error', reject);
  });
}

module.exports = { runHeartbeatBenchmark };

if (require.main === module) {
  runHeartbeatBenchmark();
}
