import { notFound } from 'next/navigation'

// Будь-яка невідома адреса всередині мови (/pl/whatever) → [locale]/not-found.tsx.
export default function CatchAll() {
  notFound()
}
