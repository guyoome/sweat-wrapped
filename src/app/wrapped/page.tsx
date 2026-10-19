import { Suspense } from "react";
import { WrappedLoader } from "@/components/WrappedLoader";

export default function WrappedPage({ searchParams }: PageProps<"/wrapped">) {
  return (
    <Suspense fallback={<main className="min-h-dvh bg-ink" />}>
      <Wrapped searchParams={searchParams} />
    </Suspense>
  );
}

async function Wrapped({ searchParams }: Pick<PageProps<"/wrapped">, "searchParams">) {
  const { year, demo } = await searchParams;
  return (
    <WrappedLoader
      year={typeof year === "string" ? year : undefined}
      demo={typeof demo === "string" ? demo : undefined}
    />
  );
}
