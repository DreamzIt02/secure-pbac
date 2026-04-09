# 📁 Adapters

This document provides framework‑specific adapters for **Policy‑Based Access Control (PBAC)** using the unified `requirePolicy` core. It covers **backend frameworks** (Express, NestJS, Fastify, Koa, Hapi) and **frontend frameworks** (Angular, React, Next.js, Vue, SvelteKit).  

---

## 🔹 Backend Adapters

### 📁 Express Adapter

```ts
import { Request, Response, NextFunction } from 'express';
import { requirePolicy } from '../middleware/policyMiddleware';
import { PolicyEnum } from '../policies';
import { IUser } from '../services/policy_authorization.service';

export function expressRequirePolicy(requiredPolicies: PolicyEnum[], checkDefault = false) {
  const coreMiddleware = requirePolicy(requiredPolicies, checkDefault);

  return (req: Request, res: Response, next: NextFunction) => {
    const httpReq = { url: req.url, method: req.method, headers: req.headers, user: req.user };
    const httpRes = { statusCode: res.statusCode, setHeader: res.setHeader.bind(res), end: res.end.bind(res) };
    return coreMiddleware(httpReq, httpRes, next);
  };
}

export function expressAdapter(req: Request): IUser {
  return {
    id: req.user?.id || '',
    userName: req.user?.username || '',
    roles: req.user?.roles || [],
    claims: req.user?.claims || [],
  };
}

export function expressFilter(filterFn: (user: IUser) => Promise<boolean>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = expressAdapter(req);
    const authorized = await filterFn(user);
    if (authorized) return next();
    res.status(403).send('Forbidden');
  };
}

```

Usage:

```ts
import { authorizeAdminGroup } from '../services/policy_authorization.service';
app.get('/admin', expressRequirePolicy([PolicyEnum.SiteActingAdmin]), (req, res) => {
  res.json({ message: 'Admin dashboard' });
});

app.get('/admin', expressFilter(authorizeAdminGroup), (req, res) => {
  res.send('Welcome Admin');
});
```

---

## 📁 src/di/express_authorization.ts

```ts
import { AuthorizationExtensions } from './authorization_extensions';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../services/policy_authorization.service';

/**
 * Convert Express request into IUser
 */
function expressAdapter(req: Request): IUser {
  return {
    id: req.user?.id || '',
    userName: req.user?.username || '',
    roles: req.user?.roles || [],
    claims: req.user?.claims || [],
  };
}

/**
 * Register policies as Express middleware
 */
export function registerExpressPolicies(app: any) {
  const policies = AuthorizationExtensions.addPolicyAuthorization();

  policies.forEach(policy => {
    app.use(`/policy/${policy.name}`, async (req: Request, res: Response, next: NextFunction) => {
      const user = expressAdapter(req);

      // Check roles
      if (policy.requiredRoles && !policy.requiredRoles.some(r => user.roles.includes(r))) {
        return res.status(403).send('Forbidden: missing role');
      }

      // Check claims
      if (policy.requiredClaims) {
        const hasClaim = user.claims.some(c => c.type === policy.requiredClaims?.type);
        if (!hasClaim) {
          return res.status(403).send('Forbidden: missing claim');
        }
      }

      return next();
    });
  });
}
```

---

### 🔹 Usage Express

```ts
import express from 'express';
import { registerExpressPolicies } from './di/express_authorization';

const app = express();
registerExpressPolicies(app);

app.get('/policy/SiteAdmin', (req, res) => {
  res.send('Welcome SiteAdmin');
});
```

---

### 📁 NestJS Guard Adapter

```ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { requirePolicy } from '../middleware/policyMiddleware';
import { PolicyEnum } from '../policies';
import { IUser } from '../services/policy_authorization.service';

export const POLICY_KEY = 'policies';
export const RequirePolicies = (policies: PolicyEnum[], checkDefault = false) =>
  Reflect.metadata(POLICY_KEY, { policies, checkDefault });

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { policies, checkDefault } =
      this.reflector.get<{ policies: PolicyEnum[]; checkDefault: boolean }>(POLICY_KEY, context.getHandler()) ||
      { policies: [], checkDefault: false };

    if (!policies.length) return true;

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const httpReq = { url: req.url, method: req.method, headers: req.headers, user: req.user };
    const httpRes = { statusCode: res.statusCode, setHeader: res.setHeader.bind(res), end: res.end.bind(res) };

    const coreMiddleware = requirePolicy(policies, checkDefault);

    try {
      await coreMiddleware(httpReq, httpRes);
      return true;
    } catch {
      throw new ForbiddenException('Forbidden: insufficient policy authorization');
    }
  }
}

function nestAdapter(context: ExecutionContext): IUser {
  const req = context.switchToHttp().getRequest();
  return {
    id: req.user?.id || '',
    userName: req.user?.username || '',
    roles: req.user?.roles || [],
    claims: req.user?.claims || [],
  };
}

@Injectable()
export class NestFilter implements CanActivate {
  constructor(private readonly filterFn: (user: IUser) => Promise<boolean>) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = nestAdapter(context);
    return this.filterFn(user);
  }
}
```

