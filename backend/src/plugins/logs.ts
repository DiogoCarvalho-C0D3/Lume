import fp from 'fastify-plugin';

export interface LogEntry {
    id: string;
    timestamp: string;
    module: string;
    message: string;
    stackTrace: string;
    environment: string;
    level: 'Error' | 'Warning' | 'Info';
}

export default fp(async (fastify) => {
    const { db } = fastify;

    // Initial Seed for Showcase (if table is empty)
    const seedLogs = async () => {
        const { rows } = await db.query('SELECT count(*) FROM logs');
        if (parseInt(rows[0].count) > 0) return;

        const modules = ['BPT_Engine', 'UserManagement', 'AuthService', 'SyncModule'];
        const environments = ['Production', 'Staging', 'Development'];
        const errors = [
            'Connection timeout in database query',
            'Unauthorized access attempt to /api/admin',
            'Null reference exception in BPT request handler',
            'Worker process terminated unexpectedly',
            'Invalid token format in Authorization header'
        ];

        for (let i = 0; i < 50; i++) {
            const time = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7);
            const level = Math.random() > 0.8 ? 'Warning' : 'Error';
            const module = modules[Math.floor(Math.random() * modules.length)];
            const message = errors[Math.floor(Math.random() * errors.length)];

            await db.query(
                'INSERT INTO logs (time, id, module, level, message, environment, stack_trace) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [time, `LOG-${1000 + i}`, module, level, message, environments[Math.floor(Math.random() * environments.length)], 'at OutSystems.HubEdition...']
            );
        }
        fastify.log.info('Lume Logs: Seeding complete');
    };

    seedLogs().catch(err => fastify.log.error('Lume Logs: Seeding failed', err));

    fastify.decorate('lumeLogs', {
        search: async (query?: string, module?: string, environment?: string) => {
            let sql = 'SELECT * FROM logs WHERE 1=1';
            const params: any[] = [];

            if (query) {
                params.push(`%${query}%`);
                sql += ` AND (message ILIKE $${params.length} OR id ILIKE $${params.length})`;
            }
            if (module) {
                params.push(module);
                sql += ` AND module = $${params.length}`;
            }
            if (environment) {
                params.push(environment);
                sql += ` AND environment = $${params.length}`;
            }

            sql += ' ORDER BY time DESC LIMIT 100';

            const { rows } = await db.query(sql, params);
            return rows.map(r => ({ ...r, timestamp: r.time })); // Map fields for frontend compatibility
        }
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        lumeLogs: {
            search: (query?: string, module?: string, environment?: string) => Promise<LogEntry[]>;
        };
    }
}
