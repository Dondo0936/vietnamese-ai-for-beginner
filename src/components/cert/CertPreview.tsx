"use client";

import Link from "next/link";
import Diploma, { DiplomaStage } from "./Diploma";

/**
 * In-page diploma preview for learning-path rails.
 *
 * Shows the actual diploma the learner will earn, populated with their
 * (display) name if available and the path metadata. When the path is
 * incomplete it sits at reduced opacity with a "complete to unlock"
 * caption; once complete it becomes a clickable claim CTA.
 */
export interface CertPreviewProps {
  pathId: string;
  pathName: string;
  totalLessons: number;
  hoursLabel: string;
  completedCount: number;
  /** Display-name guess (OAuth full_name) or null for placeholder. */
  displayName: string | null;
  /** True once readCount === totalLessons. */
  pathComplete: boolean;
  /** True once a cert exists for this user/path. */
  alreadyClaimed: boolean;
  /** Existing cert id when alreadyClaimed; used for the "view" CTA. */
  certId?: string;
}

export default function CertPreview({
  pathId,
  pathName,
  totalLessons,
  hoursLabel,
  completedCount,
  displayName,
  pathComplete,
  alreadyClaimed,
  certId,
}: CertPreviewProps) {
  const today = new Date();
  const dd = today.getDate();
  const mm = today.getMonth() + 1;
  const yyyy = today.getFullYear();
  const issuedDate = `${dd} tháng ${mm}, ${yyyy}`;

  const previewName = displayName?.trim() || "Tên bạn ở đây";
  const dim = !pathComplete;

  return (
    <div className="lp-rail__block lp-cert">
      <h4>Chứng chỉ</h4>
      <div
        className={`lp-cert__stage ${dim ? "lp-cert__stage--dim" : ""}`}
        aria-hidden={dim}
      >
        <DiplomaStage>
          <Diploma
            fullName={previewName}
            pathName={pathName}
            lessonCount={totalLessons}
            hoursLabel={hoursLabel}
            issuedDate={issuedDate}
            certId="00000000-0000-0000-0000-000000000000"
            qrSvg={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 33 33"
                width="100%"
                height="100%"
              >
                <rect width="33" height="33" fill="none" stroke="#1A1A1A" strokeWidth="0.5" />
              </svg>
            }
          />
        </DiplomaStage>
      </div>
      <p className="lp-cert__caption">
        {alreadyClaimed
          ? "Đã cấp · ký số Ed25519, có URL xác thực"
          : pathComplete
            ? "Sẵn sàng nhận. Ký số Ed25519, URL xác thực công khai."
            : `Hoàn thành ${totalLessons - completedCount} bài còn lại để mở khoá.`}
      </p>
      {alreadyClaimed && certId && (
        <Link
          href={`/cert/${certId}`}
          className="lp-cert__cta"
          target="_blank"
        >
          Xem chứng chỉ →
        </Link>
      )}
      {!alreadyClaimed && pathComplete && (
        <Link
          href={`/account/certificates?claim=${pathId}`}
          className="lp-cert__cta"
        >
          Nhận chứng chỉ →
        </Link>
      )}
    </div>
  );
}
