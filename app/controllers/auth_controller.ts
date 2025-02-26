import { HttpContext } from '@adonisjs/core/http'
import { loginUserSchema, registerUserSchema } from '#validators/auth'
import User from '#models/user'
import Hash from '@adonisjs/core/services/hash'

export default class AuthController {
  public async register({ request, response }: HttpContext) {
    try {
      const data = request.all()
      const payload = await registerUserSchema.validate(data)

      const user = await User.create({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
      })

      const expiresIn = '7d'
      const token = await User.accessTokens.create(user, ['*'], { expiresIn })

      return response.created({
        message: 'Utilisateur créé avec succès',
        user,
        token,
      })
    } catch (error) {
      return response.badRequest(error.messages || error.message)
    }
  }

  public async login({ request, response }: HttpContext) {
    try {
      const data = request.all()
      const payload = await loginUserSchema.validate(data)

      const user = await User.query().where('email', payload.email).firstOrFail()

      if (!(await Hash.verify(user.password, payload.password))) {
        return response.unauthorized('Identifiants invalides')
      }

      const expiresIn = '7d'
      const token = await User.accessTokens.create(user, ['*'], { expiresIn })

      return response.ok({
        message: 'Connexion réussie',
        token,
      })
    } catch (error) {
      return response.unauthorized('Échec de la connexion')
    }
  }

  public async session({ auth }: HttpContext) {
    await auth.check()
    return { user: auth.user }
  }
}
