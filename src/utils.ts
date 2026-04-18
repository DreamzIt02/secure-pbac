import { randomBytes as baseBytes, randomUUID as baseUUID, scrypt, createHmac as baseHmac} from "crypto"
import { promisify as basePromisify } from "util"

export function isEmpty<T>(iterable: Iterable<T>): boolean {
  return iterable[Symbol.iterator]().next().done === true;
}

export function randomUUID(): string {
  return baseUUID()
}

export function randomBytes(arg0: number) {
    return baseBytes(arg0)
}

export function promisify() {
    return basePromisify(scrypt)
}

// Equivalent to newSecurityStamp()
export function generateBase32(): string {
    // Generate 16 random bytes and encode them as base32
    const buffer = randomBytes(16);

    // Node doesn't have native base32, so we can either:
    // 1. Use a library like `hi-base32`
    // 2. Or implement a simple base32 encoder

    // Example using hi-base32:
    // import { encode } from "hi-base32";
    // return encode(buffer).replace(/=+$/, "");

    // If we prefer built-in encoding, we can use base64url instead:
    return buffer.toString("base64url"); // modern Node 20+ encoding option
}

export function createHmac(algorithm: string, token: Buffer<ArrayBuffer>, data: Buffer<ArrayBuffer>) {
  return baseHmac(algorithm, token).update(data).digest();
}
