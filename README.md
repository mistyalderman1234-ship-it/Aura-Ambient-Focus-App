# Aura — Ambient Focus App

This repository contains the Aura frontend (Vite + React + Tailwind) and the Aura API (Node + Express + Prisma + Stripe).

Key improvements in branch `aura/upgrade-trial-and-prod-readiness`:
- New 5-day free trial: users created with signup now get a 5-day trial (trialEndsAt and subscriptionStatus set to TRIAL)
- Prisma schema updated (trialEndsAt) — run migrations after pulling
- Backend: improved Stripe webhook handling, raw body handling for webhook signature verification
- Frontend: centralized API client, loading states, lazy audio, accessibility and UI polish
- Vercel-ready config and deploy notes

Local setup summary
1. Install dependencies
   - cd api && npm install
   - cd ../frontend && npm install
2. Configure env files
   - cp api/.env.example api/.env
   - cp frontend/.env.example frontend/.env
   - Update values (DATABASE_URL, JWT_SECRET, FRONTEND_URL, STRIPE_*)
3. Prisma migration
   - cd api
   - npx prisma generate
   - npx prisma migrate dev --name add_trialEndsAt
4. Run locally
   - cd api && npm run dev
   - cd frontend && npm run dev

Stripe
- Create monthly ($10/mo) and yearly ($100/yr) subscription prices in Stripe and set the price IDs in api/.env
- Add a webhook endpoint in Stripe pointing to /api/stripe/webhook on your deployed API and copy the webhook secret to STRIPE_WEBHOOK_SECRET

Vercel
- You may deploy frontend and API as separate projects or as a monorepo. See vercel.json for a starting point.
- Add required env vars in Vercel: DATABASE_URL, JWT_SECRET, FRONTEND_URL, STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY_ID, STRIPE_PRICE_YEARLY_ID, STRIPE_WEBHOOK_SECRET, NODE_ENV

Security notes
- Use a strong JWT_SECRET
- Use HTTPS in production
- Consider adding rate limiting and email verification

