# Auth Sign-up / Sign-in Design

**Date:** 2026-04-12
**Status:** Approved (brainstorming complete)

## Goal

Add an optional email/password + Google OAuth sign-in flow so that users can persist their learning progress across devices and browser cookie clears. Today the app uses Supabase anonymous auth silently — users have no UI to convert their anon session into a permanent account.

## Non-goals

- Mandatory sign-in (the app remains fully usable anonymously)
- Social providers other than Google
- Password reset UI (Supabase's built-in "forgot password" email flow is sufficient)
- User profile/avatar upload, account deletion screen
- Server-side session access (keep everything client-side like existing `database.ts`)

---

## Architecture

Client-side only. The Supabase SSR client is already wired in `src/lib/supabase.ts`. Leverage Supabase's built-in anonymous-user upgrade flow so that the `auth.users.id` UUID stays the same after sign-up — this means zero migration code for `user_progress` rows.

### Anonymous → authenticated data flow

No rows are copied, no UUIDs change. The `auth.users` row is updated in place.

**Before signup (anonymous user browsing):**
```
auth.users
  id: abc-123
  email: NULL
  is_anonymous: true
  encrypted_password: NULL

user_progress
  user_id: abc-123
  read_topics: [...]
  bookmarks: [...]
```

**After `supabase.auth.updateUser({ email, password })`:**
```
auth.users
  id: abc-123            (SAME UUID)
  email: "user@gmail.com"
  is_anonymous: false
  encrypted_password: <hash>

auth.identities          (NEW ROW)
  user_id: abc-123
  provider: "email"

user_progress            (UNTOUCHED)
  user_id: abc-123
  read_topics: [...]
  bookmarks: [...]
```

### Email + Google collision handling

**Email confirmation is required.** Supabase dashboard setting: `Auth > Settings > Confirm email: ON`. This prevents account duplication when a user signs up with email/password and later signs in with Google using the same address.

- If the email is confirmed and a user later signs in with Google using the same address, Supabase automatically links the Google identity to the existing user (one account, two login methods).
- If the email was never confirmed, Google sign-in would create a new duplicate user — email confirmation blocks this.

### Components + hook

Four new units, all client-side:

| Unit | Path | Responsibility |
|---|---|---|
| `AuthProvider` + `useAuth()` | `src/lib/auth-context.tsx` | Wraps Supabase auth; subscribes to `onAuthStateChange`; exposes user state and action methods |
| `AuthModal` | `src/components/auth/AuthModal.tsx` | Portal-rendered modal with Đăng nhập / Đăng ký tabs + Google button |
| `AuthButton` | `src/components/auth/AuthButton.tsx` | Navbar slot: "Đăng nhập" button (anon) or avatar + dropdown (authenticated) |
| `SignInToast` | `src/components/auth/SignInToast.tsx` | 10-min delayed, bottom-right, auto-dismiss 8s |
| Email confirmation page | `src/app/auth/callback/page.tsx` | Handles Supabase's confirmation redirect |

### `useAuth()` API

```ts
interface AuthContextValue {
  user: User | null;              // null while loading
  isAnonymous: boolean;           // user?.is_anonymous === true
  isAuthenticated: boolean;       // user !== null && !isAnonymous
  loading: boolean;               // true on first mount until onAuthStateChange fires

  signUp(email: string, password: string): Promise<{ error?: string }>;
  signIn(email: string, password: string): Promise<{ error?: string }>;
  signUpGoogle(): Promise<{ error?: string }>;      // attach Google to current anon session
  signInGoogle(): Promise<{ error?: string }>;      // sign in to existing Google-linked account
  signOut(): Promise<void>;
}
```

- `signUp` calls `supabase.auth.updateUser({ email, password })` when the session is anonymous; falls back to `signUp({ email, password })` otherwise. Always triggers Supabase's confirmation email.
- `signIn` calls `signInWithPassword`. If the current session was anonymous, Supabase discards the anon user and switches to the permanent user. The `ProgressProvider` will react to the user-id change and reload progress.
- `signUpGoogle` calls `linkIdentity({ provider: 'google', options: { redirectTo: ... } })` — used from the "Đăng ký" tab. Attaches Google to the current anon user, preserving the UUID. If the Google email is already linked to another verified user, Supabase returns an error and we surface "Email đã được đăng ký".
- `signInGoogle` calls `signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })` — used from the "Đăng nhập" tab. Signs into the user whose verified email matches the Google account.
- `signOut` calls `signOut()`; subsequent calls to `ensureAnonymousAuth()` will create a fresh anon user with a new UUID.

Provider wraps `AppShell` as a sibling of `ProgressProvider`. The existing `database.ts::ensureAnonymousAuth()` remains — it's still how the app creates the initial session on first load.

### Progress reload on auth state change

`ProgressProvider` currently only loads progress once on mount. Update it to subscribe to `onAuthStateChange` and reload when the user ID changes (handles sign-in from another device, and sign-out → new anon).

---

## Components

### AuthModal

Portal-rendered into `document.body` (same pattern as the fixed `LearningObjectivesModal`):
- Wrapper: `fixed inset-0 z-[200] cmd-backdrop flex items-center justify-center p-4`
- Inner: `relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl`

Two tabs: **Đăng nhập** (default) and **Đăng ký**, selected via state.

```
┌─────────────────────────────────────┐
│  [Đăng nhập | Đăng ký]          [X] │
├─────────────────────────────────────┤
│                                     │
│  [🔵 Tiếp tục với Google]           │
│                                     │
│  ─────── hoặc ───────                │
│                                     │
│  Email                              │
│  [___________________________]      │
│                                     │
│  Mật khẩu                           │
│  [___________________________]      │
│                                     │
│  [ Đăng nhập / Đăng ký ]            │
│                                     │
│  (Quên mật khẩu?)                   │
│                                     │
└─────────────────────────────────────┘
```

**Signup success state:** replace form with "Vui lòng kiểm tra email `user@gmail.com` để xác nhận tài khoản." plus a "Đóng" button. No auto-redirect.

**"Quên mật khẩu?"** link triggers Supabase's `resetPasswordForEmail(email, { redirectTo: '/auth/reset' })`. Actual reset page is out of scope (handled by Supabase's default magic link UX for now).

