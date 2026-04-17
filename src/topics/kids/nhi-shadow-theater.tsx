"use client";

import { kidsTopicMap } from "@/topics/kids/kids-registry";
import KidsTopicLayout from "@/components/kids/nhi/KidsTopicLayout";
import ShadowTheater from "@/components/kids/nhi/ShadowTheater";

const meta = kidsTopicMap["nhi-shadow-theater"];

export default function NhiShadowTheaterTopic() {
  return (
    <KidsTopicLayout
      meta={meta}
      introText="Rạp chiếu bóng! Xoay đèn xem bóng của các hình thay đổi thế nào!"
    >
      <ShadowTheater />
    </KidsTopicLayout>
  );
}
