import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { copy } from "@/lib/copy";
import { INTRO_KEY } from "@/lib/config";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

export const viewport: Viewport = {
  themeColor: "#E9EEE7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "only light",
};

/**
 * Decides before the first paint whether the intro plays: not with reduced motion, not twice
 * in a tab. `?intro=1` plays it again, `?intro=0` never.
 */
const introScript = `(function(){var d=document.documentElement,q=location.search;try{if(/[?&]intro=1/.test(q))return;if(/[?&]intro=0/.test(q)||sessionStorage.getItem(${JSON.stringify(
  INTRO_KEY,
)})||matchMedia("(prefers-reduced-motion: reduce)").matches)d.dataset.intro="skip"}catch(e){d.dataset.intro="skip"}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <noscript>
          <style>{`[data-intro-hide]{opacity:1!important}.intro{display:none!important}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