### AuthButton

Placed in `Navbar.tsx` next to `ThemeToggle`.

- **Anonymous state:** `<button>Đăng nhập</button>` — style matches CommandPalette trigger (bordered, compact). Opens `AuthModal`.
- **Authenticated state:** circular avatar button (32×32). Image source: `user.user_metadata.avatar_url` (from Google) or fallback to first letter of email in accent color. Clicking opens a dropdown menu:
  ```
  ┌──────────────────────┐
  │ user@gmail.com       │
  ├──────────────────────┤
  │ 🚪 Đăng xuất         │
  └──────────────────────┘
  ```

### SignInToast

Mounted once in `AppShell`, below `BottomNav`. Portal-rendered into `document.body` with `fixed bottom-6 right-6 z-[150]`.

**Trigger logic:**
- On mount, if `isAnonymous` and localStorage key `auth-toast-last-shown-at` is either missing or older than 24 hours:
  - `setTimeout(() => show(), 10 * 60 * 1000)`
- If user authenticates before 10 min elapses: clear timer, never show.
- On show: slide-in animation, auto-dismiss 8s. Store `Date.now()` in localStorage.
- On dismiss (X button or after 8s): hide.
- Click the toast body or "Đăng nhập" CTA: opens `AuthModal` pre-set to Đăng ký tab.

**Layout:**
```
┌───────────────────────────────────────────┐
│ 💾 Lưu tiến độ học?               [X]    │
│ Đăng ký miễn phí để đồng bộ               │
│ bookmarks và chủ đề đã đọc.               │
│                        [ Đăng ký ]        │
└───────────────────────────────────────────┘
```

### Email confirmation callback page

