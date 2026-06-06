export interface JwtPayload {
  sub: string;
  login: string;
  role: string;
  iat?: number;
  exp?: number;
}
