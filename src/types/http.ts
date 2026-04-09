// // Minimal user type required by our PBAC library
// export interface AuthUser {
//   id: string;
//   userName: string;
//   roles: number[]; // AuthorizeRole enum values
//   claims: { type: string; value: string }[];
// }

// // Minimal request type
// export interface HttpRequest {
//   url?: string;
//   method?: string;
//   headers?: Record<string, string | string[] | undefined>;
//   user?: AuthUser; // populated by authentication middleware
// }

// // Minimal response type
// export interface HttpResponse {
//   statusCode: number;
//   setHeader(name: string, value: string): void;
//   end(body?: string): void;
// }
