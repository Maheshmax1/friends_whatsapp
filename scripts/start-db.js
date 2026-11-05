const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const net = require('net');
const fs = require('fs');

// Load .env if present
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        tester.once('close', () => resolve(false)).close();
      })
      .listen(port);
  });
}

async function start() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    console.log('[DB] Remote cloud database configured in DATABASE_URL (e.g. Supabase). Skipping local PostgreSQL.');
    // Keep alive as a dummy service so concurrently doesn't terminate with -k
    setInterval(() => {}, 60000);
    return;
  }

  const inUse = await isPortInUse(5432);
  if (inUse) {
    console.log('[DB] Port 5432 is already in use. Assuming PostgreSQL is already running.');
    setInterval(() => {}, 60000);
    return;
  }

  const dbDir = path.resolve(__dirname, '..', '.db_data');
  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'chat_user',
    password: 'chat_password',
    port: 5432,
    persistent: true,
    autoRehydrateSymlinks: true,
  });

  console.log('[DB] Initialising embedded PostgreSQL cluster...');
  try {
    await pg.initialise();
  } catch (err) {
    // If already initialised, ignore error
  }

  console.log('[DB] Starting PostgreSQL on port 5432...');
  await pg.start();

  try {
    await pg.createDatabase('chat_db');
  } catch (err) {
    // ignore if already exists
  }

  console.log('[DB] PostgreSQL is running and ready on port 5432 (database: chat_db)');

  const shutdown = async () => {
    console.log('\n[DB] Stopping PostgreSQL...');
    try {
      await pg.stop();
    } catch (e) {}
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process alive
  setInterval(() => {}, 10000);
}

start().catch((err) => {
  console.error('[DB] Failed to start database:', err);
  process.exit(1);
});
