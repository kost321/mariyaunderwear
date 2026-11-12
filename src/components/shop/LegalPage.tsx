import { Breadcrumbs } from './Breadcrumbs'
import { JsonLd, breadcrumbsLd } from './JsonLd'
import { LegalToc } from './LegalToc'

export type LegalSection = { title: string; items: React.ReactNode[] }

/**
 * Layout of long legal texts (public offer, privacy policy): breadcrumbs, title, the edition date, then
 * numbered sections ("1. Основні терміни" over items 1.1, 1.2…) with a table of contents (LegalToc):
 * sticky in the right column on desktop, above the text on mobile.
 * The text column is limited to ~70 characters per line: 180-character lines of legal text are hard to follow.
 * 60ch, not 70ch: `ch` is the width of "0", and Cyrillic in Inter is narrower, so 70ch fitted ~83 letters.
 */
export function LegalPage({
  title,
  path,
  edition,
  intro,
  sections,
}: {
  title: string
  /** Page URL, for the breadcrumbs structured data */
  path: string
  /** Date of the current edition, shown as «Редакція від …» */
  edition?: string
  intro?: string[]
  sections: LegalSection[]
}) {
  // Same colour as the contacts page text
  const text = 'text-[15px] leading-7 text-brown'
  const toc = sections.map((section, i) => ({ id: `section-${i + 1}`, title: section.title }))

  return (
    <div className="pb-6">
      <JsonLd
        data={breadcrumbsLd([
          { name: 'Головна', url: '/' },
          { name: title, url: path },
        ])}
      />
      <Breadcrumbs items={[{ name: 'Головна', href: '/' }, { name: title }]} />
      <h1 className="heading-page mt-2">{title}</h1>
      {edition && <p className="mt-3 text-sm text-brown/80">Редакція від {edition}</p>}

      {/*
        Desktop: the text on the left, the contents in the free right half, sticky so it stays at hand while
        scrolling. Mobile: the contents above the text.
      */}
      <div className="mt-8 flex flex-col gap-10 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,60ch)_minmax(0,320px)] lg:justify-between lg:gap-16">
        <LegalToc items={toc} className="lg:sticky lg:top-8 lg:order-2 lg:self-start" />

        <div className="lg:order-1">
          {intro && (
            <div className={`mb-10 space-y-4 ${text}`}>
              {intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-10">
            {sections.map((section, i) => (
              <section key={section.title} id={toc[i].id} className="scroll-mt-6">
                {/* Numbered like the items inside (1.1, 1.2…), in the sans, normal case */}
                <h2 className="text-lg font-medium text-ink">
                  {i + 1}. {section.title}
                </h2>
                {/* Every item, sub-items (1.1.1, 2.4.1) included, is a paragraph of its own */}
                <div className={`mt-3 space-y-3 ${text}`}>
                  {section.items.map((item, j) => (
                    <p key={j}>{item}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
