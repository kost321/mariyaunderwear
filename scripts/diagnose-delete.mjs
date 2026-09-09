// Діагностика: чому DELETE товару падає 500 на проді.
// Виконує послідовність видалень у транзакції та РОЛБЕКАЄ — нічого не змінює.
// Запуск: node --import tsx scripts/diagnose-delete.mjs
import { readFileSync } from 'fs'
import pg from 'pg'

for (const line of readFileSync('./.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2]
}

const id = Number(process.argv[2] || 174)
const client = new pg.Client({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
})
await client.connect()

// Ті самі таблиці, які Payload чистить при видаленні товару.
const steps = [
  ['products_images', `DELETE FROM products_images WHERE _parent_id = $1`],
  ['products_sizes', `DELETE FROM products_sizes WHERE _parent_id = $1`],
  ['products_colors', `DELETE FROM products_colors WHERE _parent_id = $1`],
  [
    'payload_locked_documents_rels',
    `DELETE FROM payload_locked_documents_rels WHERE products_id = $1`,
  ],
  [
    'orders_products (SET NULL)',
    `UPDATE orders_products SET product_id = NULL WHERE product_id = $1`,
  ],
  ['products', `DELETE FROM products WHERE id = $1`],
  [
    'payload_preferences',
    `DELETE FROM payload_preferences WHERE key = $1`,
    [`collection-products-${id}`],
  ],
]

await client.query('BEGIN')
for (const [name, q, params] of steps) {
  try {
    const r = await client.query(q, params ?? [id])
    console.log(`OK   ${name}  (${r.rowCount} rows)`)
  } catch (e) {
    console.log(`FAIL ${name}`)
    console.log(`     ${e.message}`)
    break
  }
}
await client.query('ROLLBACK')
await client.end()
console.log('\n(rolled back — нічого не змінено)')
