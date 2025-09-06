const { createClient } = require('redis');

// Cache statistics
let stats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  averageResponseTime: 0,
  startTime: Date.now(),
};

let client;
let isConnected = false;

async function connectToRedis(maxRetries = 10, delay = 2000) {
  client = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
    }
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
    isConnected = false;
  });

  client.on('connect', () => {
    console.log('🔗 Connecting to Redis...');
  });

  client.on('ready', () => {
    console.log('✅ Successfully connected to Redis');
    isConnected = true;
  });

  client.on('end', () => {
    console.log('📴 Redis connection ended');
    isConnected = false;
  });

  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect();
      return;
    } catch (err) {
      console.log(`⏳ Waiting for Redis... Attempt ${i + 1}/${maxRetries}`);
      if (i === maxRetries - 1) {
        console.error('❌ Failed to connect to Redis after maximum retries:', err.message);
        console.log('🔄 Application will continue without caching');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function get(key) {
  if (!isConnected || !client) {
    return null;
  }
  
  try {
    const value = await client.get(key);
    if (value) {
      stats.cacheHits++;
      console.log(`🎯 Cache HIT: ${key}`);
      return JSON.parse(value);
    } else {
      stats.cacheMisses++;
      console.log(`💫 Cache MISS: ${key}`);
      return null;
    }
  } catch (error) {
    console.error('Cache GET error:', error);
    stats.cacheMisses++;
    return null;
  }
}

async function set(key, value, ttl = 60) {
  if (!isConnected || !client) {
    return false;
  }

  try {
    const serializedValue = JSON.stringify(value);
    await client.setEx(key, ttl, serializedValue);
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error('Cache SET error:', error);
    return false;
  }
}

async function del(key) {
  if (!isConnected || !client) {
    return false;
  }

  try {
    const result = await client.del(key);
    console.log(`🗑️  Cache DELETE: ${key} (deleted: ${result})`);
    return result > 0;
  } catch (error) {
    console.error('Cache DELETE error:', error);
    return false;
  }
}

async function delPattern(pattern) {
  if (!isConnected || !client) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    
    const result = await client.del(keys);
    console.log(`🧹 Cache DELETE pattern: ${pattern} (deleted: ${result} keys)`);
    return result;
  } catch (error) {
    console.error('Cache DELETE pattern error:', error);
    return 0;
  }
}

async function getAllKeys() {
  if (!isConnected || !client) {
    return [];
  }

  try {
    return await client.keys('*');
  } catch (error) {
    console.error('Cache KEYS error:', error);
    return [];
  }
}

async function flushAll() {
  if (!isConnected || !client) {
    return false;
  }

  try {
    await client.flushAll();
    console.log('🧽 Cache FLUSH ALL');
    return true;
  } catch (error) {
    console.error('Cache FLUSH error:', error);
    return false;
  }
}

// Cache middleware factory
function createCacheMiddleware(keyGenerator, ttl = 60) {
  return async (req, res, next) => {
    const startTime = Date.now();
    stats.totalRequests++;

    const key = keyGenerator(req);
    
    // Try to get from cache
    const cachedData = await get(key);
    if (cachedData) {
      const responseTime = Date.now() - startTime;
      updateAverageResponseTime(responseTime);
      
      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time', `${responseTime}ms`);
      return res.json(cachedData);
    }

    // Cache miss - set up response caching
    res.set('X-Cache', 'MISS');
    
    // Store original res.json
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Cache successful responses only
      if (res.statusCode === 200) {
        set(key, data, ttl).catch(console.error);
      }
      
      const responseTime = Date.now() - startTime;
      updateAverageResponseTime(responseTime);
      res.set('X-Response-Time', `${responseTime}ms`);
      
      return originalJson(data);
    };

    next();
  };
}

// Key generators
const keyGenerators = {
  notesList: () => 'notes:list',
  singleNote: (req) => `notes:${req.params.id}`,
  notesPattern: () => 'notes:*'
};

// Cache invalidation helper
async function invalidateNotesCache(noteId = null) {
  const promises = [];
  
  // Always invalidate the list cache
  promises.push(del(keyGenerators.notesList()));
  
  // Invalidate specific note if ID provided
  if (noteId) {
    promises.push(del(keyGenerators.singleNote({ params: { id: noteId } })));
  }
  
  await Promise.all(promises);
}

function updateAverageResponseTime(responseTime) {
  const alpha = 0.1; // Exponential moving average factor
  stats.averageResponseTime = stats.averageResponseTime === 0 
    ? responseTime 
    : (alpha * responseTime) + ((1 - alpha) * stats.averageResponseTime);
}

function getConnectionStatus() {
  return isConnected;
}

function getStats() {
  const uptime = Date.now() - stats.startTime;
  const hitRate = stats.totalRequests > 0 
    ? ((stats.cacheHits / stats.totalRequests) * 100).toFixed(2)
    : 0;

  return {
    ...stats,
    hitRate: `${hitRate}%`,
    uptime: `${Math.round(uptime / 1000)}s`,
    connected: isConnected,
    averageResponseTime: `${Math.round(stats.averageResponseTime)}ms`
  };
}

async function getKeyCount() {
  const keys = await getAllKeys();
  return keys.length;
}

module.exports = {
  connectToRedis,
  get,
  set,
  del,
  delPattern,
  getAllKeys,
  flushAll,
  createCacheMiddleware,
  keyGenerators,
  invalidateNotesCache,
  getConnectionStatus,
  getStats,
  getKeyCount,
  client: () => client
};