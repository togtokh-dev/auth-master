/**
 * test/index.ts
 *
 * ESM (Node >=18) дээр library-гийн бүх функцийн хэрэглээг шалгах жишээ.
 */

import authMaster from "../src/index.js";

/**
 * 1. Эхлээд токений нууц күүдээ тохируулна.
 *    setKeys() дуудах үед config.keys runtime дээр шинэчлэгдэнэ.
 */
authMaster.setKeys({
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

  /**
   * 5. Express middleware жишээ (mock хийж үзэж болно)
   *    - checkTokenBearer
   *    - checkTokenBasic
   *
   * Энд шууд дуудалт хийхгүй, Express app дотор ашиглана.
   * Жишээ:
   *
   *   app.get("/secure",
   *     authMaster.checkTokenBearer(["adminToken"], { required: true }),
   *     (req, res) => res.json({ ok: true, user: req.user })
   *   );
   */

  /**
   * 6. Socket.IO middleware жишээ
   *    io.use(authMaster.checkTokenSocket(["userToken"], { required: true }));
   *    io.on("connection", socket => {
   *      console.log("connected user", socket.req?.user_id);
   *    });
   */

  console.log("=== AUTH MASTER TEST END ===");
}

run();
