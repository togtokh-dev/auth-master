# auth-master

**ESM-first**, class-based JWT & Basic authentication middleware for **Express** and **Socket.IO**.  
✅ ESM primary · ✅ TypeScript types · ✅ Lightweight

```
auth-master/
├─ src/
│  ├─ index.ts
│  ├─ types.ts
│  └─ ambient.d.ts
├─ test/
│  └─ index.ts
├─ tsconfig.json
├─ package.json
└─ README.md
```

---

## Install

```bash
npm i auth-master
# peer deps you likely already have in your app:
npm i express jsonwebtoken socket.io
# dev types (recommended for TS users)
npm i -D @types/express @types/jsonwebtoken @types/socket.io
```

- **Node.js**: v18+ recommended
- **TypeScript**: TS 5+
- **Module system**: ESM-only (no CJS build)

---

## Quick Start (Class API)

```ts
import { AuthMaster } from "auth-master";

// 1) Register your token keys via the constructor (names are fully custom)
const authMaster = new AuthMaster({
  userToken: "secret-user-key",
  merchantToken: "secret-merchant-key",
  systemToken: "secret-system-key",
  adminToken: "secret-admin-key",
});

// 2) Create a JWT
const tokenRes = authMaster.create({
  data: { user_id: 123, user_role: "admin" },
  keyName: "adminToken",
  expiresIn: "1h", // or 3600
});
console.log(tokenRes); // { data: string|null, success: boolean, message: string, code: "200"|"500" }

// 3) Express: Protect a route using Bearer token
import express from "express";
const app = express();

app.get(
  "/secure",
  authMaster.checkTokenBearer(["adminToken", "systemToken"], {
    required: true,
  }),
  (req, res) => {
    res.json({ ok: true, user: req.user, role: req.role });
  },
);
```

> Need to rotate keys at runtime? Use `authMaster.setKeys({...})` at any time.

---

## Also supports Basic Auth

```ts
app.get(
  "/basic",
  authMaster.checkTokenBasic({ required: true }),
  (req, res) => {
    res.json({ basic: req.authMaster });
  },
);
```

---

## Socket.IO

```ts
import { Server } from "socket.io";
import { createServer } from "http";

const server = createServer();
const io = new Server(server, { cors: { origin: "*" } });

io.use(authMaster.checkTokenSocket(["userToken"], { required: true }));

io.on("connection", (socket) => {
  socket.emit("hello", { uid: socket.req?.user_id ?? "anonymous" });
});
```

---

## Response Shape

All exported functions and middleware-produced responses **conform to a single shape**:

```ts
type JsonResp<T = any> = {
  data: T | null;
  success: boolean;
  message: string;
  code: string; // HTTP-like code as string: "200", "400", "401", "500", ...
};
```

- `create`, `checker`, `basic` return this shape directly.
- Middleware returns this shape on errors (e.g. `401`) via `res.status(...).json(...)`.

---

## API Reference

### `new AuthMaster(keys?: Record<string, string>)`

Registers your JWT secrets by **name** (the name will be referenced as `keyName` elsewhere).

```ts
const authMaster = new AuthMaster({
  userToken: "secret-user-key",
  merchantToken: "secret-merchant-key",
  systemToken: "secret-system-key",
  adminToken: "secret-admin-key",
});
```

- Keys are stored in-memory (per-process).
- You can also later call `authMaster.setKeys({...})` to replace them at runtime.

---

### `setKeys(keys: Record<string, string>) => { keys: Record<string, string> }`

Replaces the current key map at runtime.

```ts
authMaster.setKeys({
  userToken: "new-user-key",
  adminToken: "new-admin-key",
});
```

---

### `create(args: CreateType): JsonResp<string>`

**Create** a JWT using one of your registered keys.

**Type**

```ts
interface CreateType {
  data: any; // Payload to embed → stored under { data: ... }
  keyName: string; // One of the names you registered
  expiresIn?: string | number; // e.g. "1h", "2d", or 3600 (seconds)
}
```

**Returns**

- On success: `{ success: true, code: "200", data: "<jwt>", message: "success" }`
- On error: `{ success: false, code: "500", data: null, message: "..." }`

