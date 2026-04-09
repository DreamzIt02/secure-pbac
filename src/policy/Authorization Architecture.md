# Authorization System Architecture

## Overview

This is a **single middleware, multiple implementations** pattern:

- **One middleware** processes all decorated routes
- **One factory** maps requirement types to implementations
- **N implementations** handle specific authorization logic
- **One interface** ensures consistent contracts

---

## How It Works

### 1. Decorators Attach Requirements

```typescript
@Controller('/admin')
export class AdminController {
  @Get('/dashboard')
  @PoliciesAuthorization(GroupPolicyEnum.SiteAdmin)  // ← Creates requirement
  @PolicyClaimsAuthorization([AdminClaim])            // ← Creates requirement
  async getDashboard() {
    return { page: 'admin' };
  }
}
```

Result: `getDashboard.__requirements = [PoliciesAuthorizationRequirement, PolicyClaimsAuthorizationRequirement]`

### 2. Middleware Discovers Requirements

```typescript
export function authorizationMiddleware(factory: AuthorizationImplementationFactory) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const handler = getRouteHandler(req);
    
    if (!handler || !handler.__requirements) {
      return next(); // No decorators
    }

    const context = new HttpContext(req, res);
    
    // Loop all requirements
    for (const requirement of handler.__requirements) {
      // Factory creates the right impl
      const impl = factory.createImplementation(requirement);
      
      // Run impl
      await impl.onResourceExecutionAsync(context, () => Promise.resolve());
      
      if (res.statusCode === 401) return;
    }
    
    next();
  };
}
```

### 3. Factory Routes to Implementation

```typescript
export class AuthorizationImplementationFactory {
  createImplementation(requirement: any): IAuthorizationImplementation {
    if (requirement instanceof PolicyClaimsAuthorizationRequirement) {
      return new PolicyClaimsAuthorizationAttributeImpl(/* deps */);
    }
    
    if (requirement instanceof PoliciesAuthorizationRequirement) {
      return new PoliciesAuthorizationAttributeImpl(/* deps */);
    }
    
    throw new Error(`Unknown requirement: ${requirement.constructor.name}`);
  }
}
```

### 4. Implementation Validates & Continues or Rejects

```typescript
export class PolicyClaimsAuthorizationAttributeImpl implements IAuthorizationImplementation {
  async onResourceExecutionAsync(context: HttpContext, next: () => Promise<void>) {
    const authorized = await this.authorizeClaimAsync(context.user);
    
    if (authorized.succeeded) {
      await next(); // ✓ Authorized — continue
    } else {
      context.response.statusCode = 401; // ✗ Unauthorized — stop
    }
  }
}
```

---

## Adding New Authorization Types

To add a new authorization decorator:

### 1. Create Requirement Class

```typescript
export class RoleAuthorizationRequirement {
  constructor(public readonly requiredRoles: string[]) {}
}
```

### 2. Create Decorator

```typescript
export function RoleAuthorization(roles: string[]) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    const requirement = new RoleAuthorizationRequirement(roles);
    const fn = descriptor ? descriptor.value : target;
    const existing = (fn as any).__requirements || [];
    
    Reflect.defineProperty(fn, "__requirements", {
      value: [...existing, requirement],
      writable: false,
      enumerable: false,
      configurable: true
    });
  };
}
```

### 3. Create Implementation

```typescript
export class RoleAuthorizationAttributeImpl implements IAuthorizationImplementation {
  constructor(
    private readonly roleService: IRoleService,
    private readonly userManager: UserManager1<IUser>,
    private readonly signInManager: SignInManager<IUser>,
    private readonly roleRequirement: RoleAuthorizationRequirement
  ) {}

  async onResourceExecutionAsync(context: HttpContext, next: () => Promise<void>) {
    if (await this.userManager.hasSignInClaimAsync(context.user)) {
      const authorized = await this.roleService.authorizeAsync(
        context.user,
        this.roleRequirement.requiredRoles
      );
      
      if (authorized.succeeded) {
        await next();
      } else {
        context.response.statusCode = 401;
      }
    } else {
      await this.signInManager.signOutAsync();
      context.response.statusCode = 401;
    }
  }
}
```

### 4. Register in Factory

```typescript
export class AuthorizationImplementationFactory {
  createImplementation(requirement: any): IAuthorizationImplementation {
    if (requirement instanceof PolicyClaimsAuthorizationRequirement) {
      return new PolicyClaimsAuthorizationAttributeImpl(/* ... */);
    }
    
    if (requirement instanceof PoliciesAuthorizationRequirement) {
      return new PoliciesAuthorizationAttributeImpl(/* ... */);
    }
    
    if (requirement instanceof RoleAuthorizationRequirement) {  // ← Add this
      return new RoleAuthorizationAttributeImpl(
        this.roleService,
        this.userManager,
        this.signInManager,
        requirement
      );
    }
    
    throw new Error(`Unknown requirement: ${requirement.constructor.name}`);
  }
}
```

### 5. Use It

```typescript
@Get('/reports')
@RoleAuthorization(['Analyst', 'Manager'])
async getReports() {
  return { reports: [] };
}
```

**No new middleware needed.** The existing middleware handles it automatically via the factory.

---

## Key Rules

| Rule                           | Why                                        |
|--------------------------------|--------------------------------------------|
| **One middleware**             | Single entry point; scales to N decorators |
| **One factory**                | Centralized requirement → impl mapping     |
| **One interface**              | All impls follow same contract             |
| **instanceof checks**          | Type-safe routing to correct impl          |
| **Use Express types**          | Avoid Node.js IncomingMessage confusion    |
| **Check for `__requirements`** | Safe fallback if no decorators present     |

---

## Testing

```typescript
// Mock factory
const mockFactory = {
  createImplementation: jest.fn((req) => ({
    onResourceExecutionAsync: jest.fn(async (ctx, next) => {
      await next(); // Authorized
    })
  }))
};

// Mock request/response
const req = { route: { stack: [{ handle: { __requirements: [/* ... */] } }] } } as any;
const res = { statusCode: 200 } as any;
const next = jest.fn();

// Test middleware
const middleware = authorizationMiddleware(mockFactory);
await middleware(req, res, next);

expect(next).toHaveBeenCalled();
expect(res.statusCode).toBe(200);
```

---

## Summary

✓ **Single middleware** — no duplication  
✓ **Factory pattern** — type-safe routing  
✓ **Interface-based** — consistent contracts  
✓ **Extensible** — add decorators without changing middleware  
✓ **Type-safe** — proper Express types, no `any` leaks
