import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: `${APP_NAME} – ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description: "Ton récap sportif de l'année, généré à partir de tes activités Strava.",
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: "#0F0F12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans selection:bg-strava selection:text-white">{children}</body>
    </html>
  );
}
