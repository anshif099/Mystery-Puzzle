# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Mystery Puzzle Firebase Setup

This app now includes:

- Super Admin login
- Company Admin login (same login page)
- Company Admin campaign dashboard
- QR based user login flow (`/play?companyId=...&campaign=...`)
- Optional Google sign-in for users
- Puzzle attempt + leaderboard storage
- Realtime sync for dashboard metrics and participant data

### 1) Environment

1. Copy `.env.example` to `.env`.
2. Verify Firebase values for your project.
3. Restart `npm run dev` after env changes.

### 2) Realtime Database Paths Used

- `admins/company_admins/{companyId}`
- `campaigns/{companyId}`
- `users/{companyId}/{userId}`
- `attempts/{companyId}/{attemptId}`

### 3) Realtime Database Rules (Basic)

Use these rules to unblock development quickly:

```json
{
  "rules": {
    "admins": {
      "company_admins": {
        ".read": true,
        ".write": true
      }
    },
    "campaigns": {
      ".read": true,
      ".write": true
    },
    "users": {
      ".read": true,
      ".write": true
    },
    "attempts": {
      ".read": true,
      ".write": true
    }
  }
}
```

After testing, tighten these with Firebase Auth checks.
