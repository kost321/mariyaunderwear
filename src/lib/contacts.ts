/**
 * Store contacts shown on the "Контакти" and "Співпраця" pages.
 * Empty values are hidden (or shown inactive); fill them in once the owner provides them.
 */
export const CONTACTS = {
  email: 'mariyaunderwear.ua@gmail.com',
  /** Customer care. Format for display, e.g. '+380 (66) 681 28 25' */
  phone: '+380 (66) 681 28 25',
  phoneHours: 'прийом дзвінків щодня 9:00-20:00',
  messengerHours: 'прийом повідомлень щодня 9:00-20:00',
  /** Wholesale / B2B questions */
  wholesalePhone: '+380 (97) 724 05 88',
  wholesaleContact: 'Марія',
  postcode: '80100',
  address: 'вул. Мазепи, 12, Шептицький, Львівська область',
  instagram: '',
  tiktok: '',
}

/** Phone number as digits with a leading "+", for tel: and messenger links. */
export const phoneHref = (phone: string) => phone.replace(/[^\d+]/g, '')
