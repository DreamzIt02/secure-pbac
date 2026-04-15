import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../../src/claims/index.js";
import { ExternalLoginInfo } from "../../../src/core/types/index.js";
import { AuthenticationProperties, AuthenticationToken } from "../../../src/http/authentication/index.js";

describe("ExternalLoginInfo", () => {
  const makePrincipal = () => {
    const identity = new ClaimsIdentity([new Claim(ClaimTypes.Name, "user1")]);
    return new ClaimsPrincipal(identity);
  };

  it("initializes with principal and login info", () => {
    const principal = makePrincipal();
    const info = new ExternalLoginInfo(principal, "Google", "12345", "Google Display");

    expect(info.loginProvider).toBe("Google");
    expect(info.providerKey).toBe("12345");
    expect(info.providerDisplayName).toBe("Google Display");
    expect(info.principal).toBe(principal);
    expect(info.authenticationTokens).toBeNull();
    expect(info.authenticationProperties).toBeNull();
  });

  it("allows overriding principal", () => {
    const principal1 = makePrincipal();
    const principal2 = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.Name, "user2")]));
    const info = new ExternalLoginInfo(principal1, "Facebook", "abcde", "Facebook Display");
    info.principal = principal2;
    expect(info.principal).toBe(principal2);
    expect(info.principal.identity?.name).toBe("user2");
  });

  it("allows setting authenticationTokens", () => {
    const principal = makePrincipal();
    const info = new ExternalLoginInfo(principal, "Twitter", "xyz", "Twitter Display");
    const tokens = [new AuthenticationToken(), new AuthenticationToken()];
    tokens[0].name = "access_token";
    tokens[0].value = "token123";
    tokens[1].name = "refresh_token";
    tokens[1].value = "token456";

    info.authenticationTokens = tokens;
    expect(info.authenticationTokens).toHaveLength(2);
    expect(info.authenticationTokens?.[0].name).toBe("access_token");
    expect(info.authenticationTokens?.[1].value).toBe("token456");
  });

  it("allows setting authenticationProperties", () => {
    const principal = makePrincipal();
    const info = new ExternalLoginInfo(principal, "Microsoft", "ms123", "MS Display");
    const props = new AuthenticationProperties({ key: "value" });
    info.authenticationProperties = props;
    expect(info.authenticationProperties).toBe(props);
    expect(info.authenticationProperties?.items.key).toBe("value");
  });
});
