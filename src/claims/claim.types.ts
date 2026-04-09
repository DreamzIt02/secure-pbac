// claim.types.ts

/**
 * Defines the claim types that are supported by the framework.
 *
 * Mirrors System.Security.Claims.ClaimTypes.
 */
export class ClaimTypes {
  /**
   * Base namespace for 2008 claim types.
   */
  private static readonly ClaimTypeNamespace: string =
    "http://schemas.microsoft.com/ws/2008/06/identity/claims";

  /**
   * Base namespace for 2005 claim types.
   */
  private static readonly ClaimType2005Namespace: string =
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims";

  /**
   * Base namespace for 2009 claim types.
   */
  private static readonly ClaimType2009Namespace: string =
    "http://schemas.xmlsoap.org/ws/2009/09/identity/claims";

  public static readonly DefaultIssuer: string = "LOCAL AUTHORITY";
  
  // 2008 namespace claims
  public static readonly AuthenticationInstant: string =
    ClaimTypes.ClaimTypeNamespace + "/authenticationinstant";
  public static readonly AuthenticationMethod: string =
    ClaimTypes.ClaimTypeNamespace + "/authenticationmethod";
  public static readonly CookiePath: string =
    ClaimTypes.ClaimTypeNamespace + "/cookiepath";
  public static readonly DenyOnlyPrimarySid: string =
    ClaimTypes.ClaimTypeNamespace + "/denyonlyprimarysid";
  public static readonly DenyOnlyPrimaryGroupSid: string =
    ClaimTypes.ClaimTypeNamespace + "/denyonlyprimarygroupsid";
  public static readonly DenyOnlyWindowsDeviceGroup: string =
    ClaimTypes.ClaimTypeNamespace + "/denyonlywindowsdevicegroup";
  public static readonly Dsa: string = ClaimTypes.ClaimTypeNamespace + "/dsa";
  public static readonly Expiration: string =
    ClaimTypes.ClaimTypeNamespace + "/expiration";
  public static readonly Expired: string =
    ClaimTypes.ClaimTypeNamespace + "/expired";
  public static readonly GroupSid: string =
    ClaimTypes.ClaimTypeNamespace + "/groupsid";
  public static readonly IsPersistent: string =
    ClaimTypes.ClaimTypeNamespace + "/ispersistent";
  public static readonly PrimaryGroupSid: string =
    ClaimTypes.ClaimTypeNamespace + "/primarygroupsid";
  public static readonly PrimarySid: string =
    ClaimTypes.ClaimTypeNamespace + "/primarysid";
  public static readonly Role: string = ClaimTypes.ClaimTypeNamespace + "/role";
  public static readonly SerialNumber: string =
    ClaimTypes.ClaimTypeNamespace + "/serialnumber";
  public static readonly UserData: string =
    ClaimTypes.ClaimTypeNamespace + "/userdata";
  public static readonly Version: string =
    ClaimTypes.ClaimTypeNamespace + "/version";
  public static readonly WindowsAccountName: string =
    ClaimTypes.ClaimTypeNamespace + "/windowsaccountname";
  public static readonly WindowsDeviceClaim: string =
    ClaimTypes.ClaimTypeNamespace + "/windowsdeviceclaim";
  public static readonly WindowsDeviceGroup: string =
    ClaimTypes.ClaimTypeNamespace + "/windowsdevicegroup";
  public static readonly WindowsUserClaim: string =
    ClaimTypes.ClaimTypeNamespace + "/windowsuserclaim";
  public static readonly WindowsFqbnVersion: string =
    ClaimTypes.ClaimTypeNamespace + "/windowsfqbnversion";
  public static readonly WindowsSubAuthority: string =
    ClaimTypes.ClaimTypeNamespace + "/windowssubauthority";

  // 2005 namespace claims
  public static readonly Anonymous: string =
    ClaimTypes.ClaimType2005Namespace + "/anonymous";
  public static readonly Authentication: string =
    ClaimTypes.ClaimType2005Namespace + "/authentication";
  public static readonly AuthorizationDecision: string =
    ClaimTypes.ClaimType2005Namespace + "/authorizationdecision";
  public static readonly Country: string =
    ClaimTypes.ClaimType2005Namespace + "/country";
  public static readonly DateOfBirth: string =
    ClaimTypes.ClaimType2005Namespace + "/dateofbirth";
  public static readonly Dns: string = ClaimTypes.ClaimType2005Namespace + "/dns";
  public static readonly DenyOnlySid: string =
    ClaimTypes.ClaimType2005Namespace + "/denyonlysid";
  public static readonly Email: string =
    ClaimTypes.ClaimType2005Namespace + "/emailaddress";
  public static readonly Gender: string =
    ClaimTypes.ClaimType2005Namespace + "/gender";
  public static readonly GivenName: string =
    ClaimTypes.ClaimType2005Namespace + "/givenname";
  public static readonly Hash: string =
    ClaimTypes.ClaimType2005Namespace + "/hash";
  public static readonly HomePhone: string =
    ClaimTypes.ClaimType2005Namespace + "/homephone";
  public static readonly Locality: string =
    ClaimTypes.ClaimType2005Namespace + "/locality";
  public static readonly MobilePhone: string =
    ClaimTypes.ClaimType2005Namespace + "/mobilephone";
  public static readonly Name: string =
    ClaimTypes.ClaimType2005Namespace + "/name";
  public static readonly NameIdentifier: string =
    ClaimTypes.ClaimType2005Namespace + "/nameidentifier";
  public static readonly OtherPhone: string =
    ClaimTypes.ClaimType2005Namespace + "/otherphone";
  public static readonly PostalCode: string =
    ClaimTypes.ClaimType2005Namespace + "/postalcode";
  public static readonly Rsa: string = ClaimTypes.ClaimType2005Namespace + "/rsa";
  public static readonly Sid: string = ClaimTypes.ClaimType2005Namespace + "/sid";
  public static readonly Spn: string = ClaimTypes.ClaimType2005Namespace + "/spn";
  public static readonly StateOrProvince: string =
    ClaimTypes.ClaimType2005Namespace + "/stateorprovince";
  public static readonly StreetAddress: string =
    ClaimTypes.ClaimType2005Namespace + "/streetaddress";
  public static readonly Surname: string =
    ClaimTypes.ClaimType2005Namespace + "/surname";
  public static readonly System: string =
    ClaimTypes.ClaimType2005Namespace + "/system";
  public static readonly Thumbprint: string =
    ClaimTypes.ClaimType2005Namespace + "/thumbprint";
  public static readonly Upn: string = ClaimTypes.ClaimType2005Namespace + "/upn";
  public static readonly Uri: string = ClaimTypes.ClaimType2005Namespace + "/uri";
  public static readonly Webpage: string =
    ClaimTypes.ClaimType2005Namespace + "/webpage";
  public static readonly X500DistinguishedName: string =
    ClaimTypes.ClaimType2005Namespace + "/x500distinguishedname";

  // 2009 namespace claims
  public static readonly Actor: string =
    ClaimTypes.ClaimType2009Namespace + "/actor";
}
