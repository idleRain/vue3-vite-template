import { helloResponse } from '../data/example'
import { http, HttpResponse } from 'msw'
import { guard } from '../helpers'

export const exampleHandlers = [
  http.post(
    '/api/example/hello',
    guard('POST /api/example/hello', () => HttpResponse.json(helloResponse))
  )
]
