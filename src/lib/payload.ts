import 'server-only'

import configPromise from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

/**
 * getPayload: a single access point to the Payload Local API from server
 * code (Server Components, route handlers, server actions).
 *
 * The Local API talks to the DB directly inside the same process, without HTTP.
 * It is faster and safer than calling our own REST API.
 *
 * Payload caches the instance between calls, so the DB is not
 * reconnected on every request.
 */
export const getPayload = async () => {
  return getPayloadInstance({ config: configPromise })
}
