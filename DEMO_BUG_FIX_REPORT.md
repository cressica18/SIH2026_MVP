# Demo Bug Fix Report - SIH2026_MVP

## Summary
Fixed two critical blocking bugs that prevented smooth demo execution.

---

## BUG 1: White Screen After OTP Login

### Root Cause
Race condition in `App.tsx` between auth initialization and profile fetching:
- `AuthProvider` sets `isLoading=false` immediately after token validation (line 72 in auth-context.tsx)
- `verifyOtp` sets user in AuthContext, triggering App.tsx re-render
- `fetchProfileAndListings` useEffect runs but `isProfileLoading` was only set to `true` **inside** the async function
- Brief render cycle: `isAuthenticated=true`, `isProfileLoading=false`, `farmer=null` → `needsOnboarding=true` → OnboardingScreen renders
- Then async function sets `isProfileLoading=true` and fetches profile, but OnboardingScreen already showed

### Fix
**File:** `src/App.tsx` (line 75-80)
```typescript
// Before: setIsProfileLoading(true) was INSIDE async function
useEffect(() => {
  if (!isAuthenticated || !user) return;
  setCurrentRole(user.role);
  async function fetchProfileAndListings() {
    setIsProfileLoading(true);  // Too late!
    ...
  }
}, [isAuthenticated, user]);

// After: Set loading state SYNCHRONOUSLY before async function
useEffect(() => {
  if (!isAuthenticated || !user) return;
  setCurrentRole(user.role);
  setIsProfileLoading(true);  // Set immediately!
  async function fetchProfileAndListings() {
    try {
      ...
    }
  }
}, [isAuthenticated, user]);
```

### Result
- Loading spinner shows during profile fetch
- No white/blank screen after OTP login
- No manual browser refresh needed

---

## BUG 2: Role Switcher Shows "Complete Your Profile"

### Root Cause
Navbar's role switcher only changed `currentRole` state in App.tsx without switching the authenticated session:
- `currentRole` changed to 'buyer'/'logistics'/'admin'
- But JWT token still contained farmer role
- Profile fetch used `user.role` (from JWT) for API calls
- `needsOnboarding` check used `currentRole` to check profile state
- Since `buyer`/`logistics`/`admin` profiles were null (never fetched for farmer JWT), OnboardingScreen showed

### Fix
**Files Changed:**
1. `src/lib/auth-context.tsx` - Added `switchRole(role)` function:
   - Logs out current user
   - Calls `loginWithOtp(DEMO_PHONES[role])` for target role
   - User enters OTP from server logs → `verifyOtp` → new JWT with correct role
   - AuthContext user updates → App.tsx useEffect updates `currentRole` automatically

2. `src/components/Navbar.tsx`:
   - Removed `onRoleChange` prop
   - Uses `switchRole` from `useAuth()` hook
   - Role switcher buttons call `handleRoleChange` → `switchRole(role)`

3. `src/App.tsx`:
   - Removed `onRoleChange={setCurrentRole}` from Navbar
   - `currentRole` now derived from `user.role` via useEffect

### Demo Phone Numbers (from seed data)
| Role | Phone |
|------|-------|
| Farmer | +91 98231 44521 (Ramesh Patil) |
| Buyer | +91 99801 88301 (Vikram Joshi) |
| Logistics | +91 98224 55198 (Kailash Shinde) |
| Admin | +91 99999 99999 |

### Result
- Farmer → Buyer → Logistics → Admin → Farmer switches work seamlessly
- Each role loads its correct seeded dashboard (no "Complete Your Profile")
- OTP visible in server logs for demo entry
- Real JWT role claims maintained (backend authorization preserved)

---

## Files Changed
| File | Changes |
|------|---------|
| `src/App.tsx` | Fixed profile loading race; removed `onRoleChange` from Navbar |
| `src/lib/auth-context.tsx` | Added `DEMO_PHONES`, `switchRole()` function |
| `src/components/Navbar.tsx` | Use `switchRole` from `useAuth()`; removed `onRoleChange` prop |
| `server/vitest.config.ts` | Added `pool: 'threads', singleThread: true` for test stability |

---

## Verification Results
| Check | Status |
|-------|--------|
| Backend Tests | 255/255 PASS |
| Server Typecheck | PASS |
| Frontend Typecheck | PASS |
| Frontend Build | PASS (412 KB JS, 59 KB CSS) |
| Lint (Client + Server) | PASS |
| Backend Server | Starts on :4000 ✓ |
| Frontend Dev Server | Starts on :3001 ✓ |
| OTP Login Flow | Works (farmer, buyer tested) |
| Role Switching | Works (Farmer→Buyer→Logistics→Admin) |
| API Endpoints | All verified |

---

## Demo Ready
✅ **DEMO READY** - Both blocking bugs fixed, all verification checks pass.

### Quick Start for Demo
```bash
# Terminal 1 - Backend
cd /Users/dell/Documents/SIH2026_MVP
npm run dev:server

# Terminal 2 - Frontend
cd /Users/dell/Documents/SIH2026_MVP
npm run dev

# Open http://localhost:3001
# Login with any seeded phone (OTP in server logs)
```

### Demo Accounts (OTP in server logs)
| Role | Phone | Name |
|------|-------|------|
| Farmer | +91 98231 44521 | Ramesh Patil |
| Buyer | +91 99801 88301 | Vikram Joshi |
| Logistics | +91 98224 55198 | Kailash Shinde |
| Admin | +91 99999 99999 | Admin User |
