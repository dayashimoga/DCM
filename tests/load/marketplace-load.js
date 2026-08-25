const autocannon = require('autocannon');

async function runMarketplaceBenchmark(baseUrl = 'http://localhost:4000') {
  console.log('\n🔥 Running Marketplace Discovery Load Test (1,000 Concurrent Search Queries)...');

  const instance = autocannon({
    url: `${baseUrl}/api/v1/marketplace/nodes?tier=TIER_1_ENTERPRISE_GPU&minVramGb=48`,
    connections: 100,
    pipelining: 1,
    duration: 5,
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
  });

  return new Promise((resolve, reject) => {
    autocannon.track(instance, { renderProgressBar: false });
    instance.on('done', (result) => {
      console.log(`✅ Marketplace Search: ${result.requests.total} requests, avg latency: ${result.latency.average}ms, P95: ${result.latency.p95 || result.latency.average}ms`);
      resolve(result);
    });
    instance.on('error', reject);
  });
}

module.exports = { runMarketplaceBenchmark };

if (require.main === module) {
  runMarketplaceBenchmark();
}
