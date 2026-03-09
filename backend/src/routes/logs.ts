import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
    fastify.get('/api/logs', async (request, reply) => {
        const { query, module, environment } = request.query as {
            query?: string;
            module?: string;
            environment?: string
        };

        return await fastify.lumeLogs.search(query, module, environment);
    });

    fastify.get('/api/logs/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const logs = await fastify.lumeLogs.search(id);
        const log = logs.find(l => l.id === id);

        if (!log) {
            return reply.code(404).send({ error: 'Log entry not found' });
        }
        return log;
    });
}
