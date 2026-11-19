import { startApplication } from './index';

void startApplication({
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3000),
  logger: true,
})
  .then((app) => {
    const shutdown = () => {
      void app.close();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  })
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
