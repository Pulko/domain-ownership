# Domain Ownership — Discovery & Build

A short walkthrough of how the product was researched, designed, and shipped.


## The problem

Build a product experience that helps a user prove ownership of a domain, understand the verification process, when it fails, and recover from mistakes.


## Day 1 — Research

### What “ownership” really means

Domain ownership verification answers one question: **does this user control DNS for this hostname?**

Industry approaches compared:

| Method | Verdict |
| --- | --- |
| **TXT record** | Safe, widely supported — manual, but proves DNS control |
| Email / meta tag / HTML redeploy | Weaker — proves mailbox or site access, not DNS |
| Registrar API keys | Too risky to store |
| OAuth (Cloudflare, AWS) | Possible, but vendor-locked and awkward |
| ACME / registrar plugins | Powerful, heavier than needed |

**Choice:** TXT-based verification — the same pattern Google, Apple, and others use.

Troubleshooting mindset borrowed from Google’s domain verification guide:  
https://docs.cloud.google.com/identity/docs/how-to/verify-domain#troubleshoot

### Open questions that shaped the product

- What’s a good algorithm for the TXT token?
- Can verification be automatic?
- How long does “claimed” last — and should we re-check?
- How do we handle failures and duplicate claims on the same domain?
- With all that friction — how do we keep the UX smooth?


## Day 2 — Architecture

### System shape

Three pieces, deliberately small:

1. **Database** — users, domains, verification tokens  
2. **DNS lookup** — stateless serverless function  
3. **Frontend** — auth + domain workspace  

### Infrastructure cut

Short on time → **Vercel + Next.js + Supabase**.

- No separate Node service — DNS lookup fits a serverless route
- Same stack for a **cron** that rechecks failed verifications
- Auth + Postgres included — huge leverage for a short build

### Decisions that fell out of Day 1

| Question | Answer (v1) |
| --- | --- |
| Reverification | Cron retries failed checks (every 15 min) |
| Polling while waiting | Single lookup on user confirm — no 72h background poll yet |
| “Claimed forever?” | Claimed until a later recheck demotes it; keep the loop simple |

```json
// vercel.json — bulk retry without a queue (scale later if needed)
{
  "crons": [
    { "path": "/api/cron/check-failed", "schedule": "*/15 * * * *" }
  ]
}
```

## Day 3 — UX

### Flow

```
Public home (learn the process)
        ↓
Auth
        ↓
Add domain → show TXT instructions → user confirms → DNS lookup
        ↓
   Success → claimed
   Failure → clear message + guides + “wait up to 72h”
```

**Unauthenticated:** understand the process, registrar guides
**Authenticated:** add domains, regenerate tokens, verify, manage the list.

Design principle: friction sits in DNS (unavoidable); the app should reduce everything else — clear copy, repeatable token display, and actionable failure messages.


## Day 4 — Development

Started from the **Next.js + Supabase** Vercel boilerplate. Region chosen near where most of the team sits (good enough for a demo).

### Data layer

<img width="771" height="567" alt="Screenshot 2026-08-06 at 18 06 02" src="https://github.com/user-attachments/assets/65723fec-c99b-4c15-87a4-dc1b4b68eb45" />


`domains` + `verifications`; users already live in Supabase Auth. Constraints and RLS did a lot of the heavy lifting.

```sql
-- ownership status + one active verification per domain
create table public.domains (
  ...
  status text not null default 'pending',
  current_verification_id uuid,
  constraint domains_user_domain_key unique (user_id, domain),
  constraint domains_status_check
    check (status in ('pending', 'rejected', 'failed', 'claimed'))
);

-- users read their own rows; writes to verifications stay on service role
create policy "Users can read their own domains"
on public.domains for select to authenticated
using ((select auth.uid()) = user_id);
```

### Token & lookup

Cryptographically random token; TXT value is `domain-verification=<token>`. Lookup uses public resolvers and a constant-time compare.

```ts
// lib/domain-verification/token.ts
export function createVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}

export function toTxtRecordValue(token: string): string {
  return `domain-verification=${token}`;
}
```

```ts
// lib/domain-verification/check.ts (essence)
const resolver = new Resolver();
resolver.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
const records = await resolver.resolveTxt(domain);
// match expected TXT → claimed | rejected | failed
```

### API surface

| Endpoint | Role |
| --- | --- |
| Add / delete domain | Workspace CRUD |
| Verify | User-triggered DNS check |
| Regenerate verification | Fresh token when needed |
| Cron `check-failed` | Bulk retry → claimed or rejected |

Auth came with the template. UI stayed on Tailwind + shadcn: home for orientation, protected route for input + troubleshooting + domain list.

### Errors as product

One error vocabulary so APIs and UI stay consistent and human-readable.

```ts
// lib/errors.ts
DOMAIN_ALREADY_ADDED: 'Domain already added',
INVALID_DOMAIN_FORMAT: 'Invalid domain format',
NO_ACTIVE_VERIFICATION: 'Domain has no active verification',
```

<!-- screenshot: success / claimed state -->

<!-- screenshot: failed verification + guidance -->

---

## What shipped

A focused loop: **research → cut scope → TXT proof → serverless check → cron retry → friendly failures**.

Not every Day‑1 idea made v1 (no long polling, no registrar OAuth). What did: a credible ownership story, runnable on Vercel, with room to harden later.
