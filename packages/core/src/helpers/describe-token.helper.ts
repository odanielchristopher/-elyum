import { InjectionToken } from '../types';

export function describeToken(token: InjectionToken): string {
  if (typeof token === 'string') {
    return token;
  }

  if (typeof token === 'symbol') {
    return token.description
      ? `Symbol(${token.description})`
      : token.toString();
  }

  if (typeof token === 'function') {
    return token.name || '[Anonymous Class]';
  }

  return '[Unknown Token]';
}
