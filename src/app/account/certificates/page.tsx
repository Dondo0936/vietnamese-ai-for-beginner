/**
 * /account/certificates — user-facing list and claim UI.
 *
 * - Shows every cert the user already minted.
 * - For paths the user has completed but hasn't claimed, shows a CTA.
 * - Anonymous users get a sign-in nudge instead.
 *
 * The claim modal collects a display name, runs the same client-side
 * similarity check the server enforces, then POSTs to
 * /api/certificates/issue.
 */
import AppShell from "@/components/layout/AppShell";
import CertificatesContent from "@/components/cert/CertificatesContent";

export const metadata = {
  title: "Chứng chỉ của tôi · udemi.tech",
  description:
    "Quản lý các chứng chỉ hoàn thành lộ trình học AI tại udemi.tech.",
};

export default function CertificatesPage() {
  return (
    <AppShell>
      <CertificatesContent />
    </AppShell>
  );
}
