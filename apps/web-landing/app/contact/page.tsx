"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Mail, Phone } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";

const SUBJECTS = [
  "Question avant de m'inscrire",
  "Problème technique",
  "Réclamation",
  "Devenir médecin partenaire",
  "Partenariat / presse",
  "Autre",
];

type Status = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({
    subject: SUBJECTS[0],
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ subject: SUBJECTS[0], name: "", email: "", phone: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Nous contacter"
        description="Une question, un problème, ou envie de rejoindre Medapp ? Nous vous répondons sous 48 heures ouvrées."
      />

      <section className="py-20 sm:py-28 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Direct contact */}
            <div className="space-y-6">
              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-primary-600" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">Email</p>
                </div>
                <a href="mailto:contact@medapp.ma" className="text-sm text-primary-600 hover:underline underline-offset-4">
                  contact@medapp.ma
                </a>
                <p className="mt-1 text-xs text-neutral-500">Réponse sous 48h ouvrées</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-primary-600" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">Téléphone</p>
                </div>
                <p className="text-sm text-neutral-700">+212 522 XX XX XX</p>
                <p className="mt-1 text-xs text-neutral-500">Lun–Ven, 9h–18h</p>
              </div>

              <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-5">
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Pour les urgences médicales, appelez le <strong className="text-neutral-700">15</strong> (SAMU) ou le <strong className="text-neutral-700">19</strong> (Pompiers). Medapp n&apos;est pas un service d&apos;urgences.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-8">
              {status === "success" ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">✓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Message envoyé !</h3>
                  <p className="mt-2 text-sm text-neutral-600">Nous vous répondrons dans les 48 heures ouvrées.</p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-6 text-sm text-primary-600 hover:underline underline-offset-4"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Sujet</label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      className="w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nom complet *</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Mohamed Alami"
                        className="w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="vous@exemple.com"
                        className="w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+212 6XX XX XX XX"
                      className="w-full h-10 px-3 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Message *</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Décrivez votre question ou votre demande…"
                      className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                    />
                  </div>

                  {status === "error" && (
                    <p className="text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg px-4 py-3">
                      Une erreur est survenue. Veuillez réessayer ou contacter directement contact@medapp.ma.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="h-11 px-6 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {status === "loading" ? "Envoi en cours…" : "Envoyer le message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
