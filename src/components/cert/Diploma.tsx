/**
 * Diploma — visual port of /tmp/diploma-bundle Editorial Diploma.html.
 *
 * Server-rendered. Pure presentational; takes preformatted strings as props.
 * The wrapper handles the 1200-px-to-container scale via inline style on a
 * container-query-style transform. Caller controls size by sizing the
 * `.cert-stage` wrapper.
 */
import "./diploma.css";
import { shortCertId } from "@/lib/certificates";

export interface DiplomaProps {
  /** Recipient's chosen display name. */
  fullName: string;
  /** "Nhân viên văn phòng", "Học sinh · Sinh viên", etc. */
  pathName: string;
  /** Total lessons in the path at issuance time. */
  lessonCount: number;
  /** Pre-formatted total time, e.g. "17 giờ 24 phút". */
  hoursLabel: string;
  /** "28 tháng 4, 2026" */
  issuedDate: string;
  /** UUID. Drives the visible UDM-XXXX badge and QR target. */
  certId: string;
  /** Pre-rendered QR SVG markup (children of <svg viewBox="0 0 N N">). */
  qrSvg: React.ReactNode;
  /** Defaults to "Nhân viên văn phòng path". Banner above the title. */
  badgeLabel?: string;
  /** Defaults to "Phạm Trang", site editor signature. */
  signatureName?: string;
  signatureRole?: string;
  /** Override the eyebrow above the title. */
  eyebrow?: string;
}

export default function Diploma({
  fullName,
  pathName,
  lessonCount,
  hoursLabel,
  issuedDate,
  certId,
  qrSvg,
  badgeLabel = "RESPONSIBLE AI",
  signatureName = "Phạm Trang",
  signatureRole = "Tổng biên tập · udemi.tech",
  eyebrow = "— Chứng nhận hoàn thành —",
}: DiplomaProps) {
  return (
    <article className="cert">
      <div className="cert__frame" />
      <div className="cert__stack">
        <div className="cert__badge">
          <svg viewBox="0 0 130 150" preserveAspectRatio="xMidYMid meet">
            <polygon
              className="cert__badge-hex"
              points="65,4 122,32 122,118 65,146 8,118 8,32"
            />
          </svg>
          <div className="cert__badge-mark">
            <i />
            <em />
          </div>
          <div className="cert__badge-banner">{badgeLabel}</div>
          <div className="cert__badge-sub">CERTIFIED · MMXXVI</div>
        </div>

        <p className="cert__eyebrow cert__eyebrow--tight">{eyebrow}</p>

        <h1 className="cert__title">{pathName}</h1>

        <p className="cert__eyebrow">Trao tặng cho</p>

        <h2 className="cert__recip-name">{fullName}</h2>

        <p className="cert__grant">
          Người sở hữu chứng chỉ này đã hoàn thành lộ trình{" "}
          <em>&ldquo;{pathName}&rdquo;</em> trên udemi.tech, gồm{" "}
          <b>{lessonCount} bài học</b> trong <b>{hoursLabel}</b>, vượt qua các
          bài kiểm tra tổng kết.
        </p>

        <div className="cert__foot">
          <div className="cert__sig">
            <div className="cert__sig-mark">{signatureName}</div>
            <div className="cert__sig-cap">{signatureRole}</div>
          </div>

          <div className="cert__brand">
            <div className="cert__brand-mark" />
            <div className="cert__brand-name">udemi</div>
          </div>

          <div className="cert__meta">
            <div>
              <div className="cert__meta-txt">
                Cấp: <b>{issuedDate}</b>
              </div>
              <div className="cert__meta-txt">
                ID · <b>{shortCertId(certId)}</b>
              </div>
            </div>
            <div className="cert__qr">{qrSvg}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Wrapper that keeps the 1200×800 cert pixel-accurate and scales the whole
 * canvas to fill its container width. Use inside any container that has a
 * defined width.
 */
export function DiplomaStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`cert-stage ${className ?? ""}`}>
      <ScalingScript />
      {children}
    </div>
  );
}

function ScalingScript() {
  // Inline ResizeObserver script. Server-rendered as a string; runs after
  // hydration. Keeps the cert pixel-accurate across viewport widths.
  const code = `(function(){
    var stages = document.querySelectorAll('.cert-stage');
    if (!stages.length || typeof ResizeObserver === 'undefined') return;
    var ro = new ResizeObserver(function(entries){
      for (var i=0;i<entries.length;i++){
        var w = entries[i].contentRect.width;
        var cert = entries[i].target.querySelector('.cert');
        if (cert) cert.style.transform = 'scale(' + (w/1200) + ')';
      }
    });
    stages.forEach(function(s){ ro.observe(s); });
  })();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
