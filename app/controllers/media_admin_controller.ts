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
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      // Get media data from the request
      const { id, title, description, categories, directors, casting, type } = request.only([
        'id',
        'title',
        'description',
        'categories',
        'directors',
        'casting',
        'type',
      ])

      let media: Media | null = null

      // If an ID is provided, attempt to update an existing media
      if (id) {
        media = await Media.find(id)
        if (media) {
          media.merge({ title, description, categories, directors, casting, type })
          await media.save()
        }
      }

      // If media does not exist, create a new one
      if (!media) {
        media = await Media.create({ title, description, categories, directors, casting, type })
      }

      // Handle main image upload if provided
      const mainImage = request.file('mainImage', { extnames: ['jpg', 'jpeg', 'png'], size: '2mb' })
      if (mainImage) {
        await mainImage.move(Application.publicPath('storage/media/images'), {
          name: `media_${media.id}_main.${mainImage.subtype}`,
          overwrite: true,
        })
        media.mainImage = `/storage/media/images/media_${media.id}_main.${mainImage.subtype}`
        await media.save()
      }

      // Handle logo upload if provided
      const logo = request.file('logo', { extnames: ['jpg', 'jpeg', 'png'], size: '1mb' })
      if (logo) {
        await logo.move(Application.publicPath('storage/media/logos'), {
          name: `media_${media.id}_logo.${logo.subtype}`,
          overwrite: true,
        })
        media.logo = `/storage/media/logos/media_${media.id}_logo.${logo.subtype}`
        await media.save()
      }

      // If the media is a film, handle video upload
      if (type === 'film') {
        const video = request.file('video', { extnames: ['mp4'], size: '10000mb' })
        if (video) {
          await video.move(Application.publicPath('storage/media/film'), {
            name: `${media.id}.mp4`,
            overwrite: true,
          })
        }
      }

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
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      // Get episode data from the request
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

      // Verify that the media exists and is a series
      const media = await Media.find(mediaId)
      if (!media || media.type !== 'series') {
        return response.notFound({ message: 'Series not found.' })
      }

      // Check if the episode already exists
      let episode = await EpisodeSeries.query()
        .where('mediaId', media.id)
        .where('seasonNumber', seasonNumber)
        .where('episodeNumber', episodeNumber)
        .first()

      if (episode) {
        // Update existing episode data
        episode.merge({ title, description })
        await episode.save()
      } else {
        // Create a new episode
        episode = await EpisodeSeries.create({
          mediaId: media.id,
          seasonNumber,
          episodeNumber,
          title,
          description: description || '',
        })
      }

      // Handle video file upload for the episode
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

      // Handle episode image upload if provided
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
        // Save the image path in the episode record
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
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      const id = request.input('id')
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
      const user = auth.user as User
      if (user.role !== 'admin') {
        return response.unauthorized({ message: 'User is not authorized' })
      }

      const episodeId = request.input('episodeId')
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
}
