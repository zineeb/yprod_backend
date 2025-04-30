import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginUserSchema, registerUserSchema } from '#validators/auth'
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

  // Promotion d'un utilisateur en admin
  public async promoteUser({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      // Cast explicite de auth.user en User
      const currentUser = auth.user as User | null
      if (!currentUser || currentUser.role !== 'admin') {
        return response.unauthorized({ message: 'Accès réservé aux administrateurs.' })
      }
      const userId = request.input('userId')
      if (!userId) {
        return response.badRequest({ message: 'userId est requis.' })
      }
      const userToPromote = await User.find(userId)
      if (!userToPromote) {
        return response.notFound({ message: 'Utilisateur non trouvé.' })
      }
      if (userToPromote.role === 'admin') {
        return response.badRequest({ message: 'Cet utilisateur est déjà un admin.' })
      }
      userToPromote.role = 'admin'
      await userToPromote.save()
      return response.ok({ message: 'Utilisateur promu admin avec succès.', user: userToPromote })
    } catch (error) {
      return response.internalServerError({
        message: "Erreur lors de la promotion de l'utilisateur.",
        error,
      })
    }
  }

  // Suppression d'un compte utilisateur
  public async deleteUser({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      // Cast explicite de auth.user en User
      const currentUser = auth.user as User | null
      const userId = request.input('userId')
      if (!userId) {
        return response.badRequest({ message: 'userId est requis.' })
      }
      // Si l'utilisateur connecté tente de supprimer un compte autre que le sien,
      // il doit être admin.
      if (currentUser!.id !== userId) {
        if (currentUser!.role !== 'admin') {
          return response.unauthorized({
            message: 'Vous ne pouvez supprimer que votre propre compte.',
          })
        }
      }
      const userToDelete = await User.find(userId)
      if (!userToDelete) {
        return response.notFound({ message: 'Utilisateur non trouvé.' })
      }
      await userToDelete.delete()
      return response.ok({ message: 'Compte utilisateur supprimé avec succès.' })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la suppression du compte.',
        error,
      })
    }
  }
  public async logout({ auth, response }: HttpContext) {
    try {
      await auth.check()

      if (!auth.user) {
        return response.unauthorized()
      }

      const tokenId = auth.user!.currentAccessToken!.identifier

      await User.accessTokens.delete(auth.user!, tokenId)
      return response.ok({
        message: 'Déconnexion réussie',
      })
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error)
      return response.internalServerError({
        message: 'Erreur lors de la déconnexion.',
      })
    }
  }
}
