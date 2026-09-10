import type { LessonSkillBlock } from "@/lib/lesson-skills";

interface LessonPackagedSkillProps {
  block: LessonSkillBlock;
}

export default function LessonPackagedSkill({
  block,
}: LessonPackagedSkillProps) {
  return (
    <aside className="tp-skill" aria-label="Bước tiếp theo trên bản làm việc của bạn">
      <p className="tp-skill__kicker">Bước tiếp theo</p>
      <h2 className="tp-skill__h">{block.heading}</h2>
      <p className="tp-skill__intro">{block.intro}</p>
      <ul className="tp-skill__list">
        {block.offers.map((offer) => (
          <li key={offer.href}>
            <a
              href={offer.href}
              target="_blank"
              rel="noreferrer noopener"
              className="tp-skill__card"
            >
              <span className="tp-skill__price">{offer.price}</span>
              <span className="tp-skill__title">{offer.title}</span>
              <span className="tp-skill__body">{offer.body}</span>
            </a>
            {offer.also ? (
              <a
                href={offer.also.href}
                target="_blank"
                rel="noreferrer noopener"
                className="tp-skill__also"
              >
                {offer.also.label}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
