# Geomatic Club

The Geomatic Club's registration site: the phone becomes a GNSS receiver. You enter your first name, your name, a
date and a time; each valid field acquires satellites; « Envoyer » gets the fix and prints your *fiche
signalétique*. Built with Next.js 16, GSAP 3.15 and zod; French only.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build (lint and types included in CI below)
pnpm lint
```

Query parameters for testing: `?boot=1` plays the receiver's boot again, `?boot=0` skips it. The boot plays once
per browser tab and never with reduced motion.

## Where things live

- **Copy**: every French word is in `lib/copy.ts`.
- **Settings**: the club's point, the time zone and the rate limit are in `lib/config.ts`. Any time of day is
  accepted (00:00 to 23:59); a time already past today (Tunis time) is refused.
- **Validation**: `lib/schema.ts` (zod), shared by the form and the API.
- **The receiver**: `components/receiver/` (`Receiver.tsx` holds the form and the sequence, `Lcd.tsx` the screen,
  `Fiche.tsx` the printed record, `Motion.tsx` every GSAP animation, loaded after the first paint).
- **Sound**: `lib/sound.ts` (Web Audio, synthesised, no files).
- **Images**: the share card is `app/carte/route.tsx` (`/carte?prenom=…&nom=…&date=…&heure=…`, 1080 × 1920), the
  Open Graph image `app/opengraph-image.tsx`.
- **Brand**: `public/brand/` (logos, icons, `README.md` with the rules).
- **Design**: `DESIGN.md`; the research, prototypes and logo rounds are in `design/`.

## Connecting email

Registrations go to `POST /api/register` (`app/api/register/route.ts`): it validates the data, drops bots that
fill the hidden field, limits each IP to 5 sends in 10 minutes, then calls `sendRegistrationEmail()` in
`lib/email.ts`, which sends the email through [Resend](https://resend.com) with a plain `fetch` (no SDK). The
message is built by `emails/registration.ts`: subject « Nouvelle inscription : Prénom Nom — date à heure », an HTML
and a plain-text version with the first name, name, date, time (French, Tunis time), GC code, coordinates and the
time it was received.

Three variables, set in Vercel (Project → Settings → Environment Variables, Production and Preview), named as in
`.env.example`:

- **`EMAIL_API_KEY`**: a Resend API key (send access is enough)
- **`EMAIL_FROM`**: the sender, e.g. `Geomatic Club <onboarding@resend.dev>`
- **`EMAIL_TO`**: where registrations arrive

Without a verified domain, Resend sends from `onboarding@resend.dev` and **only delivers to the email address of
the Resend account itself**: `EMAIL_TO` must be that address until a domain is verified at Resend (then
`EMAIL_FROM` can use it, and any recipient works).

Without `EMAIL_API_KEY` (local development) the registration is only logged on the server. If Resend refuses or
can't be reached, the error is logged on the server, the browser gets a generic failure and the site shows
« Réessayer »; the key and Resend's message never reach the browser. Each email carries an `Idempotency-Key` (GC
code + time received), so the server's own retry never sends it twice. Local values go in `.env.local`, which git
ignores.

The rate limit lives in memory (`lib/rate-limit.ts`): it resets when a server instance restarts. For a stricter
limit, move it to a shared store such as Vercel KV.

## Deploying

The repository is linked to the Vercel project `geomatic-club`: every push to `main` deploys to production, every
other branch gets a preview.
