"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import OceanRace from "@/components/kids/nhi/OceanRace";

const meta = kidsTopicMap["nhi-ocean-race"];

export default function NhiOceanRaceTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Đường đua đại dương! Xem Bạch Tuộc lướt sóng nhanh cỡ nào!"
    >
      <OceanRace />
    </KidsTopicLayout>
  );
}
