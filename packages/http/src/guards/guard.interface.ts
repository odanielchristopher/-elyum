/**
 * Interface para Guards
 *
 * Guards controlam acesso a rotas
 *
 * @example
 * @Injectable()
 *
 * class AuthGuard implements Guard {
 *
 *   constructor(private authService: AuthService) {}
 *
 *   async canActivate(): Promise<boolean> {
 *
 *     const request = HttpExecutionContext.getRequest();
 *
 *     const token = request.headers.authorization;
 *
 *     if (!token) return false;
 *
 *     const user = await this.authService.validateToken(token);
 *
 *     if (!user) return false;
 *
 *     // Armazenar user no context para uso no handler
 *
 *     HttpExecutionContext.set('user', user);
 *
 *     return true;
 *   }
 * }
 */
export interface Guard {
  /**
   * Determina se request pode prosseguir
   *
   * @returns true para permitir, false para negar
   * @throws Pode lançar exceção para retornar erro customizado
   */
  canActivate(): boolean | Promise<boolean>;
}
