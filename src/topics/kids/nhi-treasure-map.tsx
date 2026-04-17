"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import TreasureMap from "@/components/kids/nhi/TreasureMap";

const meta = kidsTopicMap["nhi-treasure-map"];

export default function NhiTreasureMapTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Hòn đảo bí ẩn! Kéo mũi tên để di chuyển Bạch Tuộc khám phá nha!"
    >
      <TreasureMap />
    </KidsTopicLayout>
  );
}
