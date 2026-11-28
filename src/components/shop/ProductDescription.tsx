type Section = { title?: string; html?: string | null }

/**
 * Description, characteristics and care under the product gallery: plain text, no accordion,
 * in a ~70-letter column like the legal pages. Section titles and the subheadings inside the
 * description (turned into <h2> by lib/productText) share one heading style. The characteristics
 * table has only thin horizontal dividers, like the catalog filters, and on phones stacks each row (label
 * over value). Sections with empty html are not shown.
 *
 * HTML is rendered as is (dangerouslySetInnerHTML); the source is trusted
 * (the store admin), same as in SizeChart / RawHtml.
 */
const heading = 'text-lg font-medium text-ink'

export function ProductDescription({ sections }: { sections: Section[] }) {
  const visible = sections.filter((s) => s.html && s.html.trim())
  if (visible.length === 0) return null

  return (
    <div className="max-w-[60ch] space-y-10 text-[15px] leading-7 text-brown">
      {visible.map((section, i) => (
        <section key={section.title ?? i}>
          {section.title && <h2 className={`${heading} mb-3`}>{section.title}</h2>}
          <div
            className={[
              '[&_a]:underline [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-4 [&_strong]:font-medium [&_ul]:list-disc [&_ul]:pl-5',
              // Subheadings inside the description
              '[&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-ink [&_h2:first-child]:mt-0',
              // Characteristics table: thin horizontal lines only
              '[&_table]:w-full [&_table]:border-collapse [&_tr]:border-b [&_tr]:border-brown/15 [&_tr:last-child]:border-0',
              '[&_th]:w-[38%] [&_th]:py-3 [&_th]:pr-4 [&_th]:text-left [&_th]:align-top [&_th]:font-normal [&_th]:text-ink',
              '[&_td]:py-3 [&_td]:align-top [&_td_p+p]:mt-0',
              // Narrow screens: label on top, value under it
              'max-sm:[&_td]:block max-sm:[&_td]:pt-0 max-sm:[&_th]:block max-sm:[&_th]:w-auto max-sm:[&_th]:pb-1 max-sm:[&_tr]:block',
            ].join(' ')}
            dangerouslySetInnerHTML={{ __html: section.html as string }}
          />
        </section>
      ))}
    </div>
  )
}
