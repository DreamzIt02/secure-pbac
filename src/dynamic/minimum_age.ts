// Dynamic MinimumAge authorization module

export const POLICY_PREFIX = 'MinimumAge';

// Attribute equivalent
export class MinimumAgeAuthorize {
  private _policy: string;

  constructor(age: number) {
    this._policy = undefined as any;
    this.age = age;
  }

  get age(): number {
    const suffix = this._policy.substring(POLICY_PREFIX.length);
    const parsed = parseInt(suffix, 10);
    return isNaN(parsed) ? 0 : parsed;
  }

  set age(value: number) {
    this._policy = `${POLICY_PREFIX}${value}`;
  }

  get policy(): string {
    return this._policy;
  }
}

// Requirement equivalent
export class MinimumAgeRequirement {
  constructor(public age: number) {}
}

// Policy provider equivalent
export class MinimumAgePolicyProvider {
  getPolicy(policyName: string): MinimumAgeRequirement | null {
    if (
      policyName.startsWith(POLICY_PREFIX) &&
      !isNaN(parseInt(policyName.substring(POLICY_PREFIX.length), 10))
    ) {
      const age = parseInt(policyName.substring(POLICY_PREFIX.length), 10);
      return new MinimumAgeRequirement(age);
    }
    return null;
  }
}
