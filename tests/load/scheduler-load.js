const autocannon = require('autocannon');

async function runSchedulerBenchmark(baseUrl = 'http://localhost:4000') {
  console.log('\n🔥 Running Intelligent Scheduler Load Test (200 Concurrent Placements)...');

  const instance = autocannon({
    url: `${baseUrl}/api/v1/scheduler/evaluate`,
    connections: 50,
    pipelining: 1,
    duration: 5,
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      strategy: 'BEST_PRICE_PERFORMANCE',
      requiredGpus: 2,
      minVramGb: 24,
      maxHourlyRateUsd: 10.0,
    }),
  });

  return new Promise((resolve, reject) => {
    autocannon.track(instance, { renderProgressBar: false });
    instance.on('done', (result) => {
      console.log(`✅ Scheduler: ${result.requests.total} evaluations, avg latency: ${result.latency.average}ms, P99: ${result.latency.p99}ms`);
      resolve(result);
    });
    instance.on('error', reject);
  });
}

module.exports = { runSchedulerBenchmark };

if (require.main === module) {
  runSchedulerBenchmark();
}
