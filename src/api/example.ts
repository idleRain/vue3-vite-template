import { request } from '@/services'

export const getHello = () => {
  return request.post('/example/hello').json()
}
