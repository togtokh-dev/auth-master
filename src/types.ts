import { Request } from "express";
import { Socket } from "socket.io";
// Helpers.
type Unit =
  | "Years"
  | "Year"
  | "Yrs"
  | "Yr"
  | "Y"
  | "Weeks"
  | "Week"
  | "W"
  | "Days"
  | "Day"
  | "D"
  | "Hours"
  | "Hour"
  | "Hrs"
  | "Hr"
  | "H"
  | "Minutes"
  | "Minute"
  | "Mins"
  | "Min"
  | "M"
  | "Seconds"
  | "Second"
  | "Secs"
  | "Sec"
  | "s"
  | "Milliseconds"
  | "Millisecond"
  | "Msecs"
  | "Msec"
  | "Ms";

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

export type StringValue =
  | `${number}`
  | `${number}${UnitAnyCase}`
  | `${number} ${UnitAnyCase}`;
/** Request/Socket дээр нэмэх утгууд */
export interface AuthMasterUser {
  tokenUser?: string;
  token?: string;
  authMaster?: any;
  authMasterSocket?: any;
  _id?: any;
  user_id?: any;
  role?: any;
  user?: any;
  query?: any;
  headers?: any;
}

export interface AuthMasterSocket extends Socket {
  req?: AuthMasterUser;
}

export interface AuthMasterRequest extends Request {
  tokenUser?: string;
  token?: string;
  authMaster?: any;
  authMasterSocket?: any;
  _id?: any;
  user_id?: any;
  role?: any;
  user?: any;
}

/** Public API types */
export interface CreateType {
  data: any;
  /**
   * JWT expiration
   * - number → seconds (e.g. 60, 3600)
   * - string → human format (e.g. "2d", "10h")
   */
  expiresIn?: StringValue | number;
  keyName: string;
}

export interface CheckerType {
  token: string | undefined | null;
  keyName: string;
}

export interface ConfigType<T extends string = string> {
  keys: Record<T, string>;
}

export type OptionsType = {
  /** If required=true, middleware responds 401 instead of next() */
  required?: boolean;
};

/** ---- Legacy aliases (backward-compat) ---- */
export type authMasterRequest = AuthMasterRequest;
export type authMasterSocket = AuthMasterSocket;
export type createType = CreateType;
export type ckeckerType = CheckerType; // (typo kept intentionally)
export type configType = ConfigType;
export type optionsType = OptionsType;

/** Helper for consumers: infer key names from your keys object */
export type InferKeyNames<T extends Record<string, string>> = keyof T & string;
