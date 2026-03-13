import fp from 'fastify-plugin';
import pg from 'pg';

export default fp(async (fastify) => {
    const connectionString = process.env.DATABASE_URL || 'postgres://lume_user:lume_pass@localhost:5432/lume_db';

    const pool = new pg.Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    // Test connection and initialize schema
    try {
        const client = await pool.connect();
        fastify.log.info('Lume Database: Connected to TimescaleDB');

        // Initialize Schema
        await client.query(`
      CREATE TABLE IF NOT EXISTS metrics (
        time TIMESTAMPTZ NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL
      );

      CREATE TABLE IF NOT EXISTS logs (
        time TIMESTAMPTZ NOT NULL,
        id TEXT PRIMARY KEY,
        module TEXT NOT NULL,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        stack_trace TEXT,
        environment TEXT NOT NULL
      );
    `);

        // Convert to hypertables (ignore error if already hypertable)
        try {
            await client.query("SELECT create_hypertable('metrics', 'time', if_not_exists => TRUE);");
            await client.query("SELECT create_hypertable('logs', 'time', if_not_exists => TRUE);");
            fastify.log.info('Lume Database: Hypertables initialized');
        } catch (e) {
            fastify.log.info('Lume Database: Hypertables already exist or skipped');
        }

        client.release();
    } catch (err: any) {
        fastify.log.error('Lume Database: Connection failed', err);
        // In production, we might want to exit, but for dev we let it retry or stay disconnected
    }

    fastify.decorate('db', pool);

    fastify.addHook('onClose', async (instance) => {
        await pool.end();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        db: pg.Pool;
    }
}
