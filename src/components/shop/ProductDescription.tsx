type Section = { title?: string; html?: string | null }

/**
 * Description, composition and care under the product gallery (design "Products2"): plain
 * letter-spaced text, no accordion. Sections with empty html are not shown.
 *
 * HTML is rendered as is (dangerouslySetInnerHTML); the source is trusted
 * (the store admin), same as in SizeChart / RawHtml.
 */
export function ProductDescription({ sections }: { sections: Section[] }) {
  const visible = sections.filter((s) => s.html && s.html.trim())
  if (visible.length === 0) return null

  return (
    <div className="space-y-10 text-sm leading-[18px] tracking-[1px] text-brown/50 lg:text-base lg:tracking-[2px]">
      {visible.map((section, i) => (
        <section key={section.title ?? i}>
          {section.title && <h2>{section.title}:</h2>}
          <div
            className="[&_a]:underline [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-4 [&_strong]:font-semibold [&_table]:my-2 [&_table]:border-collapse [&_td]:border [&_td]:border-[#c9c9c9] [&_td]:px-3 [&_td]:py-1.5 [&_th]:border [&_th]:border-[#c9c9c9] [&_th]:px-3 [&_th]:py-1.5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: section.html as string }}
          />
        </section>
      ))}
    </div>
  )
}
