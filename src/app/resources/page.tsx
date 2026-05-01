import type { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";
import ResourcesPage from "@/components/resources/ResourcesPage";

export const metadata: Metadata = {
  title: "Tài nguyên Học máy · AI Cho Mọi Người",
  description:
    "Tủ sách Học máy được tuyển chọn, dịch sang tiếng Việt. 120+ sách, khoá học, blog, podcast và lộ trình từ awesome-machine-learning, lọc theo nguồn vẫn cập nhật trong 12 tháng qua.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Tài nguyên Học máy · udemi.tech",
    description:
      "Tủ sách Học máy được tuyển chọn, dịch sang tiếng Việt. 120+ sách, khoá học, blog và lộ trình.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function Page() {
  return (
    <AppShell>
      <ResourcesPage />
    </AppShell>
  );
}
