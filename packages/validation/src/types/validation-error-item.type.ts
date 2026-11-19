/**
 * Representa um erro de validação individual em um campo
 */
export type ValidationErrorItem = {
  /** Caminho do campo com erro (ex: 'email', 'address.city', 'tags[0]') */
  field: string;

  /** Mensagem de erro descritiva */
  message: string;

  /** Código do erro (opcional, para i18n) */
  code?: string | undefined;

  /** @deprecated Adapters must never store raw input here. */
  received?: unknown | undefined;

  /** Valor esperado (opcional) */
  expected?: unknown | undefined;
};
