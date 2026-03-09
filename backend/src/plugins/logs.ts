import fp from 'fastify-plugin';
import sql from 'mssql';

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

    // SQL Server Config for OutSystems OSLOG
    const sqlConfig: sql.config = {
        user: process.env.SQL_SERVER_USER || '',
        password: process.env.SQL_SERVER_PASSWORD || '',
        database: process.env.SQL_SERVER_DATABASE || '',
        server: process.env.SQL_SERVER_HOST || '',
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
        options: { encrypt: true, trustServerCertificate: true }
    };

    let sqlPool: sql.ConnectionPool | null = null;
    const isSQLConfigured = sqlConfig.server && !sqlConfig.server.includes('your-sql-server');

    if (isSQLConfigured) {
        try {
            sqlPool = await new sql.ConnectionPool(sqlConfig).connect();
            fastify.log.info('Lume Logs: Connected to OS SQL Server');
        } catch (err) {
            fastify.log.error('Lume Logs: OS SQL Server connection failed', err);
        }
    }

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
            // Priority: SQL Server (Real data) -> TimescaleDB (Historical/Fallback)
            if (sqlPool && sqlPool.connected) {
                try {
                    const request = sqlPool.request();
                    let sqlQuery = 'SELECT TOP 100 Instant as time, Id as id, Module_Name as module, Entry_Level as level, Message as message, Environment_Name as environment FROM OSLOG_General WHERE 1=1';

                    if (query) {
                        request.input('query', sql.VarChar, `%${query}%`);
                        sqlQuery += ' AND (Message LIKE @query OR Id LIKE @query)';
                    }
                    if (module) {
                        request.input('module', sql.VarChar, module);
                        sqlQuery += ' AND Module_Name = @module';
                    }

                    sqlQuery += ' ORDER BY Instant DESC';
                    const result = await request.query(sqlQuery);
                    return result.recordset.map(r => ({ ...r, timestamp: r.time, level: r.level || 'Error' }));
                } catch (err) {
                    fastify.log.error('Lume Logs: SQL Server query failed, falling back to TimescaleDB', err);
                }
            }

            // Fallback to TimescaleDB
            let sqlText = 'SELECT * FROM logs WHERE 1=1';
            const params: any[] = [];

            if (query) {
                params.push(`%${query}%`);
                sqlText += ` AND (message ILIKE $${params.length} OR id ILIKE $${params.length})`;
            }
            if (module) {
                params.push(module);
                sqlText += ` AND module = $${params.length}`;
            }
            if (environment) {
                params.push(environment);
                sqlText += ` AND environment = $${params.length}`;
            }

            sqlText += ' ORDER BY time DESC LIMIT 100';

            const { rows } = await db.query(sqlText, params);
            return rows.map(r => ({ ...r, timestamp: r.time }));
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
