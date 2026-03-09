import fp from 'fastify-plugin';

export interface HealthMetric {
    name: string;
    status: 'optimal' | 'warning' | 'critical';
    value: number;
    lastChecked: string;
}

export default fp(async (fastify) => {
    // In-memory store for demo (should be TimescaleDB in production)
    const metrics: Map<string, HealthMetric> = new Map();

    // Initialize metrics
    metrics.set('bpt-app', {
        name: 'BPT Application',
        status: 'optimal',
        value: 100,
        lastChecked: new Date().toISOString()
    });

    metrics.set('outsystems-logs', {
        name: 'OutSystems Platform Logs',
        status: 'optimal',
        value: 5204,
        lastChecked: new Date().toISOString()
    });

    // Background monitoring loop
    const runMonitor = async () => {
        // 1. Monitor BPT Health
        const bpt = metrics.get('bpt-app')!;
        // Simulate slight fluctuation
        bpt.value = 98 + Math.random() * 2;
        bpt.lastChecked = new Date().toISOString();

        // 2. Simulate OutSystems Log Count
        const logs = metrics.get('outsystems-logs')!;
        logs.value = Math.floor(5000 + Math.random() * 500);
        logs.lastChecked = new Date().toISOString();

        // Persist metrics to TimescaleDB
        try {
            const { db } = fastify;
            const now = new Date();

            await db.query(
                'INSERT INTO metrics (time, name, status, value) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)',
                [
                    now, bpt.name, bpt.status, bpt.value,
                    now, logs.name, logs.status, logs.value
                ]
            );

            fastify.log.info('Lume Monitor: Metrics persisted to DB');
        } catch (err) {
            fastify.log.error('Lume Monitor: Failed to persist metrics', err);
        }
    };

    // Run every 10 seconds
    const interval = setInterval(runMonitor, 10000);

    fastify.decorate('lumeMetrics', {
        getAll: async () => {
            const { db } = fastify;
            // Get the latest values for each unique metric name
            const { rows } = await db.query(`
                SELECT DISTINCT ON (name) name, time as "lastChecked", status, value 
                FROM metrics 
                ORDER BY name, time DESC
            `);
            return rows;
        }
    });

    fastify.addHook('onClose', async () => {
        clearInterval(interval);
    });
});

// TypeScript decoration
declare module 'fastify' {
    interface FastifyInstance {
        lumeMetrics: {
            getAll: () => Promise<HealthMetric[]>;
        };
    }
}