Usage:

```ts
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @RequirePolicies([PolicyEnum.SiteActingAdmin])
  @UseGuards(PolicyGuard)
  getDashboard() {
    return { message: 'Welcome to the admin dashboard!' };
  }
}
```

---

## 📁 src/di/nest_authorization.ts

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthorizationExtensions } from './authorization_extensions';
import { IUser } from '../services/policy_authorization.service';

function nestAdapter(context: ExecutionContext): IUser {
  const req = context.switchToHttp().getRequest();
  return {
    id: req.user?.id || '',
    userName: req.user?.username || '',
    roles: req.user?.roles || [],
    claims: req.user?.claims || [],
  };
}

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private readonly policyName: string) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = nestAdapter(context);
    const policies = AuthorizationExtensions.addPolicyAuthorization();
    const policy = policies.find(p => p.name === this.policyName);

    if (!policy) return false;

    if (policy.requiredRoles && !policy.requiredRoles.some(r => user.roles.includes(r))) {
      return false;
    }

    if (policy.requiredClaims) {
      const hasClaim = user.claims.some(c => c.type === policy.requiredClaims?.type);
      if (!hasClaim) return false;
    }

    return true;
  }
}
```

---

### Usage NestJS

```ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { PolicyGuard } from './di/nest_authorization';

@Controller('admin')
export class AdminController {
  @Get()
  @UseGuards(new PolicyGuard('SiteAdmin'))
  getAdmin() {
    return 'Welcome SiteAdmin';
  }
}
```

---

### 📁 Fastify Plugin

```ts
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requirePolicy } from '../middleware/policyMiddleware';
import { PolicyEnum } from '../policies';
import { HttpRequest, HttpResponse } from '../types/http';
import { IUser } from '../services/policy_authorization.service';

export const fastifyPolicyPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate('requirePolicy', (policies: PolicyEnum[], checkDefault = false) =>
    async (req: FastifyRequest, reply: FastifyReply) => {
      const httpReq: HttpRequest = { url: req.url, method: req.method, headers: req.headers, user: (req as any).user };
      const httpRes: HttpResponse = {
        statusCode: reply.statusCode,
        setHeader: reply.header.bind(reply),
        end: (body?: string) => (body ? reply.send(body) : reply.send()),
      };
      const coreMiddleware = requirePolicy(policies, checkDefault);
      await coreMiddleware(httpReq, httpRes, () => {});
    }
  );
});

export function fastifyAdapter(req: FastifyRequest): IUser {
  return {
    id: req.user?.id || '',
    userName: req.user?.username || '',
    roles: req.user?.roles || [],
    claims: req.user?.claims || [],
  };
}

export function fastifyFilter(filterFn: (user: IUser) => Promise<boolean>) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const user = fastifyAdapter(req);
    const authorized = await filterFn(user);
    if (!authorized) {
      reply.code(403).send('Forbidden');
    }
  };
}

```

---

### 📁 Koa Adapter

```ts
import { Context, Next } from 'koa';
import { requirePolicy } from '../middleware/policyMiddleware';
import { PolicyEnum } from '../policies';
import { HttpRequest, HttpResponse } from '../types/http';
import { IUser } from '../services/policy_authorization.service';

export function koaRequirePolicy(requiredPolicies: PolicyEnum[], checkDefault = false) {
  const coreMiddleware = requirePolicy(requiredPolicies, checkDefault);

  return async (ctx: Context, next: Next) => {
    const httpReq: HttpRequest = { url: ctx.request.url, method: ctx.request.method, headers: ctx.request.headers, user: ctx.state.user };
    const httpRes: HttpResponse = { statusCode: ctx.status, setHeader: ctx.set.bind(ctx), end: (body?: string) => { ctx.body = body || ''; } };
    await coreMiddleware(httpReq, httpRes, async () => { await next(); });
  };
}

export function koaAdapter(ctx: Context): IUser {
  return {
    id: ctx.state.user?.id || '',
    userName: ctx.state.user?.username || '',
    roles: ctx.state.user?.roles || [],
    claims: ctx.state.user?.claims || [],
  };
}

