"use client";

import { Rocket } from "lucide-react";
import KidsPathPage from "@/components/paths/KidsPathPage";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import type { Stage } from "@/components/paths/LearningPathPage";

/**
 * Teen learning path (11–15 tuổi). Spec §4.
 * Phase 1 ships with empty stages — Phase 5 populates with 28 Teen topics
 * plus the 2-lesson capstone that bridges into /paths/student.
 */

const stages: Stage[] = [
  // Populated in Phase 5.
];

export default function TeenPathPage() {
  return (
    <KidsModeProvider initialTier="teen">
      <KidsPathPage
        tier="teen"
        nameVi="Teen tự làm dự án AI"
        descriptionVi="30 bài — train mô hình nhỏ, hiểu AI tạo sinh, và sẵn sàng cho lộ trình Học sinh · Sinh viên."
        mascotEmoji="🐙"
        icon={Rocket}
        stages={stages}
      />
    </KidsModeProvider>
  );
}
