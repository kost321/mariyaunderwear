export type LegalSection = { title: string; items: React.ReactNode[] }

/**
 * Layout of long legal texts (public offer, privacy policy): title, optional intro, numbered sections.
 * `dense` drops the gap between paragraphs inside a section, as in the privacy policy mockup.
 */
export function LegalPage({
  title,
  intro,
  sections,
  dense,
}: {
  title: string
  intro?: string[]
  sections: LegalSection[]
  dense?: boolean
}) {
  const text = 'text-xs leading-[1.3] text-ink/50'

  return (
    <div className="py-6 lg:px-[39px] lg:pb-[100px] lg:pt-[50px]">
      <h1 className="font-serif text-xl uppercase leading-[26px] text-ink">{title}</h1>

      {intro && (
        <div className={`mt-6 max-w-[486px] ${text}`}>
          {intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      <div className={`${intro ? 'mt-10' : 'mt-6'} flex max-w-[1106px] flex-col gap-8`}>
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-serif text-sm uppercase leading-[18px] text-brown">{section.title}</h2>
            <div className={`mt-4 ${dense ? '' : 'space-y-4'} ${text}`}>
              {section.items.map((item, i) => (
                <p key={i}>{item}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
