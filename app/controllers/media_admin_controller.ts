import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Media from '#models/media'
import EpisodeSeries from '#models/episodes_series'
import Application from '@adonisjs/core/services/app'

export default class MediaAdminController {
  /**
   * Create or update a media (film or series).
   * For films, a video file is required.
   * For series, only main data is handled; episodes are managed separately.
   */
  public async createOrUpdateMedia({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      // Récupérer les données de la requête et s'assurer qu'elles sont bien en tableau JSON
      const { id, title, description, type } = request.only(['id', 'title', 'description', 'type'])
      const categories = request.input('categories')
      const directors = request.input('directors')
      const casting = request.input('casting')

      // Vérifier que ces champs sont bien des tableaux JSON, sinon les convertir
      const parseToArray = (field: any) => {
        if (Array.isArray(field)) return field
        if (typeof field === 'string') {
          try {
            return JSON.parse(field)
          } catch {
            return []
          }
        }
        return []
      }

      let media: Media | null = null

      // Si un ID est fourni, on met à jour le média existant
      if (id) {
        media = await Media.find(id)
        if (media) {
          media.merge({
            title,
            description,
            categories: parseToArray(categories),
            directors: parseToArray(directors),
            casting: parseToArray(casting),
            type,
          })
          await media.save()
        }
      }

      // Si le média n'existe pas, on le crée
      if (!media) {
        media = await Media.create({
          title,
          description,
          categories: parseToArray(categories),
          directors: parseToArray(directors),
          casting: parseToArray(casting),
          type,
        })
      }

      const mainImage = request.file('mainImage', { extnames: ['jpg', 'jpeg', 'png'], size: '2mb' })
      if (mainImage) {
        await mainImage.move(Application.publicPath('storage/media/images'), {
          name: `media_${media.id}_main.${mainImage.extname}`,
          overwrite: true,
        })
        media.mainImage = `/storage/media/images/media_${media.id}_main.${mainImage.extname}`
      }

      const logo = request.file('logo', { extnames: ['jpg', 'jpeg', 'png'], size: '1mb' })
      if (logo) {
        await logo.move(Application.publicPath('storage/media/logos'), {
          name: `media_${media.id}_logo.${logo.extname}`,
          overwrite: true,
        })
        media.logo = `/storage/media/logos/media_${media.id}_logo.${logo.extname}`
      }
      if (type === 'film') {
        const video = request.file('video', { extnames: ['mp4'], size: '10000mb' })
        if (video) {
          await video.move(Application.publicPath('storage/media/film'), {
            name: `${media.id}.mp4`,
            overwrite: true,
          })
        }
      }

      await media.save()

      return response.ok({ message: 'Media created/updated successfully.', media })
    } catch (error) {
      return response.internalServerError({ message: 'Error creating/updating media', error })
    }
  }

  /**
   * Create or update an episode for a series.
   * Handles video file and episode image uploads.
   */
  public async createOrUpdateEpisode({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      // Récupérer les données de la requête
      const { mediaId, seasonNumber, episodeNumber, title, description } = request.only([
        'mediaId',
        'seasonNumber',
        'episodeNumber',
        'title',
        'description',
      ])

      if (!mediaId || !seasonNumber || !episodeNumber) {
        return response.badRequest({
          message: 'mediaId, seasonNumber and episodeNumber are required.',
        })
      }

      // Vérifier que la série existe
      const media = await Media.find(mediaId)
      if (!media || media.type !== 'series') {
        return response.notFound({ message: 'Series not found.' })
      }

      let episode = await EpisodeSeries.query()
        .where('mediaId', media.id)
        .where('seasonNumber', seasonNumber)
        .where('episodeNumber', episodeNumber)
        .first()

      if (episode) {
        // Mettre à jour l'épisode existant
        episode.merge({
          title,
          description,
        })
        await episode.save()
      } else {
        // Créer un nouvel épisode
        episode = await EpisodeSeries.create({
          mediaId: media.id,
          seasonNumber,
          episodeNumber,
          title,
          description: description || '',
        })
      }

      // Gérer l'upload du fichier vidéo
      const video = request.file('video', { extnames: ['mp4'], size: '10000mb' })
      if (video) {
        await video.move(
          Application.publicPath(`storage/media/series/${media.id}/season_${seasonNumber}`),
          {
            name: `episode_${episodeNumber}.mp4`,
            overwrite: true,
          }
        )
      }

      // Gérer l'upload de l'image de l'épisode
      const episodeImage = request.file('episodeImage', {
        extnames: ['jpg', 'jpeg', 'png'],
        size: '2mb',
      })
      if (episodeImage) {
        await episodeImage.move(
          Application.publicPath(`storage/media/series/${media.id}/season_${seasonNumber}`),
          {
            name: `episode_${episodeNumber}_image.${episodeImage.subtype}`,
            overwrite: true,
          }
        )
        // Stocker le chemin de l'image
        episode.imageSeries = `/storage/media/series/${media.id}/season_${seasonNumber}/episode_${episodeNumber}_image.${episodeImage.subtype}`
        await episode.save()
      }

      return response.ok({ message: 'Episode created/updated successfully.', episode })
    } catch (error) {
      return response.internalServerError({ message: 'Error creating/updating episode', error })
    }
  }

  /**
   * Deletes a media (film or series).
   * For series, associated episodes are deleted via CASCADE.
   */
  public async deleteMedia({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      const id = request.param('id')
      const media = await Media.find(id)
      if (!media) {
        return response.notFound({ message: 'Media not found' })
      }

      await media.delete()
      return response.ok({ message: 'Media deleted successfully.' })
    } catch (error) {
      return response.internalServerError({ message: 'Error deleting media', error })
    }
  }

  /**
   * Deletes an episode from a series.
   */
  public async deleteEpisode({ auth, request, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      const episodeId = request.param('episodeId')
      if (!episodeId) {
        return response.badRequest({ message: 'episodeId is required' })
      }

      const episode = await EpisodeSeries.find(episodeId)
      if (!episode) {
        return response.notFound({ message: 'Episode not found' })
      }

      await episode.delete()
      return response.ok({ message: 'Episode deleted successfully.' })
    } catch (error) {
      return response.internalServerError({ message: 'Error deleting episode', error })
    }
  }

  /**
   * Retrieves all episodes and their associated series titles.
   * Performs a join between episodes_series and medias using episodes_series.media_id = medias.id.
   * Returns the episode id, the episode title, and the series title.
   */
  public async getEpisodes({ auth, response }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      const episodes = await EpisodeSeries.query()
        .select(
          'episodes_series.id',
          'episodes_series.title as episode_title',
          'medias.title as series_title'
        )
        .join('medias', 'episodes_series.media_id', 'medias.id')

      return response.ok({
        message: 'Episodes retrieved successfully.',
        episodes: episodes.map((e) => ({
          id: e.id,
          episode_title: e.$extras.episode_title,
          series_title: e.$extras.series_title,
        })),
      })
    } catch (error) {
      console.log(error)
      return response.internalServerError({ message: 'Error retrieving episodes', error })
    }
  }
}
