import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://medapp.ma"),
  title: {
    default: "Medapp · Téléconsultation médicale au Maroc",
    template: "%s · Medapp",
  },
  description:
    "Consultez un médecin certifié en moins de 15 minutes. Sans rendez-vous, 7j/7. 150 MAD. Compte-rendu, ordonnance et reçu en PDF.",
  keywords: [
    "téléconsultation Maroc",
    "médecin en ligne Maroc",
    "consultation vidéo Maroc",
    "Medapp",
  ],
  openGraph: {
    title: "Medapp · Téléconsultation médicale au Maroc",
    description: "Un médecin disponible en moins de 15 minutes.",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Medapp",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    locale: "fr_MA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Medapp · Téléconsultation médicale au Maroc",
    description: "Un médecin disponible en moins de 15 minutes.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <TopNav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
