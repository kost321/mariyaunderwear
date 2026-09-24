import React from 'react'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import type { AdminViewServerProps } from 'payload'
import { TorgsoftImportForm } from './TorgsoftImportForm'

/**
 * Custom admін-сторінка «Імпорт з Торгсофт» — завантаження Excel/CSV
 * вивантаження зі складу, яке оновлює ціни/залишки товарів.
 * Зареєстрована в payload.config.ts під admin.components.views.
 */
export function TorgsoftImportView(props: AdminViewServerProps) {
  const { initPageResult, params, searchParams } = props

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
        <div style={{ paddingTop: 'var(--base)', paddingBottom: 'var(--base)' }}>
          <h1 style={{ marginBottom: 'calc(var(--base) * 0.4)' }}>
            Імпорт цін і залишків з Торгсофт
          </h1>
          <p
            style={{
              maxWidth: 720,
              marginBottom: 'var(--base)',
              color: 'var(--theme-elevation-600)',
            }}
          >
            Завантажте Excel-файл (вивантаження зі складу Торгсофт) — сайт оновить ціну,
            оптову ціну та залишки за розмірами для товарів, знайдених за артикулом і кольором.
          </p>
          <TorgsoftImportForm />
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
