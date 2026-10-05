# Vercel Environment Variables Configuration

## Required Environment Variables for Production

Set these in your Vercel project settings (Settings → Environment Variables):

### Required for Authentication (MUST SET)
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for signing access tokens (min 32 chars) | `your-super-secret-jwt-key-32-chars-min` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | `your-refresh-secret-key-32-chars-min` |
| `OTP_CHALLENGE_SECRET` | Secret for OTP challenge tokens | `your-otp-challenge-secret-32-chars-min` |

### Required for CORS & Frontend
| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Your production frontend URL | `https://kabadiwala2026.vercel.app` |

### Demo Mode (Optional - for SIH Demo)
| Variable | Description | Example |
|----------|-------------|---------|
| `DEMO_MODE` | Enable demo mode with fixed OTP `123456` | `true` |

### Platform Defaults (Auto-set by Vercel)
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Automatically set to `production` by Vercel |
| `PORT` | Not needed (Vercel manages port) |

---

## Vercel Dashboard Setup Instructions

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add each variable above with the appropriate value
3. Make sure to set them for **Production**, **Preview**, and **Development** environments as needed
4. Redeploy after adding variables

### Example Production Values
```
JWT_SECRET=your-64-character-random-string-here
JWT_REFRESH_SECRET=another-64-character-random-string
OTP_CHALLENGE_SECRET=another-64-character-random-string
FRONTEND_URL=https://kabadiwala2026.vercel.app
DEMO_MODE=true
```

### Generating Secure Secrets
```bash
# Generate secure 64-character secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run 3 times for JWT_SECRET, JWT_REFRESH_SECRET, OTP_CHALLENGE_SECRET
```

---

## Local Development

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Then edit `.env` with your local values.

### Local Development with Demo Mode
```bash
DEMO_MODE=true npm run dev
```

This enables the demo OTP `123456` for testing.

---

## Production Checklist

- [ ] `JWT_SECRET` set (64+ chars)
- [ ] `JWT_REFRESH_SECRET` set (64+ chars)
- [ ] `OTP_CHALLENGE_SECRET` set (64+ chars)
- [ ] `FRONTEND_URL` set to production domain
- [ ] `DEMO_MODE` set to `true` for demo
- [ ] Variables set for **Production** environment in Vercel
- [ ] Redeploy after adding variables