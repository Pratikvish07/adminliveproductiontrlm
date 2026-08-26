# TRLM Dashboard

## Overview
TRLM (likely Tribal Rural Livelihood Mission) Dashboard - React + Vite + TypeScript app for managing master data, staff, SHG, CRP, payments in rural development context.

## Folder Structure
```
TRLM/
├── public/assets/logo.png
├── src/
│   ├── components/common/
│   ├── components/layout/
│   ├── pages/auth/
│   ├── pages/dashboard/
│   ├── pages/master/
│   ├── pages/staff/
│   ├── pages/shg/
│   ├── pages/crp/
│   ├── pages/payment/
│   ├── services/
│   ├── context/
│   ├── routes/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── ... configs
```

## Quick Start
1. `npm install`
2. `npm run dev` - App runs at http://localhost:5173
3. Login at /login (mock - check console)
4. Navigate via sidebar/navbar
5. Protected routes require login

## Features
- Auth context + protected routes
- Master data (District/Block/Village/GP) with services
- Staff/SHG/CRP/Payment modules (stubs ready for API)
- Responsive layout with MUI/Lucide
- TypeScript typed throughout

## Next Steps
- Implement real API endpoints in services
- Add forms/tables/charts in pages
- State management (Zustand/RTK if needed)
- Testing (Vitest)
- Deployment (Vite build)

Enjoy building TRLM!

