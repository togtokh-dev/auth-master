import authMaster from "../src";
authMaster.config.keys = {
  userToken: "togtokh.dev.cparking.user",
  merchantToken: "togtokh.dev.cparking.merchant",
  systemToken: "togtokh.dev.cparking.admin",
  adminToken: "togtokh.dev.cparking.system",
};

const run = async () => {
  const jsontoken = await authMaster.create({
    data: {},
    keyName: "adminToken",
    expiresIn: process.env.JWT_EXPIRESIN,
  });

  console.log(jsontoken);
};
run();
