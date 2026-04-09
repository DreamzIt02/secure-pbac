import crypto from "crypto";
import { IdentityUser, PasswordVerificationResult } from "../types/index.js";

interface IUser extends IdentityUser {

}

/**
 * Options for configuring the PasswordHasher.
 */
export class PasswordHasherOptions {
    compatibilityMode: PasswordHasherCompatibilityMode = PasswordHasherCompatibilityMode.IdentityV3;
    iterationCount: number = 100000;
    rng: RandomNumberGenerator = {
        getBytes(buffer: Uint8Array) {
            crypto.randomFillSync(buffer);
        }
    };
}

/**
 * Compatibility modes for PasswordHasher.
 */
export enum PasswordHasherCompatibilityMode {
    IdentityV2,
    IdentityV3
}

/**
 * Represents a random number generator.
 */
export interface RandomNumberGenerator {
    getBytes(buffer: Uint8Array): void;
}

/**
 * Provides an abstraction for hashing passwords.
 * @typeparam TUser The type used to represent a user.
 */
export interface IPasswordHasher<TUser extends IUser> {
    /**
     * Returns a hashed representation of the supplied password for the specified user.
     * @param user The user whose password is to be hashed.
     * @param password The password to hash.
     * @returns A hashed representation of the supplied password for the specified user.
     */
    hashPassword(user: TUser, password: string): string;

    /**
     * Returns a PasswordVerificationResult indicating the result of a password hash comparison.
     * @param user The user whose password should be verified.
     * @param hashedPassword The hash value for a user's stored password.
     * @param providedPassword The password supplied for comparison.
     * @returns A PasswordVerificationResult indicating the result of a password hash comparison.
     * @remarks Implementations of this method should be time consistent.
     */
    verifyHashedPassword(user: TUser, hashedPassword: string, providedPassword: string): PasswordVerificationResult;
}

/**
 * Implements the standard Identity password hashing.
 * @typeparam TUser The type used to represent a user.
 */
export class PasswordHasher<TUser extends IUser> implements IPasswordHasher<TUser> {
    private compatibilityMode: PasswordHasherCompatibilityMode;
    private iterCount: number;
    private rng: RandomNumberGenerator;

    private static readonly defaultOptions: PasswordHasherOptions = new PasswordHasherOptions();

    /**
     * Creates a new instance of PasswordHasher.
     * @param optionsAccessor The options for this instance.
     */
    constructor(optionsAccessor?: PasswordHasherOptions) {
        const options = optionsAccessor ?? PasswordHasher.defaultOptions;
        this.compatibilityMode = options.compatibilityMode;

        switch (this.compatibilityMode) {
            case PasswordHasherCompatibilityMode.IdentityV2:
                this.iterCount = 1000;
                break;
            case PasswordHasherCompatibilityMode.IdentityV3:
                this.iterCount = options.iterationCount;
                if (this.iterCount < 1) {
                    throw new Error("Invalid password hasher iteration count.");
                }
                break;
            default:
                throw new Error("Invalid password hasher compatibility mode.");
        }

        this.rng = options.rng;
    }

    /**
     * Returns a hashed representation of the supplied password for the specified user.
     * @param user The user whose password is to be hashed.
     * @param password The password to hash.
     * @returns A hashed representation of the supplied password for the specified user.
     */
    hashPassword(user: TUser, password: string): string {
        if (this.compatibilityMode === PasswordHasherCompatibilityMode.IdentityV2) {
            return this.hashPasswordV2(password);
        } else {
            return this.hashPasswordV3(password);
        }
    }

    private hashPasswordV2(password: string): string {
        const saltSize = 16; // 128-bit salt
        const subkeyLength = 32; // 256-bit subkey
        const salt = crypto.randomBytes(saltSize);
        const subkey = crypto.pbkdf2Sync(password, salt, 1000, subkeyLength, "sha1");

        const outputBytes = Buffer.alloc(1 + saltSize + subkeyLength);
        outputBytes[0] = 0x00; // format marker
        salt.copy(outputBytes, 1);
        subkey.copy(outputBytes, 1 + saltSize);

        return outputBytes.toString("base64");
    }