**Example**

```ts
const res = authMaster.create({
  data: { user_id: 1, user_role: "admin" },
  keyName: "adminToken",
  expiresIn: "1h",
});
```

---

### `checker(args: CheckerType): JsonResp<any>`

**Verify** a JWT using one of your registered keys.

**Type**

```ts
interface CheckerType {
  token: string | null | undefined; // Bearer token string (with or without "Bearer ")
  keyName: string; // one of your keys
}
```

**Returns**

- On success: `{ success: true, code: "200", data: <decoded>, message: "success" }`
- On failure: `{ success: false, code: "401", data: null, message: "<reason>" }`

**Example**

```ts
const check = authMaster.checker({
  token: tokenRes.data!,
  keyName: "adminToken",
});
```

---

### `basic(authHeader?: string): JsonResp<{ username: string; password: string }>`

Decodes **Basic** authorization header into `{ username, password }`.

**Example**

```ts
const header = "Basic " + Buffer.from("john:secret").toString("base64");
const res = authMaster.basic(header);
// { success: true, code: "200", data: { username: "john", password: "secret" }, message: "success" }
```

On invalid/missing header, returns `success: false` with `code: "400"` or `"500"`.

---

### `checkTokenBearer(allowedKeys: string[], options?: { required?: boolean })`

**Express middleware** that verifies a **Bearer** token (header/cookie/query).

- **Accepted token sources** (first match wins):

  - `Authorization: Bearer <token>`
  - Cookie: `token`
  - Query: `?authMasterTokenBearer=<token>`

- **If verified**:

  - Calls `next()`
  - Populates these fields on `req`:
    - `req.tokenUser` (the key name that passed)
    - `req.token` (raw token)
    - `req.authMaster` (full JWT payload)
    - `req._id`, `req.user_id`, `req.role`, `req.user` (if present in payload)

- **If not verified**:
  - If `required: true` → `res.status(401).json({ data:null, success:false, message:"Unauthorized", code:"401" })`
  - Otherwise → `next()` (let your handler decide)

---

### `checkTokenBasic(options?: { required?: boolean })`

**Express middleware** that parses **Basic** auth from:

- `Authorization: Basic <base64>`
- Cookie `token`
- Query `?authMasterTokenBasic=<Basic ...>`

**Behavior**

- On success: `next()` and `req.authMaster = { username, password }`, `req.tokenUser = "basicToken"`
- On failure:
  - If `required: true` → 401 JSON (standard shape)
  - Otherwise → `next()`

---

### `checkTokenSocket(allowedKeys: string[], options?: { required?: boolean })`

**Socket.IO middleware** that verifies a Bearer token from:

- `socket.handshake.headers.authorization`
- `socket.handshake.query.Authorization`
- `socket.handshake.query.authMasterTokenBearer`

**Behavior**

- On success: attaches `socket.req = { ... }` with the same fields as the Express variant.
- On failure:
  - If `required: true` → `next(new Error("Authentication error: invalid token"))`
  - Otherwise → `socket.req = { query, headers }` and `next()`

---

## TypeScript Types

Key exported types (from `types.ts`):

```ts
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

export interface AuthMasterSocket extends Socket {
  req?: {
    tokenUser?: string;
    token?: string;
    authMaster?: any;
    _id?: any;
    user_id?: any;
    role?: any;
    user?: any;
    query?: any;
    headers?: any;
  };
}

export interface CreateType {
  data: any;
  keyName: string; // must match a name registered in constructor/setKeys()
  expiresIn?: string | number; // "1h", "2d", or seconds
}

export interface CheckerType {
  token: string | null | undefined;
  keyName: string;
}

export interface ConfigType<T extends string = string> {
  keys: Record<T, string>;
}

export type OptionsType = {
  required?: boolean;
};
```

> The library also includes an ambient declaration that **merges** these fields into Express’s `Request`, so you get autocompletion on `req.user`, `req.user_id`, etc., without extra imports.

---

## Build

```bash
npm run build
```

- Output: ESM → `dist/index.js`, types → `dist/index.d.ts`

---

## License

ISC © TOGTOKH.DEV
