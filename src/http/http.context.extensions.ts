import { ServerResponse } from "http";

declare module "http" {
  interface ServerResponse {
    notfound(): void;
    challenge(): void;
    forbidden(): void;
    error(): void;
  }
}

ServerResponse.prototype.notfound = function () {
  this.statusCode = 404;
  this.end("Not Found");
};

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
