/* THIS FILE WAS GENERATED FOR PAYLOAD ADMIN.
 * It wires up the Payload admin providers and styles.
 * Do not edit the logic unless necessary. */
import type { ServerFunctionClient } from 'payload'

import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap.js'

import '@payloadcms/next/css'
import './custom.css'

import React from 'react'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
