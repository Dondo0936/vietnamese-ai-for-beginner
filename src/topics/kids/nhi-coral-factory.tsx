"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import CoralFactory from "@/components/kids/nhi/CoralFactory";

const meta = kidsTopicMap["nhi-coral-factory"];

export default function NhiCoralFactoryTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Ôi không! Viên ngọc bị giấu trong nhà máy san hô. Bạn giúp mình tìm được không?"
    >
      <CoralFactory />
    </KidsTopicLayout>
  );
}
