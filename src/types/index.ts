

// export interface IUser<TRole, TClaim> {
//   id: string;
//   userName: string;
//   roles: TRole[];
//   claims: TClaim[];
// }

// export interface IdentityError {
//   code: string;
//   description: string;
// }

// export interface IdentityResult {
//   succeeded: boolean;
//   errors?: IdentityError[];
// }

// export interface AuthorizationResult {
//   succeeded: boolean;
// }
export interface IOptions<T> { value: T; }

export interface IManagerInfo {
  manager: string;
}

export interface ICreatorInfo {
  createBy: string;
}
