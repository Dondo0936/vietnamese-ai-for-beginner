"use client";

import { Sparkles } from "lucide-react";
import KidsPathPage from "@/components/paths/KidsPathPage";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import type { Stage } from "@/components/paths/LearningPathPage";

/**
 * Nhí learning path (6–10 tuổi). Spec §4.
 * Phase 1 ships with empty stages — Phase 5 populates with the 18 Nhí topics.
 */

const stages: Stage[] = [
  // Populated in Phase 5 with Chặng 1–5 from Appendix A.
];

export default function NhiPathPage() {
  return (
    <KidsModeProvider initialTier="nhi">
      <KidsPathPage
        tier="nhi"
        nameVi="Bé làm quen với AI"
        descriptionVi="18 bài vui vẻ — hình ảnh, kéo thả, có audio. Không cần biết đọc nhiều."
        mascotEmoji="🐙"
        icon={Sparkles}
        stages={stages}
      />
    </KidsModeProvider>
  );
}
