import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { tiles, findTile, type TileSlug } from "@/features/claude/registry";
import { tileBodies } from "@/features/claude/tiles";
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
  // tile.slug is typed `string` on TileMeta; the registry enforces each
  // literal matches TileSlug via `satisfies`, so the cast is safe here.
  const Body = tile.status === "ready" ? tileBodies[tile.slug as TileSlug] : undefined;
  return Body ? <Body /> : <TilePlaceholder tile={tile} />;
}
