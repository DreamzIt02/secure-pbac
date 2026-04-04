// src/core/default-user-store.ts
import { IUser } from "./types.js";

/**
 * Interface for user persistence store.
 */
export interface IUserStore<TUser extends IUser> {
  create(user: TUser): Promise<void>;
  update(user: TUser): Promise<void>;
  delete(user: TUser): Promise<void>;
  findById(id: string): Promise<TUser | null>;
  findByName(userName: string): Promise<TUser | null>;
  setUserName(user: TUser, userName: string): Promise<void>;
  getUserName(user: TUser): Promise<string | null>;
  getUserId(user: TUser): Promise<string>;
  setEmail?(user: TUser, email: string): Promise<void>;
  getEmail?(user: TUser): Promise<string | null>;
}

/**
 * Default in-memory implementation of UserStore.
 * Stores users in a Map keyed by user ID.
 */
export class DefaultUserStore<TUser extends IUser> implements IUserStore<TUser> {
  private users = new Map<string, TUser>();

  async create(user: TUser): Promise<void> {
    this.users.set(user.id, user);
  }

  async update(user: TUser): Promise<void> {
    if (!this.users.has(user.id)) {
      throw new Error(`User with id ${user.id} not found`);
    }
    this.users.set(user.id, user);
  }

  async delete(user: TUser): Promise<void> {
    this.users.delete(user.id);
  }

  async findById(id: string): Promise<TUser | null> {
    return this.users.get(id) ?? null;
  }

  async findByName(userName: string): Promise<TUser | null> {
    for (const user of this.users.values()) {
      if (user.userName === userName) {
        return user;
      }
    }
    return null;
  }

  async setUserName(user: TUser, userName: string): Promise<void> {
    user.userName = userName;
    this.users.set(user.id, user);
  }

  async getUserName(user: TUser): Promise<string | null> {
    return user.userName ?? null;
  }

  async getUserId(user: TUser): Promise<string> {
    return user.id;
  }

  async setEmail(user: TUser, email: string): Promise<void> {
    user.email = email;
    this.users.set(user.id, user);
  }

  async getEmail(user: TUser): Promise<string | null> {
    return user.email ?? null;
  }
}
