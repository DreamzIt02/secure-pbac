import { randomBytes as baseBytes, randomUUID as baseUUID, scrypt } from "crypto"
import { promisify as basePromisify } from "util"

export function randomUUID(): string {
  return baseUUID()
}

export function randomBytes(arg0: number) {
    return baseBytes(arg0)
}

export function promisify() {
    return basePromisify(scrypt)
}