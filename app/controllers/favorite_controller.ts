import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Media from '#models/media'
import Favorite from '#models/favorite'

export default class FavoriteController {
  public async addFavorite({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      // Cast explicite de auth.user vers le modèle User
      const user = auth.user as User
      const mediaId = request.input('mediaId')
      if (!mediaId) {
        return response.badRequest({ message: 'mediaId est requis.' })
      }
      // Vérifier que le média existe
      const media = await Media.find(mediaId)
      if (!media) {
        return response.notFound({ message: 'Media introuvable.' })
      }
      // Vérifier que le média n'est pas déjà dans les favoris
      const exists = await Favorite.query()
        .where('userId', user.id)
        .andWhere('mediaId', mediaId)
        .first()
      if (exists) {
        return response.badRequest({ message: 'Ce média est déjà dans vos favoris.' })
      }
      const favorite = await Favorite.create({ userId: user.id, mediaId })
      return response.created({ message: 'Favori ajouté.', favorite })
    } catch (error) {
      return response.internalServerError({ message: 'Erreur lors de l’ajout du favori.', error })
    }
  }

  public async removeFavorite({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const mediaId = request.input('mediaId')
      if (!mediaId) {
        return response.badRequest({ message: 'mediaId est requis.' })
      }
      const favorite = await Favorite.query()
        .where('userId', user.id)
        .andWhere('mediaId', mediaId)
        .first()
      if (!favorite) {
        return response.notFound({ message: 'Favori introuvable.' })
      }
      await favorite.delete()
      return response.ok({ message: 'Favori supprimé.' })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la suppression du favori.',
        error,
      })
    }
  }

  public async getFavorites({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      const favorites = await Favorite.query().where('userId', user.id).preload('media')
      return response.ok(favorites)
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des favoris.',
        error,
      })
    }
  }
}
