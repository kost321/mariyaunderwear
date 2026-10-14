'use client'

import React from 'react'
import { Link, NavGroup } from '@payloadcms/ui'

/**
 * Navigation item in the admin sidebar that leads to the Torgsoft
 * import page. Registered in payload.config.ts under admin.components.afterNavLinks.
 * Uses the same classes/components (nav__link, Link, NavGroup) as the
 * standard collection menu items, so it looks native, without custom
 * inline styles.
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
