import { Claim } from "../claims/index.js";

// Policy identifiers
export enum PolicyEnum {
  SiteAdmin = 0,
  SiteActingAdmin = 1,
  SiteGeneralAdmin = 2,
  SiteDepartmentAdmin = 3,
  SiteManager = 4,
  SiteSignedUser = 101,
  SiteUnSignedUser = 102,
}

// Group policy identifiers
export enum GroupPolicyEnum {
  Default = 0,
  Manager = 303,
  DepartmentAdmin = 304,
  GeneralAdmin = 305,
  ActingAdmin = 306,
  SignedUser = 101,
}

// GroupPolicy static class equivalent
export class GroupPolicy {
  static GroupPolicies: GroupPolicyEnum[] = Object.values(GroupPolicyEnum).filter(
    (v) => typeof v === 'number'
  ) as GroupPolicyEnum[];

  static AllPolicies: PolicyEnum[] = Object.values(PolicyEnum).filter(
    (v) => typeof v === 'number'
  ) as PolicyEnum[];

  static AdminPolicies: PolicyEnum[] = GroupPolicy.AllPolicies.filter(
    (p) =>
      p !== PolicyEnum.SiteAdmin &&
      PolicyEnum[p].toLowerCase().includes('admin')
  );

  static ManagerPolicies: PolicyEnum[] = GroupPolicy.AllPolicies.filter((p) =>
    PolicyEnum[p].toLowerCase().includes('manager')
  );

  static NonOrganizationPolicies: PolicyEnum[] = GroupPolicy.AllPolicies.filter(
    (p) =>
      !PolicyEnum[p].toLowerCase().includes('admin') &&
      !PolicyEnum[p].toLowerCase().includes('manager')
  );

  static authorizePolicyName(T: PolicyEnum): string {
    return PolicyEnum[T];
  }

  static getGroupPolicy(id: GroupPolicyEnum): PolicyEnum[] {
    switch (id) {
      case GroupPolicyEnum.Default:
        return [PolicyEnum.SiteAdmin];
      case GroupPolicyEnum.ActingAdmin:
        return [PolicyEnum.SiteActingAdmin];
      case GroupPolicyEnum.GeneralAdmin:
        return [PolicyEnum.SiteActingAdmin, PolicyEnum.SiteGeneralAdmin];
      case GroupPolicyEnum.DepartmentAdmin:
        return GroupPolicy.AdminPolicies;
      case GroupPolicyEnum.Manager:
        return GroupPolicy.getComplexGroup(GroupPolicy.AdminPolicies, GroupPolicy.ManagerPolicies);
      case GroupPolicyEnum.SignedUser:
        return [PolicyEnum.SiteSignedUser];
      default:
        return [];
    }
  }

  static getComplexGroup(group1: PolicyEnum[], group2: PolicyEnum[]): PolicyEnum[] {
    return [...group1, ...group2];
  }

  // Create a runtime policy claim
  static requestPolicyClaim(policy: PolicyEnum): Claim {
    return { type: 'Policy', value: this.authorizePolicyName(policy) };
  }
}
