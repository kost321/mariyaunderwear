'use client'

import React from 'react'
import { Link, NavGroup } from '@payloadcms/ui'

/**
 * Sidebar item for the «Довідка» page (HelpView). Same native nav classes as TorgsoftNavLink.
 * Registered in payload.config.ts under admin.components.afterNavLinks.
 */
export function HelpNavLink() {
  return (
    <NavGroup label="Довідка">
      <Link className="nav__link" href="/admin/help" prefetch={false}>
        <span className="nav__link-label">Як користуватися адмінкою</span>
      </Link>
    </NavGroup>
  )
}
