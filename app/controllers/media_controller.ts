import type { HttpContext } from '@adonisjs/core/http'
import Media from '#models/media'
import Application from '@adonisjs/core/services/app'
import { MediaData } from '../../types/media.js'
import EpisodesSery from '#models/episodes_series'

export default class MediaController {
  private serializeMedias(medias: Media[]) {
    return medias.map((media) => media.serialize())
  }

  public async getLatestMedia({ response }: HttpContext) {
    try {
      const medias = await Media.query()
        .select('id', 'title', 'categories', 'mainImage', 'logo')
        .orderBy('createdAt', 'desc')
        .limit(5)

      return response.ok(this.serializeMedias(medias))
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving latest media.',
        error,
      })
    }
  }

  public async getMediasByType({ request, response }: HttpContext) {
    try {
      const validTypes = ['film', 'series']
      const type = request.input('type')

      if (!validTypes.includes(type)) {
        return response.badRequest({
          message: 'Invalid media type. Valid types: "film" or "series".',
        })
      }

      const medias = await Media.query()
        .select('id', 'title', 'categories', 'mainImage')
        .where('type', type)
        .orderBy('createdAt', 'desc')

      return response.ok(this.serializeMedias(medias))
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving media by type.',
        error,
      })
    }
  }

  public async search({ request, response }: HttpContext) {
    try {
      const searchTerm = request.input('q')

      if (!searchTerm) {
        return response.badRequest({ message: 'Search term is required.' })
      }

      const results = await Media.query()
        .where('title', 'LIKE', `%${searchTerm}%`)
        .select('id', 'title', 'type')
        .orderBy('createdAt', 'desc')

      return response.ok(this.serializeMedias(results))
    } catch (error) {
      return response.internalServerError({
        message: 'Error searching media.',
        error,
      })
    }
  }

  public async showInformations({ request, response }: HttpContext) {
    try {
      const mediaId = request.input('id')
      const media = await Media.find(mediaId)

      if (!media) {
        return response.notFound({ message: 'Media not found.' })
      }

      const mediaPath = `/storage/media/${media.type}/${media.id}.mp4`

      const mediaData: MediaData = {
        id: media.id,
        title: media.title,
        description: media.description,
        categories: media.categories,
        directors: media.directors,
        casting: media.casting,
        mainImage: media.mainImage,
        logo: media.logo,
        type: media.type,
        videoPath: mediaPath,
      }

      if (media.type === 'series') {
        const episodes = await EpisodesSery.query()
          .where('mediaId', mediaId)
          .orderBy('episodeNumber')

        mediaData.episodes = episodes.map((episode) => ({
          id: episode.id,
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          description: episode.description,
          createdAt: episode.createdAt,
          image: episode.imageSeries || media.mainImage,
          videoPath: `/storage/media/series/${media.id}/season_${episode.seasonNumber}/episode_${episode.episodeNumber}.mp4`,
        }))
      }

      return response.ok(mediaData)
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving media information.',
        error,
      })
    }
  }

  public async createOrUpdateMedia({ request, response }: HttpContext) {
    try {
      const {
        id,
        title,
        description,
        categories,
        directors,
        casting,
        type,
        seasonNumber,
        episodeNumber,
      } = request.only([
        'id',
        'title',
        'description',
        'categories',
        'directors',
        'casting',
        'type',
        'seasonNumber',
        'episodeNumber',
      ])

      let media = await Media.find(id)

      if (media) {
        media.merge({ title, description, categories, directors, casting })
        await media.save()
      } else {
        media = await Media.create({ title, description, categories, directors, casting, type })
      }

      const video = request.file('video', { extnames: ['mp4'], size: '500mb' })
      if (video) {
        if (type === 'film') {
          await video.move(Application.publicPath(`storage/media/film`), {
            name: `${media.id}.mp4`,
            overwrite: true,
          })
        } else if (type === 'series' && seasonNumber && episodeNumber) {
          let episode = await EpisodesSery.query()
            .where('mediaId', media.id)
            .where('seasonNumber', seasonNumber)
            .where('episodeNumber', episodeNumber)
            .first()

          if (!episode) {
            episode = await EpisodesSery.create({
              mediaId: media.id,
              seasonNumber,
              episodeNumber,
              title: `${title} - S${seasonNumber}E${episodeNumber}`,
              description: description || '',
            })
          }

          await video.move(
            Application.publicPath(`storage/media/series/${media.id}/season_${seasonNumber}`),
            {
              name: `episode_${episodeNumber}.mp4`,
              overwrite: true,
            }
          )
        }
      }

      return response.ok({ message: 'Media saved successfully.', media })
    } catch (error) {
      return response.internalServerError({
        message: 'Error saving media.',
        error,
      })
    }
  }
}
