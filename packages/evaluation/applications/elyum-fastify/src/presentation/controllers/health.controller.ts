import { Get } from '@elyum/http';

@Get('/health')
export class HealthController {
  execute() {
    return { status: 'ok', version: '0.1.0' };
  }
}
