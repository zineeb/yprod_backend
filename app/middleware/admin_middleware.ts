import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AdminMiddleware {
  public async handle({ auth, response }: HttpContext, next: () => Promise<void>) {
    if (!auth.user) {
      return response.unauthorized({ message: 'Accès non autorisé.' })
    }
    const user = auth.user as User
    if (user.role !== 'admin') {
      return response.unauthorized({ message: 'Accès réservé aux administrateurs.' })
    }
    await next()
  }
}
