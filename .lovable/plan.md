## Remove the login page

Since this is a design mockup, strip auth entirely so the app opens straight to the main UI.

### Changes
1. **`src/routes/_authenticated.tsx`** — Replace the auth gate with a simple pass-through that just renders `<Outlet />`. No session check, no redirect, no temp-access key.
2. **`src/routes/auth.tsx`** — Delete the file. Remove the `/auth` route entirely.
3. **`src/routes/reset-password.tsx`** — Delete the file (unreachable without auth flow).
4. **`src/components/service-secure/ServiceSecureApp.tsx`** — Remove the temp-access branches, the sign-out logic tied to auth, and any `meQuery`/session-dependent gating so the app renders unconditionally. Any "signed in as" UI becomes a static placeholder (or is removed).
5. Let TanStack Router regenerate `routeTree.gen.ts` with `/auth` and `/reset-password` gone.

### Result
Visiting `/` renders the app directly. No login screen, no redirect, no bypass button.
