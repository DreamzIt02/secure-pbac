import { ServerResponse } from "http";

declare module "http" {
  interface ServerResponse {
    challenge(): void;
    forbidden(): void;
    error(): void;
  }
}

ServerResponse.prototype.challenge = function () {
  this.statusCode = 401;
  this.setHeader("WWW-Authenticate", "Bearer");
  this.end("Unauthorized");
};

ServerResponse.prototype.forbidden = function () {
  this.statusCode = 403;
  this.setHeader("WWW-Authenticate", "Bearer");
  this.end("Forbidden");
};
