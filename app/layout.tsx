import type { Metadata, Viewport } from "next";
import { B612 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { copy } from "@/lib/copy";
import { STORAGE } from "@/lib/config";
import "./globals.css";

/** B612: designed for Airbus cockpit displays, legible on instrument screens; the whole site is set in it. */
const b612 = B612({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-b612", display: "swap" });

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: copy.meta.title,
  description: copy.meta.description,
  applicationName: copy.clubName,
  icons: {
    icon: [{ url: "/brand/favicon.ico", sizes: "48x48" }, { url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: { title: copy.meta.title, description: copy.meta.description, locale: "fr_FR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#F2C230",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "only light",
};

/** Before the first paint: the receiver boots once per tab, never with reduced motion. `?boot=1` forces it, `?boot=0` skips it. */
const bootScript = `(function(){var d=document.documentElement;try{if(/[?&]boot=1/.test(location.search))return;if(/[?&]boot=0/.test(location.search)||sessionStorage.getItem(${JSON.stringify(STORAGE.boot)})||matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.boot="skip"}catch(e){d.dataset.boot="skip"}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={b612.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript>
          <style>{`[data-body]{opacity:1!important}.boot{display:none!important}`}</style>
        </noscript>
      </head>
      <body>
        {children}
        {/* real visits and Core Web Vitals, for vercel-optimize later */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
