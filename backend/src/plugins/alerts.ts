import fp from 'fastify-plugin';

export interface Alert {
    id: string;
    type: 'PREDICTIVE' | 'CRITICAL' | 'WARNING';
    message: string;
    timestamp: string;
    confidence: number;
}

export default fp(async (fastify) => {
    const alerts: Alert[] = [
        {
            id: 'ALT-001',
            type: 'PREDICTIVE',
            message: 'Increasing pattern of "Database Timeout" errors detected in BPT_Engine. Possible indexing issue.',
            timestamp: new Date().toISOString(),
            confidence: 0.85
        }
    ];

    // Simple pattern detection simulation
    const checkPatterns = () => {
        const logs = fastify.lumeLogs.search();
        const recentErrors = logs.filter(l =>
            l.level === 'Error' &&
            new Date(l.timestamp).getTime() > Date.now() - 1000 * 60 * 60
        );

        if (recentErrors.length > 10) {
            alerts.push({
                id: `ALT-${Date.now()}`,
                type: 'CRITICAL',
                message: `High frequency of errors (${recentErrors.length} in last hour) detected in ${recentErrors[0].module}.`,
                timestamp: new Date().toISOString(),
                confidence: 0.95
            });
        }
    };

    const interval = setInterval(checkPatterns, 30000);

    fastify.decorate('lumeAlerts', {
        getAll: () => alerts
    });

    fastify.addHook('onClose', async () => {
        clearInterval(interval);
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        lumeAlerts: {
            getAll: () => Alert[];
        };
    }
}
