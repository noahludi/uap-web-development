import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ConversaIA - Asistente Virtual Inteligente",
  description:
    "Plataforma de conversación con IA usando Next.js, tecnología de vanguardia y modelos de OpenRouter para experiencias interactivas únicas.",
  keywords: "inteligencia artificial, chatbot, conversación, asistente virtual, AI, OpenRouter",
  authors: [{ name: "ConversaIA Team" }],
  creator: "ConversaIA",
  publisher: "ConversaIA Platform",
};

export default function ApplicationRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen bg-slate-900 text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
