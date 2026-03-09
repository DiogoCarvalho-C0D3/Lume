import Fastify from 'fastify';
import cors from '@fastify/cors';
import monitorPlugin from './plugins/monitor.js';
import logsPlugin from './plugins/logs.js';
import alertsPlugin from './plugins/alerts.js';
import dbPlugin from './plugins/db.js';
import metricsRoutes from './routes/metrics.js';
import logsRoutes from './routes/logs.js';
import alertsRoutes from './routes/alerts.js';

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
