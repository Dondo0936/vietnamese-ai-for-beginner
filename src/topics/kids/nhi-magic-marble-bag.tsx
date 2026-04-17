"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import MagicMarbleBag from "@/components/kids/nhi/MagicMarbleBag";

const meta = kidsTopicMap["nhi-magic-marble-bag"];

export default function NhiMagicMarbleBagTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Túi bi thần kỳ! Rút một viên bi xem được màu gì nha!"
    >
      <MagicMarbleBag />
    </KidsTopicLayout>
  );
}
