import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../../src/claims/index.js";
import { AuthenticateResult, AuthenticateResults, AuthenticationFailureException, AuthenticationProperties, AuthenticationTicket } from "../../../src/http/authentication/index.js";


describe("AuthenticateResult", () => {
  const makeTicket = () => {
    const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "user1")]);
    const principal = new ClaimsPrincipal(identity);
    const props = new AuthenticationProperties({ key: "value" });
    return new AuthenticationTicket(principal, props, "Scheme");
  };

  it("success creates a result with ticket and properties", () => {
    const ticket = makeTicket();
    const result = AuthenticateResult.success(ticket);
    expect(result.succeeded).toBe(true);
    expect(result.ticket).toBe(ticket);
    expect(result.properties).toBe(ticket.properties);
    expect(result.principal).toBe(ticket.principal);
  });

  it("success throws when ticket is null", () => {
    expect(() => AuthenticateResult.success(null as any)).toThrowError("ArgumentNullException: ticket");
  });

  it("noResult returns a result with none=true", () => {
    const result = AuthenticateResult.noResult();
    expect(result.none).toBe(true);
    expect(result.succeeded).toBe(false);
    expect(result.ticket).toBeUndefined();
  });

  it("fail with Error sets failure", () => {
    const error = new Error("fail");
    const result = AuthenticateResult.fail(error);
    expect(result.failure).toBe(error);
    expect(result.succeeded).toBe(false);
  });

  it("fail with Error and properties sets both", () => {
    const error = new Error("fail");
    const props = new AuthenticationProperties({ a: "1" });
    const result = AuthenticateResult.fail(error, props);
    expect(result.failure).toBe(error);
    expect(result.properties).toBe(props);
  });

  it("fail with string creates AuthenticationFailureException", () => {
    const result = AuthenticateResult.fail("message");
    expect(result.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(result.failure?.message).toBe("message");
  });

  it("fail with string and properties sets both", () => {
    const props = new AuthenticationProperties({ b: "2" });
    const result = AuthenticateResult.fail("msg", props);
    expect(result.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(result.properties).toBe(props);
  });

  it("clone returns noResult when none=true", () => {
    const result = AuthenticateResult.noResult();
    const cloned = result.clone();
    expect(cloned.none).toBe(true);
  });

  it("clone returns fail when failure exists", () => {
    const error = new Error("fail");
    const props = new AuthenticationProperties({ c: "3" });
    const result = AuthenticateResult.fail(error, props);
    const cloned = result.clone();
    expect(cloned.failure?.message).toBe("fail");
    expect(cloned.properties?.items).toEqual(props.items);
  });

  it("clone returns success when succeeded", () => {
    const ticket = makeTicket();
    const result = AuthenticateResult.success(ticket);
    const cloned = result.clone();
    expect(cloned.succeeded).toBe(true);
    expect(cloned.ticket).not.toBe(ticket); // clone creates new ticket
    expect(cloned.ticket?.principal.identities[0].name).toBe("user1");
  });

  it("clone throws when neither none, failure, nor success", () => {
    const result = new (AuthenticateResult as any)({});
    expect(() => result.clone()).toThrowError("NotImplementedException");
  });
});

describe("AuthenticateResults predefined failures", () => {
  it("contains predefined failure results", () => {
    expect(AuthenticateResults.NoSelfSigned.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.NoChainedCertificates.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.InvalidClientCertificate.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.FailedUnprotectingTicket.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.MissingSessionId.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.MissingIdentityInSession.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.ExpiredTicket.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.NoPrincipal.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.ValidatorNotFound.failure).toBeInstanceOf(AuthenticationFailureException);
    expect(AuthenticateResults.TokenHandlerUnableToValidate.failure).toBeInstanceOf(AuthenticationFailureException);
  });
});
