/**
 * Store contacts shown on the "Контакти" and "Співпраця" pages.
 * Empty values are hidden (or shown inactive); fill them in once the owner provides them.
 */
export const CONTACTS = {
  /** Seller name for the public offer, e.g. 'Іваненко Марія Іванівна' (ФОП). Empty — shown without a name */
  seller: '',
  /** Seller's tax number (РНОКПП) for the public offer. Empty — not shown */
  sellerTaxId: '',
  email: 'mariyaunderwear.ua@gmail.com',
  /** Working hours, one line per item */
  workHours: ['Пн-Пт - 09:00 - 18:00', 'Сб, Нд - Вихідний'],
  /** Customer care. Format for display, e.g. '+380 (66) 681 28 25' */
  phone: '+380 (66) 681 28 25',
  /** Wholesale / B2B questions */
  wholesalePhone: '+380 (97) 724 05 88',
  wholesaleContact: 'Марія',
  wholesaleAddress: 'Шептицький, вул. Мазепи, 12',
  postcode: '80100',
  address: 'вул. Мазепи, 12, Шептицький, Львівська область',
  /** The same address split into parts, for Google structured data (components/shop/JsonLd) */
  addressParts: { street: 'вул. Мазепи, 12', city: 'Шептицький', region: 'Львівська область' },
  instagram: 'https://www.instagram.com/mariyaunderwear',
  tiktok: 'https://www.tiktok.com/@mariyaunderwear',
}

/** Phone number as digits with a leading "+", for tel: links. */
export const phoneHref = (phone: string) => phone.replace(/[^\d+]/g, '')
