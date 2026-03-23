import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API docs (Swagger) | AISAP",
  description:
    "OpenAPI/Swagger UI for studies and summary HTTP endpoints in the AISAP Next.js demo.",
};

export default function SwaggerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 scheme-light antialiased [color-scheme:light]">
      {children}
    </div>
  );
}
