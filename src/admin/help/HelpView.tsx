import fs from 'fs/promises'
import path from 'path'
import React from 'react'
import { redirect } from 'next/navigation'
import { Marked, type Tokens } from 'marked'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'

/**
 * Admin page «Довідка»: renders docs/admin-guide.md, the owner's guide to every admin feature.
 * The guide lives in the repo so it ships with the code that it describes; update it with every
 * admin-facing change. Registered in payload.config.ts under admin.components.views.
 *
 * The file is read at request time (the app runs with `next start` from the repo root, so docs/
 * is on disk). Its content is ours, not user input, so the HTML is rendered as is.
 */
const GUIDE_PATH = path.join(process.cwd(), 'docs', 'admin-guide.md')

/** GitHub-style heading anchor, so the guide's links work both here and on GitHub. */
const anchor = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s/g, '-')

async function renderGuide() {
  const source = await fs.readFile(GUIDE_PATH, 'utf8')
  const toc: { id: string; title: string }[] = []

  const marked = new Marked({
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const id = anchor(text)
        if (depth === 2) toc.push({ id, title: text })
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`
      },
    },
  })

  const html = await marked.parse(source)
  return { html, toc }
}

export async function HelpView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props
  // Custom views are not behind Payload's login on their own
  if (!initPageResult.req.user) redirect('/admin/login?redirect=%2Fadmin%2Fhelp')
  const { html, toc } = await renderGuide()

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user ?? undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <Gutter>
        <style>{STYLES}</style>
        <div className="admin-guide">
          <nav className="admin-guide__toc" aria-label="Зміст довідки">
            <p className="admin-guide__toc-title">Зміст</p>
            <ul>
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.title}</a>
                </li>
              ))}
            </ul>
          </nav>
          <article className="admin-guide__body" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}

// Payload's theme variables, so the page follows the admin's light/dark theme
const STYLES = `
.admin-guide {
  display: grid;
  gap: calc(var(--base) * 2);
  padding: var(--base) 0 calc(var(--base) * 3);
}
@media (min-width: 1200px) {
  .admin-guide { grid-template-columns: minmax(0, 1fr) 280px; }
  .admin-guide__toc { order: 2; position: sticky; top: calc(var(--base) * 4); align-self: start; }
}
.admin-guide__toc {
  border: 1px solid var(--theme-elevation-150);
  border-radius: var(--style-radius-m);
  padding: calc(var(--base) * 0.8);
}
.admin-guide__toc-title { margin: 0 0 calc(var(--base) * 0.4); font-weight: 600; }
.admin-guide__toc ul { list-style: none; margin: 0; padding: 0; }
.admin-guide__toc li { margin: 0; }
.admin-guide__toc a {
  display: block;
  padding: 4px 0;
  color: var(--theme-elevation-700);
  text-decoration: none;
}
.admin-guide__toc a:hover { color: var(--theme-text); text-decoration: underline; }

.admin-guide__body { line-height: 1.6; }
.admin-guide__body h1 { margin: 0 0 calc(var(--base) * 0.5); }
.admin-guide__body h2 {
  margin: calc(var(--base) * 2.5) 0 calc(var(--base) * 0.6);
  padding-top: calc(var(--base) * 1);
  border-top: 1px solid var(--theme-elevation-150);
}
.admin-guide__body h3 { margin: calc(var(--base) * 1.6) 0 calc(var(--base) * 0.4); }
.admin-guide__body h2, .admin-guide__body h3 { scroll-margin-top: calc(var(--base) * 4); }
.admin-guide__body p, .admin-guide__body ul, .admin-guide__body ol { margin: 0 0 calc(var(--base) * 0.6); }
.admin-guide__body li { margin-bottom: 4px; }
.admin-guide__body li > ul { margin: 4px 0 0; }
.admin-guide__body a { color: var(--theme-success-600); }
.admin-guide__body code {
  background: var(--theme-elevation-100);
  border-radius: 4px;
  padding: 1px 5px;
  font-size: 0.9em;
  word-break: break-word;
}
.admin-guide__body blockquote {
  margin: var(--base) 0;
  padding: calc(var(--base) * 0.6) calc(var(--base) * 0.8);
  border-left: 3px solid var(--theme-warning-500);
  background: var(--theme-elevation-50);
}
.admin-guide__body blockquote p:last-child { margin-bottom: 0; }
.admin-guide__body table {
  width: 100%;
  border-collapse: collapse;
  margin: 0 0 var(--base);
}
.admin-guide__body th, .admin-guide__body td {
  text-align: left;
  vertical-align: top;
  padding: 8px 10px;
  border: 1px solid var(--theme-elevation-150);
}
.admin-guide__body th { background: var(--theme-elevation-50); font-weight: 600; }
`
