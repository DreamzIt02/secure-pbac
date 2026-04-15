import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../../src/claims/index.js";
import { AuthenticationProperties, AuthenticationTicket } from "../../../src/http/authentication/index.js";

describe("AuthenticationTicket", () => {
  it("initializes with principal, properties, and scheme", () => {
    const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "user1")]);
    const principal = new ClaimsPrincipal(identity);
    const props = new AuthenticationProperties({ key: "value" });
    const ticket = new AuthenticationTicket(principal, props, "MyScheme");

    expect(ticket.authenticationScheme).toBe("MyScheme");
    expect(ticket.principal).toBe(principal);
    expect(ticket.properties).toBe(props);
    expect(ticket.principal.identity?.name).toBe("user1");
  });

  it("initializes with default properties when null is provided", () => {
    const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "user2")]);
    const principal = new ClaimsPrincipal(identity);
    const ticket = new AuthenticationTicket(principal, null, "Scheme");
    expect(ticket.properties).toBeInstanceOf(AuthenticationProperties);
  });

  it("fromPrincipal creates ticket with default properties", () => {
    const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "user3")]);
    const principal = new ClaimsPrincipal(identity);
    const ticket = AuthenticationTicket.fromPrincipal(principal, "SchemeX");
    expect(ticket.authenticationScheme).toBe("SchemeX");
    expect(ticket.principal).toBe(principal);
    expect(ticket.properties).toBeInstanceOf(AuthenticationProperties);
  });

  it("clone creates a deep copy with cloned identities and properties", () => {
    const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "user4")]);
    const principal = new ClaimsPrincipal(identity);
    const props = new AuthenticationProperties({ a: "1" });
    const ticket = new AuthenticationTicket(principal, props, "SchemeY");

    const cloned = ticket.clone();
    expect(cloned).not.toBe(ticket);
    expect(cloned.authenticationScheme).toBe("SchemeY");
    expect(cloned.principal).not.toBe(ticket.principal);
    expect(cloned.principal.identities[0].name).toBe("user4");
    expect(cloned.properties).not.toBe(ticket.properties);
    expect(cloned.properties.items).toEqual(ticket.properties.items);
  });

  it("throws error when principal is null", () => {
    expect(() => new AuthenticationTicket(null as any, null, "Scheme"))
      .toThrowError("ArgumentNullException");
  });
});
