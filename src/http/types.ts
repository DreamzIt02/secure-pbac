// Minimal user type required by our PBAC library
export interface AuthUser {
  id: string;
  userName: string;
  roles: string[];
  claims: { type: string; value: string }[];
}

// Minimal request type
export interface HttpRequest<TUser extends AuthUser = any> {
  url?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: TUser; // populated by authentication middleware
}

// Minimal response type
export interface HttpResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}


/// <summary>
/// Placeholder types for symmetry.
/// </summary>
export interface IHttpContextAccessor<TContext = any> { httpContext?: TContext; }
