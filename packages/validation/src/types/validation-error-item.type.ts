/**
 * Representa um erro de validação individual em um campo
 */
export type ValidationErrorItem = {
  /** Caminho do campo com erro (ex: 'email', 'address.city', 'tags[0]') */
  field: string;

  /** Mensagem de erro descritiva */
  message: string;

  /** Código do erro (opcional, para i18n) */
  code?: string;

  /** Valor que falhou na validação (opcional) */
  received?: unknown;

  /** Valor esperado (opcional) */
  expected?: unknown;
};
