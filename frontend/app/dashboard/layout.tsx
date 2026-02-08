import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carbon-Aware Cloud Computing (MVP)",
  description: "Local-only hackathon mockup: projects, jobs, worst-case estimates, run simulation, and audit-style reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black dark:bg-zinc-950 dark:text-white">
        {children}
      </body>
    </html>
  );
}