    private hashPasswordV3(password: string): string {
        const saltSize = 16; // 128-bit salt
        const subkeyLength = 32; // 256-bit subkey
        const salt = crypto.randomBytes(saltSize);
        const subkey = crypto.pbkdf2Sync(password, salt, this.iterCount, subkeyLength, "sha512");

        const outputBytes = Buffer.alloc(13 + salt.length + subkey.length);
        outputBytes[0] = 0x01; // format marker
        this.writeNetworkByteOrder(outputBytes, 1, 0x00000002); // prf marker for HMACSHA512
        this.writeNetworkByteOrder(outputBytes, 5, this.iterCount);
        this.writeNetworkByteOrder(outputBytes, 9, saltSize);
        salt.copy(outputBytes, 13);
        subkey.copy(outputBytes, 13 + saltSize);

        return outputBytes.toString("base64");
    }

    /**
     * Returns a PasswordVerificationResult indicating the result of a password hash comparison.
     * @param user The user whose password should be verified.
     * @param hashedPassword The hash value for a user's stored password.
     * @param providedPassword The password supplied for comparison.
     * @returns A PasswordVerificationResult indicating the result of a password hash comparison.
     * @remarks Implementations of this method should be time consistent.
     */
    verifyHashedPassword(user: TUser, hashedPassword: string, providedPassword: string): PasswordVerificationResult {
        const decoded = Buffer.from(hashedPassword, "base64");
        if (decoded.length === 0) {
            return PasswordVerificationResult.Failed;
        }

        switch (decoded[0]) {
            case 0x00:
                return this.verifyHashedPasswordV2(decoded, providedPassword);
            case 0x01:
                return this.verifyHashedPasswordV3(decoded, providedPassword);
            default:
                return PasswordVerificationResult.Failed;
        }
    }

    private verifyHashedPasswordV2(hashedPassword: Buffer, password: string): PasswordVerificationResult {
        const saltSize = 16;
        const subkeyLength = 32;
        if (hashedPassword.length !== 1 + saltSize + subkeyLength) {
            return PasswordVerificationResult.Failed;
        }

        const salt = hashedPassword.subarray(1, 1 + saltSize);
        const expectedSubkey = hashedPassword.subarray(1 + saltSize);
        const actualSubkey = crypto.pbkdf2Sync(password, salt, 1000, subkeyLength, "sha1");

        const match = crypto.timingSafeEqual(actualSubkey, expectedSubkey);
        return match ? PasswordVerificationResult.Success : PasswordVerificationResult.Failed;
    }

    private verifyHashedPasswordV3(hashedPassword: Buffer, password: string): PasswordVerificationResult {
        try {
            const iterCount = this.readNetworkByteOrder(hashedPassword, 5);
            const saltLength = this.readNetworkByteOrder(hashedPassword, 9);
            const salt = hashedPassword.subarray(13, 13 + saltLength);
            const expectedSubkey = hashedPassword.subarray(13 + saltLength);
            const actualSubkey = crypto.pbkdf2Sync(password, salt, iterCount, expectedSubkey.length, "sha512");

            const match = crypto.timingSafeEqual(actualSubkey, expectedSubkey);
            if (!match) return PasswordVerificationResult.Failed;

            if (iterCount < this.iterCount) {
                return PasswordVerificationResult.SuccessRehashNeeded;
            }
            return PasswordVerificationResult.Success;
        } catch {
            return PasswordVerificationResult.Failed;
        }
    }

    private readNetworkByteOrder(buffer: Buffer, offset: number): number {
        return (buffer[offset] << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3];
    }

    private writeNetworkByteOrder(buffer: Buffer, offset: number, value: number): void {
        buffer[offset] = (value >>> 24) & 0xff;
        buffer[offset + 1] = (value >>> 16) & 0xff;
        buffer[offset + 2] = (value >>> 8) & 0xff;
        buffer[offset + 3] = value & 0xff;
    }
}

// ### Key points:
// - **IdentityV2**: PBKDF2 with HMAC‑SHA1, 128‑bit salt, 256‑bit subkey, 1000 iterations.
// - **IdentityV3**: PBKDF2 with HMAC‑SHA512, 128‑bit salt, 256‑bit subkey, configurable iterations (default 100000).
// - **Symmetry preserved**: Methods, enums, and options match the C# reference.
// - **Docs included**: All XML comments converted to JSDoc.
// - **Node.js crypto**: Uses `crypto.pbkHere’s a fully implemented `password.hasher.ts` that mirrors the C# `PasswordHasher<TUser>` logic, using Node.js’s built‑in `crypto` module to provide strong PBKDF2 hashing for both IdentityV2 and IdentityV3 formats. This preserves maximum symmetry with the original C# code, keeps types exactly as they are, and includes verbose documentation:
