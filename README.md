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
- **Settings**: opening hours (`SLOT`, 08:00–18:00, every 30 minutes), the club's point, the time zone and the rate
  limit are in `lib/config.ts`.
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
`lib/email.ts`. Today that function only logs the registration on the server. To send real emails:

1. Set three variables in Vercel (Project → Settings → Environment Variables), named as in `.env.example`:
   - **`EMAIL_API_KEY`**: your provider's API key
   - **`EMAIL_FROM`**: the sender, an address your provider has verified
   - **`EMAIL_TO`**: where registrations should arrive
2. In `lib/email.ts`, replace the `TODO` with your provider's API call. The message is already built by
   `emails/registration.ts` (`subject`, `text` and `html`: name, date, time, coordinates, reference, time received).
3. Redeploy.

The rate limit lives in memory (`lib/rate-limit.ts`): it resets when a server instance restarts. For a stricter
limit, move it to a shared store such as Vercel KV.

## Deploying

The repository is linked to the Vercel project `geomatic-club`: every push to `main` deploys to production, every
other branch gets a preview.
