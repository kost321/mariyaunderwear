import 'server-only'

import configPromise from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

/**
 * getPayload — единая точка доступа к Local API Payload из серверного
 * кода (Server Components, route handlers, server actions).
 *
 * Local API работает напрямую с БД внутри того же процесса — без HTTP.
 * Это быстрее и безопаснее, чем дёргать собственный REST.
 *
 * Payload кэширует инстанс между вызовами, так что переподключения к БД
 * не происходит на каждый запрос.
 */
export const getPayload = async () => {
  return getPayloadInstance({ config: configPromise })
}
