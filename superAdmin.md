# Super Admin — Complete Flow Document

## What is a Super Admin?

A **single, env-based admin account** stored in `backend/.env` — **not** in MongoDB. It cannot be deleted, changed, or cloned via the app. Only one exists. It manages other admins.

---

## Current Super Admin

- **Email:** `ibrahim@admin.com` (set in `backend/.env` as `SUPER_ADMIN_EMAIL`)
- **Password:** stored only as bcrypt hash in `SUPER_ADMIN_PASSWORD_HASH`
- **Plain password:** in your Bitwarden / password manager

---

## To create a NEW Super Admin (replace the current one)

### Step 1 — Generate a new password hash

In `backend/` terminal:

```bash
node -e "const b = require('bcryptjs'); b.hash('YOUR_NEW_PASSWORD', 10).then(h => console.log(h));"
```

Replace `YOUR_NEW_PASSWORD` with a strong password (20+ chars, mixed case, symbols). **Save the plain password to your password manager.**

Example output:
```
$2a$10$abc123...longhash...xyz789
```

Copy the **entire hash** including `$2a$10$`.

### Step 2 — Update `backend/.env`

Open `backend/.env` and change these two lines:

```
SUPER_ADMIN_EMAIL=newowner@axicollection.com
SUPER_ADMIN_PASSWORD_HASH=$2a$10$abc123...longhash...xyz789
```

- **No quotes** around the hash
- **No trailing spaces**
- **No line breaks** in the middle of the hash

Save the file.

### Step 3 — Restart the backend

`.env` is only read on startup.

```bash
# In backend terminal: Ctrl + C to stop, then:
npm run dev
```

Wait for:
```
Server running on port 5000
```

### Step 4 — Test the new credentials

Open DevTools → Console:

```js
fetch('http://localhost:5000/api/auth/admin-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newowner@axicollection.com',
    password: 'YOUR_NEW_PASSWORD'
  })
})
  .then(r => r.json())
  .then(d => console.log('LOGIN:', d));
```

Expected:
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "id": "superadmin", "role": "superadmin", "email": "newowner@axicollection.com" }
}
```

### Step 5 — Log out old sessions

Old tokens signed with the previous Super Admin email still work **until they expire** (7 days). To invalidate them immediately, change `JWT_SECRET` in `backend/.env` and restart:

```
JWT_SECRET=<generate a fresh 64-char random string>
```

This invalidates **every** token — customers, admins, and Super Admin. Everyone must log in again. Do this only when you need a hard reset.

---

## To have MULTIPLE Super Admins (not currently supported)

The current design supports **only one** Super Admin. If you want two or more:

### Option A — Promote a regular admin

1. Log in as Super Admin
2. Go to `/admin/admins`
3. Create a new admin with the second person's email
4. That person logs in as a **regular admin** — they can manage products, orders, categories, homepage, settings
5. They **cannot** manage other admins (only you can)

**This is the recommended flow.** Regular admins do 95% of the work; you retain top-level control.

### Option B — Modify the code to support multiple Super Admins

Requires code changes:

| File | Change |
|------|--------|
| `backend/.env` | Change `SUPER_ADMIN_EMAIL` to `SUPER_ADMIN_EMAILS` (comma-separated) |
| `backend/src/config/env.js` | Return array of emails instead of single string |
| `backend/src/controllers/authController.js` | Loop through emails in `adminLogin` |
| `backend/src/middleware/auth.js` | Allow multiple superadmin identities |

**Not recommended.** Multiple Super Admins means multiple ways to compromise the system. One is enough.

---

## Files involved

| File | Purpose |
|------|---------|
| `backend/.env` | Stores `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD_HASH` |
| `backend/src/config/env.js` | Reads env vars, exposes `config.superAdminEmail` and `config.superAdminPasswordHash` |
| `backend/src/controllers/authController.js` → `adminLogin` | Checks env credentials first, falls back to DB admin |
| `backend/src/middleware/auth.js` → `protect`, `requireSuperAdmin` | Identifies Super Admin from JWT, enforces role |
| `backend/src/controllers/adminController.js` | Functions: `getAdmins`, `createAdmin`, `updateAdmin`, `deleteAdmin` |
| `backend/src/routes/adminRoutes.js` | Routes guarded by `requireSuperAdmin` |
| `frontend/src/pages/AdminManageAdmins.jsx` | UI for managing regular admins |
| `frontend/src/components/admin/AdminSidebar.jsx` | Shows "Manage Admins" link only to Super Admin |

---

## Variables

| Variable | Where | Value |
|----------|-------|-------|
| `SUPER_ADMIN_EMAIL` | `.env` | Email address |
| `SUPER_ADMIN_PASSWORD_HASH` | `.env` | bcrypt hash (60 chars) |
| `config.superAdminEmail` | runtime | Reads from env |
| `config.superAdminPasswordHash` | runtime | Reads from env |
| JWT payload `id` | signed token | Always the string `"superadmin"` |
| JWT payload `role` | signed token | Always the string `"superadmin"` |

---

## Quick reference — common tasks

| Task | How |
|------|-----|
| **View current Super Admin email** | `type backend\.env \| findstr SUPER_ADMIN_EMAIL` |
| **Change Super Admin password** | Generate new hash → update `.env` → restart backend |
| **Change Super Admin email** | Update `SUPER_ADMIN_EMAIL` in `.env` → restart backend |
| **Lock out all sessions** | Change `JWT_SECRET` in `.env` → restart backend |
| **Create a regular admin** | Log in as Super Admin → `/admin/admins` → Create |
| **Delete a regular admin** | Log in as Super Admin → `/admin/admins` → trash icon |
| **Block a regular admin** | Same as delete — there is no "disable" state, only delete |

---

## Rules

1. **Only one Super Admin exists at a time.** Replacing it means editing `.env`.
2. **Super Admin is never stored in MongoDB.** It cannot be seen or modified from `/admin/admins`.
3. **Super Admin cannot shop.** Cart routes reject it with 403. It exists only for administration.
4. **Regular admins can do everything except manage admins.** They cannot see `/admin/admins`, cannot create/delete admins, cannot change other admins' credentials.
5. **Regular admins can change their own password** (planned; may not be wired yet).
6. **Deleting the last regular admin is refused** by the backend. There must always be at least one, or zero (in which case only Super Admin exists).
7. **Super Admin password is never in the DB, never in Git, never in the code.** Only `.env` (hashed) and your password manager (plain).

---

That's the entire Super Admin system. If you want the multi-Super-Admin variant, say so and I'll walk you through the code changes — but single Super Admin is the safer, recommended design.