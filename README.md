# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Company Admin Cloud Sync Setup

Company Admin records now use internet storage so data appears on any device after admin login.

1. Copy `.env.example` to `.env`.
2. Keep the provided `VITE_FIREBASE_*` values (or replace with your own Firebase project values).
3. In Firebase Console, enable **Realtime Database** for project `mystery-9918e`.
4. Set Realtime Database rules to allow your admin app to read/write company admins.
5. Restart the app after changing environment variables.

Path used by the app:

- `companyAdmins`
