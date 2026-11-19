import { randomUUID } from 'node:crypto';

import type { IdGenerator } from '../../application/contracts/id-generator';

export class NodeIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
