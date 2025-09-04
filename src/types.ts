import { Request } from "express";
import { Socket } from "socket.io";

/** Human duration string like "1h", "2d 3h", etc. */
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
export interface CreateType<K extends string = string> {
  data: any;
  expiresIn?: StringValue | number;
  keyName: K;
}

export interface CheckerType<K extends string = string> {
  token: string | undefined | null;
  keyName: K;
}

export interface ConfigType<K extends string = string> {
  keys: Record<K, string>;
}

export type OptionsType = {
  /** If required=true, middleware responds 401 instead of next() */
  required?: boolean;
};

/** Helper for consumers: infer key names from your keys object */
export type InferKeyNames<T extends Record<string, string>> = keyof T & string;
