import { Claim } from "./claim.js";

// Claim type identifiers
export enum AuthorizeClaimTypeEnum {
  Default     = 0,
  Department  = 100,
}

// Claim identifiers (design-time constants)
export enum AuthorizeClaimEnum {
  Default                   = 0,
  DepartmentAdministration  = 1,
  DepartmentUser            = 101,
  DepartmentPost            = 105,
  DepartmentContent         = 110,
  DepartmentLocation        = 115,
  DepartmentLocalization    = 120,
  DepartmentFinance         = 125,
}

// Claim priorities
export enum AuthorizeClaimPriorityEnum {
  Default = 0,
  A = 100,
  B = 80,
  C = 70,
  D = 60,
  E = 50,
}


// SiteClaim utilities
export class SiteClaim {
  static TypeBase = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/';

  static AllClaimNames: string[] = Object.keys(AuthorizeClaimEnum).filter((k) => isNaN(Number(k)));
  static AllClaimTypeNames: string[] = Object.keys(AuthorizeClaimTypeEnum).filter((k) => isNaN(Number(k)));

  static AllClaimValues: AuthorizeClaimEnum[] = Object.values(AuthorizeClaimEnum).filter(
    (v) => typeof v === 'number'
  ) as AuthorizeClaimEnum[];

  static AllClaimTypeValues: AuthorizeClaimTypeEnum[] = Object.values(AuthorizeClaimTypeEnum).filter(
    (v) => typeof v === 'number'
  ) as AuthorizeClaimTypeEnum[];

  static authorizeClaimTypeName(T: AuthorizeClaimTypeEnum): string {
    return AuthorizeClaimTypeEnum[T].toLowerCase();
  }

  static authorizeClaimName(T: AuthorizeClaimEnum): string {
    return AuthorizeClaimEnum[T].toLowerCase();
  }

  static authorizeClaims(T: AuthorizeClaimTypeEnum): AuthorizeClaimEnum[] {
    return SiteClaim.AllClaimValues.filter((p) =>
      AuthorizeClaimEnum[p].toLowerCase().startsWith(SiteClaim.authorizeClaimTypeName(T))
    );
  }

  static authorizeClaimNames(T: AuthorizeClaimTypeEnum): string[] {
    return SiteClaim.AllClaimNames.filter((p) =>
      p.toLowerCase().startsWith(SiteClaim.authorizeClaimTypeName(T))
    ).map((p) => p.toLowerCase());
  }

  static SignInClaimType = 'sign_in';

  static newSignInClaim(): Claim {
    return new Claim(SiteClaim.SignInClaimType, crypto.randomUUID());
  }

  static defaultClaim(): Claim {
    return new Claim(AuthorizeClaimTypeEnum[AuthorizeClaimTypeEnum.Default], AuthorizeClaimEnum[AuthorizeClaimEnum.Default]);
  }

  static newClaim(T: AuthorizeClaimEnum): Claim | null {
    const value = SiteClaim.authorizeClaimName(T);
    if (value) {
      const type = SiteClaim.authorizeClaimType(value);
      if (type) {
        return new Claim(type, value);
      }
    }
    return null;
  }

  static newClaimList(T: AuthorizeClaimEnum[]): Claim[] {
    return T.map((claim) => SiteClaim.newClaim(claim)).filter((c): c is Claim => c !== null);
  }

  static authorizeClaimType(T: AuthorizeClaimEnum | string): string | null {
    const val = typeof T === 'string' ? T : SiteClaim.authorizeClaimName(T);
    for (const typeName of SiteClaim.AllClaimTypeNames) {
      if (val.toLowerCase().startsWith(typeName.toLowerCase())) {
        return typeName;
      }
    }
    return null;
  }

  static getType(typ: string): string | null {
    if (!typ) return null;
    const typePart = typ.replace(SiteClaim.TypeBase, '').toLowerCase();
    return typePart || null;
  }

  static getValue(val: string): string | null {
    return val ? val.toLowerCase() : null;
  }

  static isTypeEqual(currentTyp: string, typ: string): boolean {
    const _typ = SiteClaim.getType(typ);
    return currentTyp === _typ || SiteClaim.getType(currentTyp) === _typ;
  }

  static isValueEqual(currentVal: string, val: string): boolean {
    const _val = SiteClaim.getValue(val);
    return currentVal === _val || SiteClaim.getValue(currentVal) === _val;
  }
}
