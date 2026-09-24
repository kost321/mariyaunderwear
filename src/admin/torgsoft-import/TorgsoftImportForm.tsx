'use client'

import React, { useState } from 'react'
import { Button } from '@payloadcms/ui'
import type { TorgsoftImportResult } from '@/lib/torgsoftImport'

export function TorgsoftImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TorgsoftImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/torgsoft-import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || `Помилка сервера (${res.status})`)
      }

      const data: TorgsoftImportResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle: React.CSSProperties = {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 'var(--style-radius-m, 4px)',
    padding: 'var(--base)',
    background: 'var(--theme-elevation-50)',
  }

  const summaryStyle: React.CSSProperties = {
    cursor: 'pointer',
    fontWeight: 600,
    padding: 'calc(var(--base) * 0.4) 0',
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--base)',
          marginBottom: 'var(--base)',
          maxWidth: 720,
        }}
      >
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button type="submit" disabled={!file || loading}>
          {loading ? 'Завантаження…' : 'Завантажити'}
        </Button>
      </form>

      {error && (
        <p style={{ color: 'var(--theme-error-500)', marginBottom: 'var(--base)' }}>
          Помилка: {error}
        </p>
      )}

      {result && (
        <div style={{ ...cardStyle, maxWidth: 720 }}>
          <h3 style={{ marginTop: 0, marginBottom: 'calc(var(--base) * 0.6)' }}>Результат</h3>
          <ul style={{ marginBottom: 'calc(var(--base) * 0.6)', paddingLeft: '1.25em' }}>
            <li>Оновлено: {result.updated}</li>
            <li>Не знайдено: {result.notFound.length}</li>
            <li>Неоднозначні (кілька збігів): {result.ambiguous.length}</li>
            <li>Пропущено: {result.skipped.length}</li>
          </ul>

          {result.updatedItems.length > 0 && (
            <details>
              <summary style={summaryStyle}>Оновлено ({result.updatedItems.length})</summary>
              <ul style={{ paddingLeft: '1.25em', paddingBottom: 'calc(var(--base) * 0.4)' }}>
                {result.updatedItems.map((r) => (
                  <li key={r.id}>
                    {r.title} — артикул {r.sku}, колір «{r.colorName}»{' '}
                    <a href={`/admin/collections/products/${r.id}`} target="_blank" rel="noreferrer">
                      відкрити
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {result.notFound.length > 0 && (
            <details>
              <summary style={summaryStyle}>Не знайдено ({result.notFound.length})</summary>
              <ul style={{ paddingLeft: '1.25em', paddingBottom: 'calc(var(--base) * 0.4)' }}>
                {result.notFound.map((r, i) => (
                  <li key={i}>
                    Артикул {r.sku}, колір «{r.colorName}»
                  </li>
                ))}
              </ul>
            </details>
          )}

          {result.ambiguous.length > 0 && (
            <details>
              <summary style={summaryStyle}>Неоднозначні ({result.ambiguous.length})</summary>
              <ul style={{ paddingLeft: '1.25em', paddingBottom: 'calc(var(--base) * 0.4)' }}>
                {result.ambiguous.map((r, i) => (
                  <li key={i}>
                    Артикул {r.sku}, колір «{r.colorName}» — знайдено {r.matchedIds.length} товари
                    (id: {r.matchedIds.join(', ')})
                  </li>
                ))}
              </ul>
            </details>
          )}

          {result.skipped.length > 0 && (
            <details>
              <summary style={summaryStyle}>Пропущено ({result.skipped.length})</summary>
              <ul style={{ paddingLeft: '1.25em', paddingBottom: 'calc(var(--base) * 0.4)' }}>
                {result.skipped.map((r, i) => (
                  <li key={i}>
                    Артикул {r.sku}, колір «{r.colorName}» — {r.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
