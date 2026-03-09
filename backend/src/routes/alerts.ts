import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
    fastify.get('/api/alerts', async (request, reply) => {
        return fastify.lumeAlerts.getAll();
    });
}
