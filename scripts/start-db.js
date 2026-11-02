const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');
const net = require('net');

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
  const inUse = await isPortInUse(5432);
  if (inUse) {
    console.log('Port 5432 is already in use. Assuming PostgreSQL is already running.');
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
