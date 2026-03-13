import Fastify from 'fastify';
// @ts-ignore
import * as cors from '@fastify/cors';
import monitorPlugin from './plugins/monitor';
import logsPlugin from './plugins/logs';
import alertsPlugin from './plugins/alerts';
import dbPlugin from './plugins/db';
import metricsRoutes from './routes/metrics';
import logsRoutes from './routes/logs';
import alertsRoutes from './routes/alerts';

const fastify = Fastify({
  logger: true
});

// Register CORS
fastify.register(cors, {
  origin: '*'
});

// Register Lume Plugins & Routes
fastify.register(dbPlugin);
fastify.register(monitorPlugin);
fastify.register(logsPlugin);
fastify.register(alertsPlugin);
fastify.register(metricsRoutes);
fastify.register(logsRoutes);
fastify.register(alertsRoutes);

// Basic Health Route
fastify.get('/health', async (request, reply) => {
  return { status: 'glow', timestamp: new Date().toISOString() };
});

// Initializing the server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Lume Backend is glowing at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
