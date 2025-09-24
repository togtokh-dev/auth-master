/**
 * auth-master (class version)
 * Express + Socket.IO JWT/Auth middleware
 * Author: TOGTOKH.DEV
 */

import type { Request, Response, NextFunction } from "express";
import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import type {
  AuthMasterRequest,
  AuthMasterSocket,
  CreateType,
  CheckerType,
  ConfigType,
  OptionsType,
  InferKeyNames,
} from "./types.js";

/* -------------------------------------------------
 * Helpers
 * ------------------------------------------------- */
type JsonResp<T = any> = {
  data: T | null;
  success: boolean;
  message: string;
  code: string; // e.g. "200", "401"
};

function stripBearer(input?: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  return trimmed.toLowerCase().startsWith("bearer ")
    ? trimmed.slice(7).trim()
    : trimmed;
}

function getBearerFromRequest(req: Request): string | undefined {
  const h = req.get("authorization");
  const c = (req as any)?.cookies?.token;
  const q = (req as any)?.query?.authMasterTokenBearer as string | undefined;
  return h ? stripBearer(h) : c ?? q;
}

/* -------------------------------------------------
 * Class
 * ------------------------------------------------- */
export class AuthMaster<
  TKeys extends Record<string, string> = Record<string, string>,
> {
  private _config: ConfigType<keyof TKeys & string>;

  constructor(keys?: TKeys) {
    this._config = {
      keys: (keys ?? ({} as TKeys)) as Record<keyof TKeys & string, string>,
    };
  }

  /** Runtime config getter */
  get config() {
    return this._config;
  }

  /** setKeys: дуртай үедээ шинэчилж болно */
  public setKeys<T extends Record<string, string>>(keys: T) {
    // widen to string-indexed map but preserve key union for generics
    this._config = {
      keys: keys as unknown as Record<keyof T & string, string>,
    };
    return this._config as ConfigType<keyof T & string>;
  }

  /* ================= JWT ================= */

  public create(
    args: CreateType<InferKeyNames<(typeof this._config)["keys"]>>,
  ): JsonResp<string> {
    try {
      const { data, expiresIn, keyName } = args;
      const key = this._config.keys[keyName];
      if (!key) throw new Error("Key undefined");

      const options: SignOptions = {
        algorithm: "HS256",
        ...(expiresIn ? { expiresIn } : {}),
      };

      const token = jwt.sign({ data }, key, options);
      return { success: true, message: "success", data: token, code: "200" };
    } catch (err: any) {
      return {
        success: false,
        message: String(err?.message || err),
        data: null,
        code: "500",
      };
    }
  }

  public checker(
    args: CheckerType<InferKeyNames<(typeof this._config)["keys"]>>,
  ): JsonResp<{
    data: any;
    iat: number | undefined;
    exp: number | undefined;
  }> {
    try {
      const { token, keyName } = args;
      const key = this._config.keys[keyName];
      if (!key) throw new Error("Key undefined");
      if (!token) throw new Error("Token missing");

      const clean = stripBearer(token);
      const vopts: VerifyOptions = { algorithms: ["HS256"] };
      const decoded: any = jwt.verify(clean, key, vopts);

      return { success: true, message: "success", data: decoded, code: "200" };
    } catch (err: any) {
      return {
        success: false,
        message: String(err?.message || err),
        data: null,
        code: "401",
      };
    }
  }

  /* ================= Basic ================= */

  public basic(
    authHeader?: string,
  ): JsonResp<{ username: string; password: string }> {
    try {
      if (!authHeader) {
        return {
          success: false,
          message: "Missing header",
          data: null,
          code: "400",
        };
      }
      const [scheme, value] = authHeader.split(" ");
      if (scheme !== "Basic" || !value) {
        return {
          success: false,
          message: "Invalid header",
          data: null,
          code: "400",
        };
      }
      const decoded = Buffer.from(value, "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      if (idx === -1) {
        return {
          success: false,
          message: "Invalid Basic payload",
          data: null,
          code: "400",
        };
      }
      const username = decoded.slice(0, idx);
      const password = decoded.slice(idx + 1);
      return {
        success: true,
        message: "success",
        data: { username, password },
        code: "200",
      };
    } catch (err: any) {
      return {
        success: false,
        message: String(err?.message || err),
        data: null,
        code: "500",
      };
    }
  }

  /* ================= Express middlewares ================= */

  public checkTokenBearer(
    users: Array<InferKeyNames<(typeof this._config)["keys"]>>,
    options?: OptionsType,
  ) {
    return (req: AuthMasterRequest, res: Response, next: NextFunction) => {
      try {
        const token = getBearerFromRequest(req);

        for (const keyName of users) {
          const result = this.checker({ token, keyName });
          if (result.success && result.data) {
            const payload = result.data.data;
            req.authMaster = payload;
            req._id = payload?._id;
            req.user_id = payload?.user_id;
            req.role = payload?.user_role;
            req.user = payload?.result;
            req.tokenUser = keyName;
            req.token = token as string;
            return next();
          }
        }

        if (options?.required) {
          return res.status(401).json({
            data: null,
            success: false,
            message: "Unauthorized",
            code: "401",
          } as JsonResp);
        }

        return next();
      } catch {
        return res.status(401).json({
          data: null,
          success: false,
          message: "Unauthorized",
          code: "401",
        } as JsonResp);
      }
    };
  }

  public checkTokenBasic({ required }: OptionsType = {}) {
    return (req: AuthMasterRequest, res: Response, next: NextFunction) => {
      const token =
        req.get("authorization") ??
        (req as any)?.cookies?.token ??
        ((req as any)?.query?.authMasterTokenBasic as string | undefined);

      const result = this.basic(token);
      if (result.success) {
        req.authMaster = result.data;
        req.tokenUser = "basicToken";
        return next();
      }

      if (required) {
        return res.status(401).json({
          data: null,
          success: false,
          message: "Unauthorized",
          code: "401",
        } as JsonResp);
      }

      return next();
    };
  }

  /* ================= Socket.IO middleware ================= */

  public checkTokenSocket(
    users: Array<InferKeyNames<(typeof this._config)["keys"]>>,
    options?: OptionsType,
  ) {
    return (socket: AuthMasterSocket, next: (err?: Error) => void) => {
      try {
        const raw =
          socket?.handshake?.headers?.authorization?.toString() ??
          (socket?.handshake?.query?.Authorization as string | undefined) ??
          (socket?.handshake?.query?.authMasterTokenBearer as
            | string
            | undefined);

        const token = stripBearer(raw);

        for (const keyName of users) {
          const result = this.checker({ token, keyName });
          if (result.success && result.data) {
            const payload = result.data.data;
            socket.req = {
              authMaster: payload,
              _id: payload?._id,
              user_id: payload?.user_id,
              role: payload?.user_role,
              user: payload?.result,
              tokenUser: keyName,
              token,
              query: socket.handshake.query,
              headers: socket.handshake.headers,
            };
            return next();
          }
        }

        if (options?.required) {
          return next(new Error("Authentication error: invalid token"));
        }

        socket.req = {
          query: socket.handshake.query,
          headers: socket.handshake.headers,
        };
        return next();
      } catch (err: any) {
        return next(
          new Error(`Authentication error: ${String(err?.message || err)}`),
        );
      }
    };
  }
}

/* -------------------------------------------------
 * Default export: хоцрогдолгүй API
 * ------------------------------------------------- */
const authMaster = new AuthMaster();
export default authMaster;

// named exports for types (optional re-export)
export type {
  AuthMasterRequest,
  AuthMasterSocket,
  CreateType,
  CheckerType,
  ConfigType,
  OptionsType,
} from "./types.js";
