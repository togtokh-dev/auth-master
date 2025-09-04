/**
 * test/index.ts
 *
 * ESM (Node >=18) дээр library-гийн бүх функцийн хэрэглээг шалгах жишээ.
 */

import { AuthMaster } from "../src/index.js";

/**
 * 1. Эхлээд токений нууц күүдээ тохируулна.
 *    constructor дуудах үед config.keys runtime дээр шинэчлэгдэнэ.
 */
const authMaster = new AuthMaster({
  userToken: "togtokh.dev.cparking.user",
  merchantToken: "togtokh.dev.cparking.merchant",
  systemToken: "togtokh.dev.cparking.admin",
  adminToken: "togtokh.dev.cparking.system",
});

async function run() {
  console.log("=== AUTH MASTER TEST START ===");

  /**
   * 2. JWT үүсгэх (create)
   *    expiresIn нь number (секунд) эсвэл string (e.g. "1h") байж болно.
   */
  const tokenResp = authMaster.create({
    data: { user_id: 1, user_role: "admin" },
    keyName: "adminToken",
    expiresIn: "1h",
  });
  console.log("create() result:", tokenResp);

  /**
   * 3. JWT шалгах (checker)
   *    create-с авсан токеноо verify хийж байна.
   */
  const checkResp = authMaster.checker({
    token: tokenResp.data!,
    keyName: "adminToken",
  });
  console.log("checker() result:", checkResp);

  /**
   * 4. Basic Auth шалгах (basic)
   *    "username:password" → base64 encode → Authorization header.
   */
  const sampleHeader =
    "Basic " + Buffer.from("togtokh:1234").toString("base64");
  const basicResp = authMaster.basic(sampleHeader);
  console.log("basic() result:", basicResp);

  // VSCode IntelliSense example (middleware signature compile OK)
  authMaster.checkTokenBearer(["userToken"], { required: true });

  console.log("=== AUTH MASTER TEST END ===");
}

run();
