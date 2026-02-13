/**
 * Tipo primitivo TypeScript
 */
export type PrimitiveType = 'string' | 'number' | 'boolean' | 'object';

/**
 * Coerce valor para tipo esperado
 *
 * Converte strings para números, booleans, etc
 */
export function coerceValue(value: any, targetType: PrimitiveType): any {
  if (value === undefined || value === null) {
    return value;
  }

  switch (targetType) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? value : num;

    case 'boolean':
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);

    case 'string':
      return String(value);

    case 'object':
      // Se já é objeto, retorna como está
      if (typeof value === 'object') return value;

      // Tenta parsear JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }

    default:
      return value;
  }
}
