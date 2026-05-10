import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Medapp — Téléconsultation au Maroc",
  description: "Consultez un médecin en ligne en quelques minutes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body className="font-sans antialiased bg-neutral-50 text-neutral-900">
        <Providers>{children}</Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #E4E4E7",
              borderRadius: "12px",
              padding: "16px",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}
