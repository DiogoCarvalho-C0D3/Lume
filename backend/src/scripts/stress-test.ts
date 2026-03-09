import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://lume_user:lume_pass@localhost:5432/lume_db';
const pool = new pg.Pool({ connectionString });

async function stress() {
    console.log('🚀 Starting Lume Stress Test...');
    const poolClient = await pool.connect();

    const modules = ['BPT_Engine', 'UserManagement', 'AuthService', 'SyncModule', 'Core_API'];
    const levels = ['Error', 'Warning', 'Info'];

    let count = 0;
    const startTime = Date.now();

    const insert = async () => {
        const now = new Date();
        const id = `STRESS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const module = modules[Math.floor(Math.random() * modules.length)];
        const level = levels[Math.floor(Math.random() * levels.length)];

        await poolClient.query(
            'INSERT INTO logs (time, id, module, level, message, environment, stack_trace) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [now, id, module, level, `Stress test log entry #${count}`, 'Production', 'at Lume.StressTest.Execute...']
        );
        count++;

        if (count % 100 === 0) {
            console.log(`📡 Injected ${count} logs...`);
        }
    };

    // Run for 30 seconds at ~50 EPS
    const interval = setInterval(insert, 20);

    setTimeout(async () => {
        clearInterval(interval);
        const duration = (Date.now() - startTime) / 1000;
        console.log(`✅ Stress test complete! Injected ${count} logs in ${duration.toFixed(2)}s.`);
        console.log(`📊 Average EPS: ${(count / duration).toFixed(2)}`);
        poolClient.release();
        await pool.end();
        process.exit(0);
    }, 30000);
}

stress().catch(console.error);
