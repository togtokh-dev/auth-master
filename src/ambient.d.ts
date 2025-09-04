/**
 * Express Request declaration merging
 * - Library хэрэглэгчид express Request дээр шууд autocomplete авах боломжтой
 *   (import хийхгүйгээр req.tokenUser гэх мэт).
 */
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    tokenUser?: string;
    token?: string;
    authMaster?: any;
    authMasterSocket?: any;
    _id?: any;
    user_id?: any;
    role?: any;
    user?: any;
  }
}
