import { Request } from "express";
import { Socket } from "socket.io";
interface User {
  tokenUser: string;
  token: string;
  authMaster: any;
  authMasterSocket: any;
  _id: any;
  user_id: any;
  role: any;
  user: any;
  query: any;
  headers: any;
}
export interface authMasterSocket extends Socket {
  req?: User | any;
}
export interface authMasterRequest extends Request {
  tokenUser: string;
  token: string;
  authMaster: any;
  authMasterSocket: any;
  _id: any;
  user_id: any;
  role: any;
  user: any;
}
export interface createType {
  data: any;
  /** expressed in seconds or a string describing a time span [zeit/ms](https://github.com/zeit/ms.js).  Eg: 60, "2 days", "10h", "7d" */
  expiresIn?: string | number | undefined;
  keyName: string;
}
export interface ckeckerType {
  token: any;
  keyName: string;
}
export interface configType {
  keys: any;
}
export type optionsType = {
  required: boolean;
};
