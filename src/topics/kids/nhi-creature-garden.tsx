"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import CreatureGarden from "@/components/kids/nhi/CreatureGarden";

const meta = kidsTopicMap["nhi-creature-garden"];

export default function NhiCreatureGardenTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Vườn sinh vật đầy những bạn nhỏ dễ thương! Kéo chúng quanh vườn xem nào!"
    >
      <CreatureGarden />
    </KidsTopicLayout>
  );
}
