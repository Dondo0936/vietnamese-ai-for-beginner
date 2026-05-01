"use client";

import { useEffect, useState, Fragment } from "react";
import {
  RESOURCES_META,
  SECTIONS,
  ASIDE_TOC,
  type Section,
  type Item,
  type Step,
  type EventItem,
  type EventCat,
  type Cat,
} from "./data";
import "./resources.css";

export default function ResourcesPage() {
  // scroll-spy for the sticky chapter rail
  const [active, setActive] = useState<string>(SECTIONS[0]?.id ?? "");

  useEffect(() => {
    const sections = SECTIONS.map((s) =>
      document.getElementById(s.id),
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="rs-hero">
        <span className="rs-eyebrow">
          <span className="rs-eyebrow__dot" />
          {RESOURCES_META.eyebrow}
        </span>
        <h1 className="rs-h1">
          {RESOURCES_META.h1} <em>{RESOURCES_META.h1Italic}</em>
          {RESOURCES_META.h1Tail}
        </h1>
        <p className="rs-lede">{RESOURCES_META.lede}</p>
        <div className="rs-meta">
          {RESOURCES_META.meta.map((m, i) => (
            <Fragment key={i}>
              <span>
                <b>{m.value}</b> {m.text}
              </span>
              <span className="rs-meta__sep" aria-hidden="true">
                ·
              </span>
            </Fragment>
          ))}
          <span>
            {RESOURCES_META.source.label}:{" "}
            <a
              href={RESOURCES_META.source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <b>{RESOURCES_META.source.text}</b>
            </a>
          </span>
        </div>
      </section>

      {/* ─── Chapter rail ─── */}
      <nav className="rs-rail" aria-label="Mục lục">
        <div className="rs-rail__inner">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={active === s.id ? "is-active" : ""}
            >
              <span className="rs-rail__num">{s.num}</span>
              {s.title}
            </a>
          ))}
        </div>
      </nav>

      {/* ─── Body grid ─── */}
      <div className="rs-wrap">
        <Aside />

        <main>
          {SECTIONS.map((s) => (
            <SectionBlock key={s.id} section={s} />
          ))}
        </main>
      </div>
    </>
  );
}

function Aside() {
  return (
    <aside className="rs-aside" aria-label="Mục lục bên trái">
      <h4>Trên trang này</h4>
      <ul>
        {ASIDE_TOC.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`}>
              <span>{t.label}</span>
              <span className="rs-aside__count">{t.count}</span>
            </a>
          </li>
        ))}
      </ul>

      <h4>Phạm vi cập nhật</h4>
      <ul>
        {RESOURCES_META.scope.map((s) => (
          <li key={s.label}>
            <a
              href={RESOURCES_META.source.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>{s.label}</span>
              <span className="rs-aside__count">{s.count}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="rs-source">
        <b>{RESOURCES_META.asideSource.title}</b>
        {RESOURCES_META.asideSource.body}{" "}
        <a
          className="rs-source__link"
          href={RESOURCES_META.asideSource.linkHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          {RESOURCES_META.asideSource.linkLabel} →
        </a>
      </div>
    </aside>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <section className="rs-section" id={section.id}>
      <div className="rs-section-head">
        <h2>
          <span className="rs-section-head__num">{section.num}</span>
          {section.title}
        </h2>
        <div className="rs-section-head__desc">{section.desc}</div>
      </div>

      {section.kind === "list" &&
        section.cats.map((cat) => <CatBlock key={cat.title} cat={cat} />)}

      {section.kind === "curriculum" && <CurriculumBlock section={section} />}

      {section.kind === "events" &&
        section.cats.map((cat) => (
          <EventCatBlock key={cat.title} cat={cat} />
        ))}
    </section>
  );
}

function CatBlock({ cat }: { cat: Cat }) {
  return (
    <>
      <div className="rs-cat">
        <h3>{cat.title}</h3>
        <span className="rs-cat__rule" aria-hidden="true" />
        <span className="rs-cat__count">{cat.count}</span>
      </div>
      <ul className="rs-items">
        {cat.items.map((item) => (
          <ItemRow key={item.title} item={item} />
        ))}
      </ul>
    </>
  );
}

function ItemRow({ item }: { item: Item }) {
  return (
    <li className="rs-item">
      <div className="rs-item__ttl">
        <a href={item.href} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </div>
      <p className="rs-item__desc">{item.desc}</p>
      {item.tags && item.tags.length > 0 && (
        <div className="rs-item__meta">
          {item.tags.map((t, i) => (
            <span key={i} className={`rs-tag rs-tag--${t.kind}`}>
              {t.label}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function CurriculumBlock({
  section,
}: {
  section: Extract<Section, { kind: "curriculum" }>;
}) {
  return (
    <div className="rs-curriculum">
      <p className="rs-curriculum__intro">{section.intro}</p>
      <p className="rs-curriculum__quote">"{section.quote}"</p>

      <ol className="rs-steps">
        {section.steps.map((step, i) => (
          <StepBlock key={i} step={step} />
        ))}
      </ol>
    </div>
  );
}

function StepBlock({ step }: { step: Step }) {
  return (
    <li className="rs-step">
      <h4>{step.title}</h4>
      <p>
        {step.segments.map((seg, i) =>
          typeof seg === "string" ? (
            <Fragment key={i}>{seg}</Fragment>
          ) : (
            <a
              key={i}
              href={seg.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {seg.label}
            </a>
          ),
        )}
      </p>
    </li>
  );
}

function EventCatBlock({ cat }: { cat: EventCat }) {
  return (
    <>
      <div className="rs-cat">
        <h3>{cat.title}</h3>
        <span className="rs-cat__rule" aria-hidden="true" />
        <span className="rs-cat__count">{cat.count}</span>
      </div>
      <div className="rs-events">
        {cat.events.map((ev) => (
          <EventCard key={ev.title} ev={ev} />
        ))}
      </div>
    </>
  );
}

function EventCard({ ev }: { ev: EventItem }) {
  return (
    <a
      className="rs-event"
      href={ev.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="rs-event__pin">{ev.pin}</div>
      <h4>{ev.title}</h4>
      <p>{ev.desc}</p>
    </a>
  );
}
