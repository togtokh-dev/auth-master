import { Request, Response, NextFunction } from "express";
import { sign, verify } from "jsonwebtoken";

import {
  createType,
  configType,
  ckeckerType,
  optionsType,
  authMasterRequest,
  authMasterSocket,
} from "./types";
const config: configType = {
  keys: {
    TestToken: "tokenkey-1",
  },
};
const create = async ({ data, expiresIn, keyName }: createType) => {
  try {
    if (config.keys[keyName] == undefined) {
      throw "Key undefined";
    }
    const JWT_KEY = config.keys[keyName];
    const jsontoken = await sign(
      { data: data },
      JWT_KEY,
      expiresIn
        ? {
            expiresIn,
          }
        : {}
    );
    return Promise.resolve({
      success: true,
      message: "success",
      data: jsontoken,
    });
  } catch (error) {
    return Promise.resolve({
      success: false,
      message: error,
      data: null,
    });
  }
};
const checker = async ({ token, keyName }: ckeckerType) => {
  try {
    if (config.keys[keyName] == undefined) {
      throw "Key undefined";
    }
    const JWT_KEY = config.keys[keyName];
    const decoded: any = await verify(token, JWT_KEY);
    return Promise.resolve({
      success: true,
      message: "success",
      ...decoded,
    });
  } catch (error) {
    return Promise.resolve({
      success: false,
      message: error,
      data: null,
    });
  }
};
const basic = async (token: any) => {
  try {
    const token_auth = token?.split(" ");
    if (token_auth[0] == "Basic") {
      const token = await Buffer.from(token_auth[1], "base64").toString();
      return {
        success: true,
        data: {
          username: token.split(":")[0],
          password: token.split(":")[1],
        },
      };
    }
    return {
      success: false,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
    };
  }
};
const checkTokenBearer = (users: [string], options?: optionsType) => {
  return async (req: authMasterRequest, res: Response, next: NextFunction) => {
    try {
      const token_auth = req?.get("authorization");
      const token_cookie = req?.cookies.token;
      let token = undefined;
      if (token_auth) {
        token = token_auth;
        token = token?.slice(7);
      } else if (token_cookie) {
        token = token_cookie;
      }
      for (let index = 0; index < users.length; index++) {
        const user: any = users[index];
        const result = await checker({
          token: token,
          keyName: user,
        });
        if (result.success) {
          req.authMaster = result.data;
          req._id = result.data?._id;
          req.user_id = result.data?.user_id;
          req.role = result.data?.user_role;
          req.user = result.data?.result;
          req.tokenUser = user;
          req.token = token;
          next();
          return 1;
        }
      }
      if (options?.required == true) {
        return res.status(400).json({
          success: false,
          message: "Нэвтрэх шаардлагатай",
        });
      } else {
        next();
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Нэвтрэх шаардлагатай",
      });
    }
  };
};
const checkTokenBasic = ({ required }: { required?: boolean }) => {
  return async (req: authMasterRequest, res: Response, next: NextFunction) => {
    const token_auth = req.get("authorization");
    const token_cookie = req.cookies.token;
    let token = undefined;
    if (token_auth) {
      token = token_auth;
      token = token.slice(7);
    } else if (token_cookie) {
      token = token_cookie;
    }
    const result = await basic(token);
    if (result.success) {
      req.authMaster = result.data;
      req.tokenUser = "basicToken";
      next();
    } else if (required) {
      return res.status(400).json({
        success: false,
        message: "Нэвтрэх шаардлагатай",
      });
    } else {
      next();
    }
  };
};
const checkTokenSocket = (users: [string], options?: optionsType) => {
  return async (socket: authMasterSocket, next: any) => {
    try {
      const token: string =
        socket?.handshake?.headers?.authorization?.toString() ||
        socket?.handshake?.query?.Authorization?.toString();
      console.log(token);
      if (!token) {
        next(new Error("Authentication error : token алга"));
      }
      for (let index = 0; index < users.length; index++) {
        const user: any = users[index];
        const result = await checker({
          token: token,
          keyName: user,
        });
        if (result.success) {
          socket.req = {};
          socket.req.authMaster = result.data;
          socket.req._id = result.data?._id;
          socket.req.user_id = result.data?.user_id;
          socket.req.role = result.data?.user_role;
          socket.req.user = result.data?.result;
          socket.req.tokenUser = user;
          socket.req.token = token;
          socket.req.query = socket?.handshake?.query;
          socket.req.headers = socket?.handshake?.headers;
          next();
          return 1;
        }
      }
      if (options?.required == true) {
        next(new Error("Authentication error : token буруу"));
      } else {
        socket.req = {};
        socket.req.query = socket?.handshake?.query;
        socket.req.headers = socket?.handshake?.headers;
        next();
      }
    } catch (error) {
      next(new Error("Authentication error :" + error));
    }
  };
};
export default {
  create,
  checker,
  config,
  checkTokenBearer,
  checkTokenBasic,
  checkTokenSocket,
};
export { authMasterSocket as authMasterSocket } from "./types";
export { authMasterRequest as authMasterRequest } from "./types";
