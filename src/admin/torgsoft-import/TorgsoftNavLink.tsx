'use client'

import React from 'react'
import { Link, NavGroup } from '@payloadcms/ui'

/**
 * Пункт навігації в сайдбарі адмінки, що веде на сторінку імпорту з
 * Торгсофт. Реєструється в payload.config.ts під admin.components.afterNavLinks.
 * Використовує ті самі класи/компоненти (nav__link, Link, NavGroup), що й
 * стандартні пункти меню колекцій — щоб виглядало органічно, без власних
 * інлайн-стилів.
 */
export function TorgsoftNavLink() {
  return (
    <NavGroup label="Торгсофт">
      <Link className="nav__link" href="/admin/torgsoft-import" prefetch={false}>
        <span className="nav__link-label">Імпорт з Торгсофт</span>
      </Link>
    </NavGroup>
  )
}
