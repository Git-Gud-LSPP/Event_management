const redis = require('redis');

let redisClient = null;
let isConnected = false;

async function connectRedis() {
  try {
    const redisUri = process.env.REDIS_URI || 'redis://localhost:6379';
    redisClient = redis.createClient({ url: redisUri });

    redisClient.on('error', (err) => {
      const detail = err?.message || err?.code || String(err);
      console.error('[Redis] Error:', detail);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected to cache');
      isConnected = true;
    });

    await redisClient.connect();
  } catch (err) {
    const detail = err?.message || err?.code || String(err);
    console.error('[Redis] Connection failed:', detail);
    isConnected = false;
  }
}

// Rounds to 3 decimal places (~110 m) so nearby searches share the same cache bucket.
function roundCoord(coord) {
  return (Math.round(Number(coord) * 1000) / 1000).toFixed(3);
}

function getCacheKey(type, lat, lon, radius) {
  return `vendors:${type}:${roundCoord(lat)}:${roundCoord(lon)}:${radius}`;
}

async function getCachedVendors(type, lat, lon, radius) {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(getCacheKey(type, lat, lon, radius));
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('[Redis] get error:', err.message);
    return null;
  }
}

async function cacheVendors(type, lat, lon, radius, vendors) {
  if (!isConnected || !redisClient) return;
  try {
    const TTL = 7 * 24 * 60 * 60; // 7 days
    await redisClient.set(getCacheKey(type, lat, lon, radius), JSON.stringify(vendors), { EX: TTL });
  } catch (err) {
    console.error('[Redis] set error:', err.message);
  }
}

module.exports = { connectRedis, getCachedVendors, cacheVendors };
