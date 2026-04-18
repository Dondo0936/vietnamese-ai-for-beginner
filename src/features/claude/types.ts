export type ShelfKey = "starter" | "power" | "developer";

export interface ShelfMeta {
  key: ShelfKey;
  viTitle: string;
  viSubtitle: string;
  enTitle: string;
}

export interface TileMeta {
  slug: string;
  shelf: ShelfKey;
  viTitle: string;
  viTagline: string;
  status: "planned" | "ready";
  badge?: "new" | null;
}

export interface Annotation {
  id: string;
  /** 1-based pin number shown in the overlay circle. */
  pin: number;
  /** Short Vietnamese label rendered next to the pin. */
  label: string;
  /** Longer description read by screen readers. */
  description: string;
  /** [start, end] on the DemoCanvas playhead (0..1). */
  showAt: [number, number];
  /** Anchor point in the shell — percent of shell width/height. */
  anchor: { x: number; y: number };
}
