import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tiles, findTile } from "@/features/claude/registry";
import { TilePlaceholder } from "@/features/claude/components/TilePlaceholder";

type Params = { feature: string };

export async function generateStaticParams(): Promise<Params[]> {
  return tiles.map((t) => ({ feature: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { feature } = await params;
  const tile = findTile(feature);
  if (!tile) return {};
  return {
    title: `${tile.viTitle} · Cẩm nang Claude`,
    description: tile.viTagline,
  };
}

export default async function ClaudeFeaturePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { feature } = await params;
  const tile = findTile(feature);
  if (!tile) notFound();
  // Phase 1: every tile is "planned" and renders the placeholder.
  // Phases 2-4 will introduce per-slug bodies gated on tile.status.
  return <TilePlaceholder tile={tile} />;
}
