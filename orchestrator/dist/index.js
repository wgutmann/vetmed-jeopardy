import { config } from './config.js';
import { buildServer } from './server.js';
const main = async () => {
    const server = buildServer();
    try {
        await server.listen({ port: config.port, host: '0.0.0.0' });
        console.log(`Orchestrator listening on port ${config.port}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
main();