export function koaFilter(filterFn: (user: IUser) => Promise<boolean>) {
  return async (ctx: Context, next: Next) => {
    const user = koaAdapter(ctx);
    const authorized = await filterFn(user);
    if (authorized) return next();
    ctx.status = 403;
    ctx.body = 'Forbidden';
  };
}

```

---

### 📁 Hapi Adapter

```ts
import { Request, ResponseToolkit } from '@hapi/hapi';
import { requirePolicy } from '../middleware/policyMiddleware';
import { PolicyEnum } from '../policies';
import { HttpRequest, HttpResponse } from '../types/http';
import { IUser } from '../services/policy_authorization.service';

export function hapiRequirePolicy(requiredPolicies: PolicyEnum[], checkDefault = false) {
  const coreMiddleware = requirePolicy(requiredPolicies, checkDefault);

  return async (req: Request, h: ResponseToolkit) => {
    const httpReq: HttpRequest = { url: req.url.pathname, method: req.method.toUpperCase(), headers: req.headers, user: (req.auth as any).credentials?.user };
    const httpRes: HttpResponse = {
      statusCode: 200,
      setHeader: (name, value) => h.response().header(name, value),
      end: (body?: string) => h.response(body || '').code(403).takeover(),
    };
    await coreMiddleware(httpReq, httpRes);
    return h.continue;
  };
}

export function hapiAdapter(req: Request): IUser {
  return {
    id: req.auth.credentials?.id || '',
    userName: req.auth.credentials?.username || '',
    roles: req.auth.credentials?.roles || [],
    claims: req.auth.credentials?.claims || [],
  };
}

export function hapiFilter(filterFn: (user: IUser) => Promise<boolean>) {
  return async (req: Request, h: ResponseToolkit) => {
    const user = hapiAdapter(req);
    const authorized = await filterFn(user);
    if (!authorized) {
      return h.response('Forbidden').code(403).takeover();
    }
    return h.continue;
  };
}

```

---

## 🔹 Frontend Adapters

### 📁 Angular (Route Guard)

```ts
@Injectable({ providedIn: 'root' })
export class PolicyGuard implements CanActivate {
  constructor(private router: Router, private policyService: PolicyAuthorizationService) {}

  async canActivate(): Promise<boolean> {
    const user = (window as any).currentUser;
    const result = await this.policyService.authorizeAsync(user, [PolicyEnum.SiteActingAdmin]);
    if (!result.succeeded) {
      this.router.navigate(['/forbidden']);
      return false;
    }
    return true;
  }
}
```

---

### 📁 React (Higher-Order Component)

```tsx
export function withPolicy(Component: React.ComponentType, requiredPolicies: PolicyEnum[]) {
  return (props: any) => {
    const user = (window as any).currentUser;
    const [authorized, setAuthorized] = React.useState(false);

    React.useEffect(() => {
      policyService.authorizeAsync(user, requiredPolicies).then(result => setAuthorized(result.succeeded));
    }, []);

    if (!authorized) return <div>Forbidden</div>;
    return <Component {...props} />;
  };
}
```

---

### 📁 Next.js (Middleware)

```ts
export async function middleware(req: NextRequest) {
  const user = (req as any).user;
  const result = await policyService.authorizeAsync(user, [PolicyEnum.SiteActingAdmin]);
  if (!result.succeeded) return NextResponse.redirect(new URL('/forbidden', req.url));
  return NextResponse.next();
}
```

---

### 📁 Vue.js (Navigation Guard)

```ts
export function vueRequirePolicy(to: any, from: any, next: any) {
  const requiredPolicies: PolicyEnum[] = to.meta?.policies || [];
  const user = (window as any).currentUser;
  policyService.authorizeAsync(user, requiredPolicies).then(result => {
    if (result.succeeded) next();
    else next('/forbidden');
  });
}
```

---

### 📁 SvelteKit (Hooks)

```ts
export function svelteRequirePolicy(requiredPolicies: PolicyEnum[], checkDefault = false): Handle {
  return async ({ event, resolve }) => {
    const user = event.locals.user;
    const result = await policyService.authorizeAsync(user, requiredPolicies, checkDefault);
    if (!result.succeeded) return new Response('Forbidden', { status: 403 });
    return resolve(event);
  };
}
```

---

## 🔹 Generic Adapter Factories

- **Backend**: `createPolicyAdapter(framework, policies)` → Express, Koa, Fastify, Hapi.  
- **Frontend**: `createFrontendPolicyAdapter(framework, policies)` → Angular, React, Vue, Next.js, SvelteKit.  

Both factories wrap the same `requirePolicy` core, ensuring **one unified PBAC enforcement layer** across all major frameworks.

---
