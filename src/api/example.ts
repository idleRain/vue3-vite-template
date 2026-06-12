import { request } from '@/services'

export const getHello = () => {
  return request.get('/example/hello').json()
}
