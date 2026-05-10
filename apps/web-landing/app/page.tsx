import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Features } from "@/components/home/Features";
import { Testimonials } from "@/components/home/Testimonials";
import { TrustSignals } from "@/components/home/TrustSignals";
import { FAQ } from "@/components/home/FAQ";
import { CTASection } from "@/components/home/CTASection";

export const metadata: Metadata = {
  title: "Medapp · Téléconsultation médicale au Maroc",
  description:
    "Consultez un médecin certifié en moins de 15 minutes. Sans rendez-vous, 7j/7. 150 MAD. Compte-rendu, ordonnance et reçu en PDF.",
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medapp.ma";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  name: "Medapp",
  description: "Plateforme de téléconsultation médicale au Maroc",
  url: siteUrl,
  logo: `${siteUrl}/logo.svg`,
  address: {
    "@type": "PostalAddress",
    addressCountry: "MA",
  },
  medicalSpecialty: "GeneralPractice",
  availableService: {
    "@type": "MedicalProcedure",
    name: "Téléconsultation",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <HowItWorks />
      <Features />
      <Testimonials />
      <TrustSignals />
      <FAQ />
      <CTASection />
    </>
  );
}
