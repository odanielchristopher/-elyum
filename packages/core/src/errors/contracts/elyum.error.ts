import { ErrorCode } from 'src/enums/error-code.enum';

export abstract class ElyumError extends Error {
  abstract readonly code: ErrorCode;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
