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

    // OutSystems API Consumer logic
    const fetchPerformanceMetrics = async () => {
        const baseUrl = process.env.OS_API_BASE_URL;
        if (!baseUrl || baseUrl.includes('your-outsystems-server')) {
            return null; // Stick to mocks if not configured
        }

        try {
            const endpoint = `${baseUrl}/PerformanceProbe/rest/PerformanceMonitoringAPI/RequestEvents/`;
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${process.env.OS_API_USERNAME}:${process.env.OS_API_PASSWORD}`).toString('base64')}`
                }
            });

            if (!response.ok) throw new Error(`OS API status: ${response.status}`);

            const data = await response.json() as any[];
            // Calculate integrity based on request success rate or presence of data
            return {
                value: data.length > 0 ? 99.5 : 100, // Placeholder calculation
                status: 'optimal' as const
            };
        } catch (err) {
            fastify.log.error('Lume Monitor: OS Performance API call failed', err);
            return null;
        }
    };

    // Background monitoring loop
    const runMonitor = async () => {
        const osPerformance = await fetchPerformanceMetrics();

        // 1. Monitor BPT Health
        const bpt = metrics.get('bpt-app')!;
        if (osPerformance) {
            bpt.value = osPerformance.value;
            bpt.status = osPerformance.status;
        } else {
            // Simulate slight fluctuation (Mock fallback)
            bpt.value = 98 + Math.random() * 2;
        }
        bpt.lastChecked = new Date().toISOString();

        // 2. Simulate OutSystems Log Count (Placeholder for SQL Server integration)
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
