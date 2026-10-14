import type { PayloadHandler } from 'payload'
import { parseTorgsoftFile, runTorgsoftImport } from './torgsoftImport'

/**
 * POST /api/torgsoft-import: accepts a file (multipart/form-data, field
 * "file"), updates products, returns a summary. Available only to logged-in
 * CMS admins (same pattern as access in the collections).
 */
export const torgsoftImportHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ message: 'Необхідна авторизація' }, { status: 401 })
  }

  if (!req.formData) {
    return Response.json({ message: 'Очікується multipart/form-data з файлом' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ message: 'Очікується multipart/form-data з файлом' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return Response.json({ message: 'Файл не знайдено у запиті' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const rows = parseTorgsoftFile(buffer)
    const result = await runTorgsoftImport(req.payload, rows)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка обробки файлу'
    return Response.json({ message }, { status: 400 })
  }
}
