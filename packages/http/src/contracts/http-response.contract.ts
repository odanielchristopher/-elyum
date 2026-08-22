/**
 * Framework-agnostic HTTP response abstraction
 *
 * Permite enviar respostas HTTP de forma agnóstica
 */
export interface HttpResponse<TRaw = unknown> {
  /**
   * Define status code HTTP
   * @example response.status(201).send(data)
   */
  status(code: number): this;

  /**
   * Envia resposta (auto-detecta content type)
   * @example response.send({ id: 1 }) // JSON
   * @example response.send('Hello') // text/plain
   */
  send(data: unknown): void | Promise<void>;

  /**
   * Envia resposta JSON
   * @example response.json({ success: true })
   */
  json(data: unknown): void | Promise<void>;

  /**
   * Define header individual
   * @example response.header('X-Custom', 'value')
   */
  header(key: string, value: string): this;

  /**
   * Define múltiplos headers
   * @example response.headers({ 'X-Custom': 'value', 'X-Another': 'value' })
   */
  headers(headers: Record<string, string>): this;

  /**
   * Define content type
   * @example response.type('application/json')
   */
  type(type: string): this;

  /**
   * Redireciona para URL
   * @example response.redirect('/login')
   */
  redirect(url: string, statusCode?: number): void | Promise<void>;

  /**
   * Verifica se resposta já foi enviada
   */
  isSent?(): boolean;

  /**
   * Raw response (framework-specific, use with caution)
   */
  raw?: TRaw;
}
