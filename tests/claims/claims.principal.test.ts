import { describe, it, expect } from "vitest";
import { Claim, ClaimsIdentity, ClaimsPrincipal, ClaimTypes } from "../../src/claims/index.js";


describe("ClaimsPrincipal", () => {
  it("constructs with no args", () => {
    const principal = new ClaimsPrincipal();
    expect(principal.identities).toEqual([]);
    expect(principal.identity).toBeUndefined();
    expect(principal.claims).toEqual([]);
  });

  it("constructs with single identity", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Alice")]);
    const principal = new ClaimsPrincipal(id);
    expect(principal.identities.length).toBe(1);
    expect(principal.identity).toBe(id);
    expect(principal.claims[0].value).toBe("Alice");
  });

  it("constructs with multiple identities", () => {
    const id1 = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Bob")]);
    const id2 = new ClaimsIdentity([new Claim(ClaimTypes.Role, "Admin")]);
    const principal = new ClaimsPrincipal([id1, id2]);
    expect(principal.identities.length).toBe(2);
    expect(principal.claims.length).toBe(2);
  });

  it("constructs from another principal", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Charlie")]);
    const original = new ClaimsPrincipal(id);
    const clone = new ClaimsPrincipal(original);
    expect(clone.identities.length).toBe(1);
    expect(clone.claims[0].value).toBe("Charlie");
  });

  it("addIdentity adds identity", () => {
    const principal = new ClaimsPrincipal();
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "David")]);
    principal.addIdentity(id);
    expect(principal.identities.length).toBe(1);
    expect(principal.identity?.name).toBe("David");
  });

  it("addIdentities adds multiple identities", () => {
    const principal = new ClaimsPrincipal();
    const id1 = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Eve")]);
    const id2 = new ClaimsIdentity([new Claim(ClaimTypes.Role, "User")]);
    principal.addIdentities([id1, id2]);
    expect(principal.identities.length).toBe(2);
    expect(principal.findFirstByType(ClaimTypes.Role)?.value).toBe("User");
  });

  it("clone creates a new principal with same identities", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Frank")]);
    const principal = new ClaimsPrincipal(id);
    const clone = principal.clone();
    expect(clone).not.toBe(principal);
    expect(clone.claims[0].value).toBe("Frank");
  });

  it("findAll returns matching claims", () => {
    const id = new ClaimsIdentity([
      new Claim(ClaimTypes.Role, "Admin"),
      new Claim(ClaimTypes.Role, "User"),
    ]);
    const principal = new ClaimsPrincipal(id);
    const roles = principal.findAll(c => c.type === ClaimTypes.Role);
    expect(roles.length).toBe(2);
  });

  it("findAllByType returns claims of given type", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Grace")]);
    const principal = new ClaimsPrincipal(id);
    const names = principal.findAllByType(ClaimTypes.Name);
    expect(names[0].value).toBe("Grace");
  });

  it("findFirst returns first matching claim", () => {
    const id = new ClaimsIdentity([
      new Claim(ClaimTypes.Role, "Admin"),
      new Claim(ClaimTypes.Role, "User"),
    ]);
    const principal = new ClaimsPrincipal(id);
    const first = principal.findFirst(c => c.type === ClaimTypes.Role);
    expect(first?.value).toBe("Admin");
  });

  it("findFirstByType returns first claim of type", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Henry")]);
    const principal = new ClaimsPrincipal(id);
    expect(principal.findFirstByType(ClaimTypes.Name)?.value).toBe("Henry");
  });

  it("findFirstValue returns value of first claim of type", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Name, "Ivy")]);
    const principal = new ClaimsPrincipal(id);
    expect(principal.findFirstValue(ClaimTypes.Name)).toBe("Ivy");
  });

  it("hasClaim returns true if predicate matches", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Role, "Admin")]);
    const principal = new ClaimsPrincipal(id);
    expect(principal.hasClaim(c => c.value === "Admin")).toBe(true);
    expect(principal.hasClaim(c => c.value === "User")).toBe(false);
  });

  it("hasClaimTypeValue returns true if claim exists", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Role, "Admin")]);
    const principal = new ClaimsPrincipal(id);
    expect(principal.hasClaimTypeValue(ClaimTypes.Role, "Admin")).toBe(true);
    expect(principal.hasClaimTypeValue(ClaimTypes.Role, "User")).toBe(false);
  });

  it("isInRole returns true if identity has role claim", () => {
    const id = new ClaimsIdentity([new Claim(ClaimTypes.Role, "Admin")]);
    const principal = new ClaimsPrincipal(id);
    expect(principal.isInRole("Admin")).toBe(true);
    expect(principal.isInRole("User")).toBe(false);
  });
});
