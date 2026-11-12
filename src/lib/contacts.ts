/**
 * Store contacts shown on the "Контакти" and "Співпраця" pages.
 * Empty values are hidden (or shown inactive); fill them in once the owner provides them.
 */
export const CONTACTS = {
  /** Seller (ФОП) name for the public offer. Empty — shown without a name */
  seller: 'Климук Марія Іванівна',
  /** Seller's tax number (РНОКПП) for the public offer. Empty — not shown */
  sellerTaxId: '',
  email: 'mariyaunderwear.ua@gmail.com',
  /** Working hours, one line per item. En dashes without spaces in ranges: «Пн–Пт 09:00–18:00» */
  workHours: ['Пн–Пт 09:00–18:00', 'Сб–Нд вихідні'],
  /** Customer care. Format for display, e.g. '+380 (66) 681 28 25' */
  phone: '+380 (66) 681 28 25',
  /** Wholesale / B2B questions */
  wholesalePhone: '+380 (97) 724 05 88',
  wholesaleContact: 'Марія',
  postcode: '80100',
  /**
   * A warehouse, not a shop: there is nowhere to come in, so the page just says «Адреса». Postcode at the end.
   * The wholesale department works from the same premises, so the address is shown once.
   */
  // Non-breaking spaces keep «Львівська обл., 80100» on one line
  address: 'вул. Мазепи, 12, м.\u00A0Шептицький, Львівська\u00A0обл.,\u00A080100',
  /** The same address split into parts, for Google structured data (components/shop/JsonLd) */
  addressParts: { street: 'вул. Мазепи, 12', city: 'Шептицький', region: 'Львівська область' },
  instagram: 'https://www.instagram.com/mariyaunderwear',
  tiktok: 'https://www.tiktok.com/@mariyaunderwear',
}

/** Phone number as digits with a leading "+", for tel: links. */
export const phoneHref = (phone: string) => phone.replace(/[^\d+]/g, '')
