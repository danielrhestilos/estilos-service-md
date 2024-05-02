import type { ClientsConfig, ServiceContext, RecorderState } from '@vtex/api'
import { LRUCache, method, Service , Cached} from '@vtex/api'

import { Clients } from './clients'
import { status } from './middlewares/status'
import { validate } from './middlewares/validate'
import { validateIntentoProps } from './middlewares/validateIntento'
import { validateRegistrosProps } from './middlewares/validateRegistros'

const TIMEOUT_MS = 3000
const CONCURRENCY = 10

// Create a LRU memory cache for the Status client.
// The 'max' parameter sets the size of the cache.
// The @vtex/api HttpClient respects Cache-Control headers and uses the provided cache.
// Note that the response from the API being called must include an 'etag' header
// or a 'cache-control' header with a 'max-age' value. If neither exist, the response will not be cached.
// To force responses to be cached, consider adding the `forceMaxAge` option to your client methods.
const memoryCache = new LRUCache<string, any>({ max: 5000 })

const tenantCacheStorage = new LRUCache<string, Cached>({
  max: 3000
})

const segmentCacheStorage = new LRUCache<string, Cached>({
  max: 3000
})

metrics.trackCache('tenant', tenantCacheStorage)
metrics.trackCache('segment', segmentCacheStorage)


metrics.trackCache('status', memoryCache)

// This is the configuration for clients available in `ctx.clients`.
const clients: ClientsConfig<Clients> = {
  // We pass our custom implementation of the clients bag, containing the Status client.
  implementation: Clients,
  options: {
    // All IO Clients will be initialized with these options, unless otherwise specified.
    default: {
      exponentialTimeoutCoefficient: 2,
      exponentialBackoffCoefficient: 2,
      initialBackoffDelay: 50,
      retries: 5,
      timeout: TIMEOUT_MS,
      concurrency: CONCURRENCY,
    },
    tenant: {
      memoryCache: tenantCacheStorage,
      timeout: TIMEOUT_MS
    },
    segment: {
      memoryCache: segmentCacheStorage,
      timeout:  TIMEOUT_MS
    },
    events: {
      timeout: TIMEOUT_MS
    },
    vbase: {
      concurrency: 5,
    },
    // This key will be merged with the default options and add this cache to our Status client.
    // status: {
    //   memoryCache,
    // },
  },
}

declare global {
  // We declare a global Context type just to avoid re-writing ServiceContext<Clients, State> in every handler and resolver
  type Context = ServiceContext<Clients, State>

  // The shape of our State object found in `ctx.state`. This is used as state bag to communicate between middlewares.
  interface State extends RecorderState {
    code: number
  }
}

// Export a service that defines route handlers and client options.

export default new Service({
  clients,
  routes: {
    // `status` is the route ID from service.json. It maps to an array of middlewares (or a single handler).
    status: method({
      GET: [validate, status],
    }),
    validateIntento:method({
      PUT: [validateIntentoProps]
    }),
    validateRegistros:method({
      PUT: [validateRegistrosProps]
    })
  },
})
