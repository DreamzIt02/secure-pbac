import { ClaimsPrincipal } from "../claims/index.js";
import { AuthorizationResult } from "./authorization.result.js";

/**
 * Represents a factory that can create meters.
 */
export interface IMeterFactory {
  create(name: string): Meter;
}

/**
 * A simple meter that can create counters.
 */
export class Meter {
  constructor(public readonly name: string) {}

  public createCounter<T extends number>(
    name: string,
    unit: string,
    description: string
  ): Counter<T> {
    return new Counter<T>(name, unit, description);
  }
}

/**
 * A simple counter that tracks increments.
 */
export class Counter<T extends number> {
  public readonly name: string;
  public readonly unit: string;
  public readonly description: string;
  public enabled: boolean = true;
  private count: number = 0;

  constructor(name: string, unit: string, description: string) {
    this.name = name;
    this.unit = unit;
    this.description = description;
  }

  public add(value: T, tags?: TagList): void {
    if (!this.enabled) return;
    this.count += value;
    // For demo purposes, just log the increment
    console.log(
      `[Counter] ${this.name} +${value} ${this.unit} | tags: ${tags?.toString()}`
    );
  }

  public get value(): number {
    return this.count;
  }
}

/**
 * A simple tag list for metrics.
 */
export class TagList {
  private tags: Map<string, any>;

  constructor(initial?: [string, any][]) {
    this.tags = new Map(initial);
  }

  public add(key: string, value: any): void {
    this.tags.set(key, value);
  }

  public toString(): string {
    return Array.from(this.tags.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
  }
}

/**
 * A basic meter factory implementation.
 */
export class DefaultMeterFactory implements IMeterFactory {
  public create(name: string): Meter {
    return new Meter(name);
  }
}

/**
 * Internal sealed class AuthorizationMetrics.
 * Mirrors the .NET implementation for tracking authorization attempts.
 */
export class AuthorizationMetrics {
  public static readonly meterName: string = "Microsoft.AspNetCore.Authorization";

  private readonly meter: Meter;
  private readonly authorizedCount: Counter<number>;

  /**
   * Creates a new instance of AuthorizationMetrics.
   * @param meterFactory The IMeterFactory used to create meters.
   */
  constructor(meterFactory: IMeterFactory) {
    this.meter = meterFactory.create(AuthorizationMetrics.meterName);

    this.authorizedCount = this.meter.createCounter<number>(
      "aspnetcore.authorization.attempts",
      "{attempt}",
      "The total number of authorization attempts."
    );
  }

  /**
   * Records the completion of an authorization attempt.
   * @param user The user principal involved in the authorization attempt.
   * @param policyName The name of the policy evaluated, if any.
   * @param result The result of the authorization attempt.
   * @param exception Any exception that occurred during authorization.
   */
  public authorizeAttemptCompleted(
    user: ClaimsPrincipal,
    policyName: string | null,
    result: AuthorizationResult | null,
    exception: DOMException | null
  ): void {
    if (this.authorizedCount.enabled) {
      this.authorizeAttemptCore(user, policyName, result, exception);
    }
  }

  /**
   * Core logic for recording authorization attempt metrics.
   * @param user The user principal involved in the authorization attempt.
   * @param policyName The name of the policy evaluated, if any.
   * @param result The result of the authorization attempt.
   * @param exception Any exception that occurred during authorization.
   */
  private authorizeAttemptCore(
    user: ClaimsPrincipal,
    policyName: string | null,
    result: AuthorizationResult | null,
    exception: DOMException | null
  ): void {
    const tags = new TagList([
      ["aspnetcore.user.is_authenticated", user.identity?.isAuthenticated ?? false]
    ]);

    if (policyName !== null) {
      tags.add("aspnetcore.authorization.policy", policyName);
    }

    if (result !== null) {
      const resultTagValue = result.succeeded ? "success" : "failure";
      tags.add("aspnetcore.authorization.result", resultTagValue);
    }

    if (exception !== null) {
      tags.add("error.type", exception.constructor.name);
    }

    this.authorizedCount.add(1, tags);
  }
}
