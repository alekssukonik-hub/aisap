"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function SwaggerPage() {
  return (
    <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-3xl border-b border-neutral-200 pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          API documentation
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          Interactive OpenAPI reference for this app&apos;s route handlers under{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs text-neutral-800">
            /api
          </code>
          . Use <strong>Try it out</strong> to call endpoints from the same origin as the UI. The
          machine-readable spec is served at{" "}
          <a
            className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-600"
            href="/openapi.json"
          >
            /openapi.json
          </a>
          .
        </p>
      </header>
      <SwaggerUI url="/openapi.json" docExpansion="list" defaultModelsExpandDepth={1} />
    </div>
  );
}
