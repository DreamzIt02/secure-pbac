// claim.value.types.ts

/**
 * Defines the claim value types of the framework.
 *
 * Mirrors System.Security.Claims.ClaimValueTypes.
 */
export class ClaimValueTypes {
  /**
   * Base namespace for XML Schema claim value types.
   */
  private static readonly XmlSchemaNamespace: string = "http://www.w3.org/2001/XMLSchema";

  /**
   * Base namespace for SOAP Schema claim value types.
   */
  private static readonly SoapSchemaNamespace: string = "http://schemas.xmlsoap.org/";

  /**
   * Base namespace for XML Signature constants.
   */
  private static readonly XmlSignatureConstantsNamespace: string = "http://www.w3.org/2000/09/xmldsig#";

  /**
   * Base namespace for XQuery operators.
   */
  private static readonly XQueryOperatorsNameSpace: string =
    "http://www.w3.org/TR/2002/WD-xquery-operators-20020816";

  /**
   * Base namespace for XACML 1.0.
   */
  private static readonly Xacml10Namespace: string = "urn:oasis:names:tc:xacml:1.0";

  // XML Schema claim value types
  public static readonly Base64Binary: string = ClaimValueTypes.XmlSchemaNamespace + "#base64Binary";
  public static readonly Base64Octet: string = ClaimValueTypes.XmlSchemaNamespace + "#base64Octet";
  public static readonly Boolean: string = ClaimValueTypes.XmlSchemaNamespace + "#boolean";
  public static readonly Date: string = ClaimValueTypes.XmlSchemaNamespace + "#date";
  public static readonly DateTime: string = ClaimValueTypes.XmlSchemaNamespace + "#dateTime";
  public static readonly Double: string = ClaimValueTypes.XmlSchemaNamespace + "#double";
  public static readonly Fqbn: string = ClaimValueTypes.XmlSchemaNamespace + "#fqbn";
  public static readonly HexBinary: string = ClaimValueTypes.XmlSchemaNamespace + "#hexBinary";
  public static readonly Integer: string = ClaimValueTypes.XmlSchemaNamespace + "#integer";
  public static readonly Integer32: string = ClaimValueTypes.XmlSchemaNamespace + "#integer32";
  public static readonly Integer64: string = ClaimValueTypes.XmlSchemaNamespace + "#integer64";
  public static readonly Sid: string = ClaimValueTypes.XmlSchemaNamespace + "#sid";
  public static readonly String: string = ClaimValueTypes.XmlSchemaNamespace + "#string";
  public static readonly Time: string = ClaimValueTypes.XmlSchemaNamespace + "#time";
  public static readonly UInteger32: string = ClaimValueTypes.XmlSchemaNamespace + "#uinteger32";
  public static readonly UInteger64: string = ClaimValueTypes.XmlSchemaNamespace + "#uinteger64";

  // SOAP Schema claim value types
  public static readonly DnsName: string = ClaimValueTypes.SoapSchemaNamespace + "claims/dns";
  public static readonly Email: string =
    ClaimValueTypes.SoapSchemaNamespace + "ws/2005/05/identity/claims/emailaddress";
  public static readonly Rsa: string =
    ClaimValueTypes.SoapSchemaNamespace + "ws/2005/05/identity/claims/rsa";
  public static readonly UpnName: string = ClaimValueTypes.SoapSchemaNamespace + "claims/UPN";

  // XML Signature constants
  public static readonly DsaKeyValue: string = ClaimValueTypes.XmlSignatureConstantsNamespace + "DSAKeyValue";
  public static readonly KeyInfo: string = ClaimValueTypes.XmlSignatureConstantsNamespace + "KeyInfo";
  public static readonly RsaKeyValue: string = ClaimValueTypes.XmlSignatureConstantsNamespace + "RSAKeyValue";

  // XQuery operators
  public static readonly DaytimeDuration: string =
    ClaimValueTypes.XQueryOperatorsNameSpace + "#dayTimeDuration";
  public static readonly YearMonthDuration: string =
    ClaimValueTypes.XQueryOperatorsNameSpace + "#yearMonthDuration";

  // XACML 1.0 claim value types
  public static readonly Rfc822Name: string = ClaimValueTypes.Xacml10Namespace + ":data-type:rfc822Name";
  public static readonly X500Name: string = ClaimValueTypes.Xacml10Namespace + ":data-type:x500Name";
}
