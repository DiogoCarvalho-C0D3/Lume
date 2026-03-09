import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
    fastify.get('/api/metrics', async (request, reply) => {
        return await fastify.lumeMetrics.getAll();
    });
}
