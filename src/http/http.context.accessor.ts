// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to we under the MIT license.

import { HttpContext } from "./http.context.js";

/**
 * Provides access to the current HttpContext, if one is available.
 *
 * Remarks:
 * This interface should be used with caution. It relies on AsyncLocal<T> which can have a negative
 * performance impact on async calls. It also creates a dependency on "ambient state" which can make
 * testing more difficult.
 */
export interface IHttpContextAccessor {
  /**
   * Gets or sets the current HttpContext. Returns null if there is no active HttpContext.
   */
  httpContext: HttpContext | null;
}

/**
 * Provides an implementation of IHttpContextAccessor based on the current execution context.
 */
export class HttpContextAccessor implements IHttpContextAccessor {
  private static httpContextCurrent: { value?: HttpContextHolder } = {};

  public get httpContext(): HttpContext | null {
    return HttpContextAccessor.httpContextCurrent.value?.context ?? null;
  }

  public set httpContext(value: HttpContext | null) {
    // Clear current HttpContext trapped in the AsyncLocals, as its done.
    if (HttpContextAccessor.httpContextCurrent.value) {
      HttpContextAccessor.httpContextCurrent.value.context = null;
    }

    if (value != null) {
      // Use an object indirection to hold the HttpContext in the AsyncLocal,
      // so it can be cleared in all ExecutionContexts when its cleared.
      HttpContextAccessor.httpContextCurrent.value = new HttpContextHolder(value);
    }
  }
}

/**
 * Internal holder for HttpContext.
 */
class HttpContextHolder {
  public context: HttpContext | null;

  constructor(context: HttpContext | null) {
    this.context = context;
  }
}