New route: `src/app/auth/callback/page.tsx` (client component).

1. On mount, read `code` from URL query params
2. Call `supabase.auth.exchangeCodeForSession(code)`
3. On success: show "Xác nhận thành công, đang chuyển hướng..." for ~500ms, then `router.push('/')`
4. On failure: show error + "Về trang chủ" button

---

## User Flows

### Flow A — Fresh user signs up (happy path)
1. User browses site anonymously → `ensureAnonymousAuth()` creates anon user `abc-123` → user bookmarks a topic (saved under `user_progress.user_id = abc-123`).
2. User clicks "Đăng nhập" in navbar → `AuthModal` opens → switches to "Đăng ký" tab → enters email + password.
3. Form submits → `signUp()` calls `supabase.auth.updateUser({ email, password })` on the existing anon session.
4. `auth.users.abc-123` row is updated: email set, `is_anonymous: false`, `encrypted_password: <hash>`. A row in `auth.identities` is added linking `provider: 'email'` to `user_id: abc-123`.
5. Supabase sends confirmation email to the user's inbox. Modal replaces form with "Check email" message.
6. User clicks the link in the email → browser opens `https://ai-edu-app.vercel.app/auth/callback?code=...` → callback page calls `exchangeCodeForSession` → `email_confirmed_at` is set → redirect to `/`.
7. Navbar re-renders with avatar (email initial since no avatar_url yet); all bookmarks/read_topics still present because the UUID never changed.

### Flow B — Returning user on a new device
1. User loads the site → `ensureAnonymousAuth()` creates throwaway anon user `def-456` (empty progress).
2. User clicks "Đăng nhập" → "Đăng nhập" tab → enters existing email + password.
3. `signIn()` calls `signInWithPassword`. Supabase discards the anon user and switches the session to permanent user `abc-123`.
4. `onAuthStateChange` fires → `AuthProvider` updates `user`; `ProgressProvider` sees user-id change and re-fetches progress from `abc-123`.
5. UI now shows their real progress and bookmarks.

### Flow C — Google OAuth on "Đăng ký" tab (first-time user)
1. User is anon, opens `AuthModal`, stays on default "Đăng ký" tab, clicks "Tiếp tục với Google".
2. `signUpGoogle()` calls `supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`.
3. Browser redirects to Google consent screen → user approves → Google redirects to `/auth/callback?code=...`.
4. Callback exchanges code. Session is now linked to Google identity with the same UUID. `auth.identities` has a new row with `provider: 'google'`. Email from Google is pre-verified — no confirmation email step.
5. Redirect to `/` → navbar shows avatar from `user_metadata.avatar_url`.
6. **Edge case:** if the Google email already belongs to another verified user, `linkIdentity` returns an error. We catch it and show "Email này đã có tài khoản. Chuyển sang đăng nhập?" with a button that auto-switches to the "Đăng nhập" tab and retries via `signInGoogle`.

