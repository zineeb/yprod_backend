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
        fullName: payload.full_name,
        email: payload.email,
        password: payload.password,
      })

      // Définir la durée d'expiration du jeton, par exemple 7 jours
      const expiresIn = '7d'

      // Générer un jeton d'accès pour le nouvel utilisateur inscrit avec une expiration
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

      // Trouver l'utilisateur par e-mail
      const user = await User.query().where('email', payload.email).firstOrFail()

      // Vérifier le mot de passe
      if (!(await Hash.verify(user.password, payload.password))) {
        return response.unauthorized('Identifiants invalides')
      }

      // Définir la durée d'expiration du jeton, par exemple 7 jours
      const expiresIn = '7d'

      // Générer un jeton d'accès pour l'utilisateur avec une expiration
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
    return { user: auth.user, token: auth.token }
  }
}
