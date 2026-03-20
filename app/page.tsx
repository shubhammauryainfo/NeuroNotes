import Image from "next/image";
import Link from "next/link";

import { SignInButton } from "@/components/auth/SignInButton";
import { Card } from "@/components/ui/Card";
import { getCurrentUser } from "@/lib/auth";

const features = [
  "Save class notes in a structured knowledge base",
  "Convert notes into embeddings for semantic search",
  "Ask grounded questions with strict RAG answers",
  "Generate summaries, MCQs, flashcards, and viva prompts"
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <Card className="bg-lemon">
          <div className="mb-5 inline-flex border-[3px] border-ink bg-white p-2 shadow-brutal">
            <Image
              src="/logo.png"
              alt="NeuroNotes logo"
              width={72}
              height={72}
              className="h-[72px] w-[72px] object-cover"
            />
          </div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.3em]">
            Study OS
          </p>
          <h1 className="max-w-3xl text-4xl font-black uppercase leading-tight sm:text-6xl">
            Turn scattered notes into a searchable second brain.
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-bold uppercase leading-6">
            NeuroNotes helps students capture knowledge, retrieve it through
            RAG, and train smarter with AI-powered revision tools.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="border-[3px] border-ink bg-white px-5 py-3 text-sm font-black uppercase shadow-brutal transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
              >
                Open dashboard
              </Link>
            ) : (
              <SignInButton />
            )}
            <Link
              href="/notes"
              className="border-[3px] border-ink bg-coral px-5 py-3 text-sm font-black uppercase shadow-brutal transition hover:-translate-x-1 hover:-translate-y-1 hover:shadow-none"
            >
              Explore workspace
            </Link>
          </div>
        </Card>
        <Card className="bg-sky">
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-[0.3em]">
              Core stack
            </p>
            <ul className="space-y-2 text-sm font-black uppercase">
              <li>Next.js App Router</li>
              <li>Supabase Auth + Postgres + pgvector</li>
              <li>OpenRouter + DeepSeek</li>
              <li>Neobrutalist UI system</li>
            </ul>
          </div>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => (
          <Card key={feature} className="bg-white">
            <p className="text-sm font-black uppercase leading-6">{feature}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