### Flow D — Google OAuth on "Đăng nhập" tab (returning user, any device)
1. User clicks "Đăng nhập" tab in `AuthModal`, clicks "Tiếp tục với Google".
2. `signInGoogle()` calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })`.
3. Google consent → callback → Supabase matches the verified Google email to existing user `abc-123` → signs in. Any active anon session is discarded.
4. `onAuthStateChange` fires → `ProgressProvider` reloads progress from the permanent user. UI updates.

### Flow E — 10-minute toast
1. App mounts → `SignInToast` checks `isAnonymous` and `localStorage['auth-toast-last-shown-at']`.
2. If conditions pass, sets `setTimeout(() => show(), 600_000)`.
3. At 10 min: toast slides in from bottom-right, localStorage timestamp is written, `setTimeout(() => hide(), 8000)` starts.
4. If user authenticates before 10 min: cleanup cancels the pending timer.
5. If user dismisses (X button): timer cancelled, localStorage already set on show.

### Flow F — Sign out
1. User clicks avatar → dropdown → "Đăng xuất".
2. `signOut()` → Supabase clears session cookies/localStorage.
3. `onAuthStateChange` fires with `user: null` → `ProgressProvider` resets to empty state → `ensureAnonymousAuth()` on next interaction creates fresh anon user.
4. Navbar re-renders with "Đăng nhập" button.

---

## Error Handling

| Error | User message (Vietnamese) | Handling |
|---|---|---|
| Email already registered | "Email đã được đăng ký. Thử đăng nhập?" | Auto-switch to "Đăng nhập" tab with email prefilled |
| Wrong password / invalid email | "Sai email hoặc mật khẩu." | Inline error below form |
| Password < 6 chars | "Mật khẩu tối thiểu 6 ký tự." | Inline, live validation on blur |
| Invalid email format | "Email không hợp lệ." | Inline, live validation on blur |
| Google OAuth user cancels | — (silent) | Modal stays open, no error shown |
| Google OAuth network failure | "Đăng nhập Google thất bại. Vui lòng thử lại." | Inline error at top of modal |
| Supabase rate limit (>5 signups/hour per IP) | "Quá nhiều yêu cầu. Vui lòng đợi 60 giây." | Disable submit button for 60s |
| Offline | "Không có kết nối mạng." | Inline, with retry button |
| Confirmation callback code expired | "Liên kết xác nhận đã hết hạn. Vui lòng đăng ký lại." | Show on `/auth/callback` page with "Đăng ký lại" button |

---

## Supabase Dashboard Configuration (one-time setup)

Manual configuration required before deployment. Document in `CONTRIBUTING.md` so contributors can set up their own project:

1. **Auth > Providers > Email:** ensure "Enable email provider" is ON, "Secure email change" is ON, "Confirm email" is ON.
2. **Auth > Providers > Google:** enable. Set Client ID and Client Secret from Google Cloud Console. Redirect URL: `https://<project-ref>.supabase.co/auth/v1/callback`.
3. **Auth > URL Configuration:** set Site URL to `https://ai-edu-app.vercel.app`. Add `https://ai-edu-app.vercel.app/auth/callback` to Redirect URLs allow-list.
4. **Auth > Email Templates > Confirm signup:** customize subject to "Xác nhận đăng ký tài khoản AI Cho Mọi Người" and body text in Vietnamese (keep the `{{ .ConfirmationURL }}` token).

Google Cloud Console:
1. Create OAuth 2.0 Client ID (Web application).
2. Authorized JavaScript origins: `https://ai-edu-app.vercel.app`.
3. Authorized redirect URIs: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`.

---

## Testing Strategy

**Unit tests** (new):
- `useAuth()` hook: covers state transitions (loading → anon → authenticated → signed-out). Mock `supabase.auth` methods.
- `SignInToast` timer logic: covers show-after-10-min, cancel-on-auth, 24h throttle via localStorage.
- Error message mapping: feeds each Supabase error code into the mapper, asserts correct Vietnamese message.

**Integration tests** (new):
- Sign-up flow: fill form → submit → assert `updateUser` called with correct args → assert success message shown.
- Sign-in flow: fill form → submit → assert `signInWithPassword` called → assert modal closes.
- Email confirmation callback: render `/auth/callback` page with mock code → assert `exchangeCodeForSession` called → assert redirect.

**Manual tests** (cannot be automated without a live Supabase project with Google OAuth enabled):
- Full signup + email confirmation happy path.
- Google OAuth from anonymous state (confirm UUID unchanged in `user_progress`).
- Google OAuth from signed-out state on different device (confirm existing progress loads).
- Sign-out then create fresh anon user (confirm new UUID, empty progress).
- 10-min toast fires at the right time; does not re-fire within 24h.

---

## Out-of-scope (future work)

- Password reset UI (today we rely on Supabase's built-in magic-link reset flow)
- Multi-factor authentication
- Account deletion screen
- Email change flow
- Session revocation list
- Additional OAuth providers (GitHub, Facebook, Apple)
- Offline-first conflict resolution when user signs in after making offline progress
