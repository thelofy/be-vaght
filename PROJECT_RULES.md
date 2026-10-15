# BeVaght Project Rules & Context (v1.0 MVP)

## Overview
BeVaght is a sleek appointment booking SaaS specifically tailored for barbershops. 
Customers book via `bevaght.ir/[slug]` without login friction.
Barbers manage schedules and client history via `bevaght.ir/panel`.

## Tech Stack
- Backend: Laravel 11 (Strict REST API, FormRequest validation, API Resources)
- Frontend: Next.js 15 (App Router), Tailwind CSS, Lucide Icons
- Database: PostgreSQL or MySQL (Foreign keys enforced, strict indexing)
- Authentication: Laravel Sanctum for Barbers (Token/Cookie-based), OTP for customers if needed

## Core Architecture Guidelines
1. No Monolithic Multi-tenant complexity for MVP: Single database with `salon_id` scoping on all queries.
2. Route Structure:
   - Public Booking: `bevaght.ir/{salon_slug}`
   - Barbershop Management: `bevaght.ir/panel/...`
3. Code Cleanliness:
   - No raw queries in controllers; use Eloquent relationships.
   - Always return consistent JSON envelopes: `{ success: boolean, data: any, message: string }`.
   - Never implement features outside the current sprint checklist.