export interface AuthUser {
  id?: string | number;
  username?: string;
  name?: string;
  permissions?: string[];
  roles?: string[];
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}
