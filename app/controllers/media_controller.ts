import type { HttpContext } from '@adonisjs/core/http'
import Media from '#models/media'
import EpisodesSery from '#models/episodes_series'
import { MediaData } from '../../types/media.js'

export default class MediaController {
  /**
   * Transforme un enregistrement média (en snake_case) en objet camelCase.
   */
  private serializeMedia(media: any): MediaData {
    const BASE_URL = 'http://localhost:3333'

    // Helper pour parser une chaîne JSON en tableau, sinon renvoyer un tableau vide
    const parseToArray = (field: unknown): string[] => {
      if (Array.isArray(field)) {
        return field.map(String)
      }
      if (typeof field === 'string') {
        try {
          return JSON.parse(field).map(String)
        } catch {
          return []
        }
      }
      return []
    }

    // Utilisation de la valeur existante pour les images
    const mainImagePath = media.main_image || media.mainImage
    const logoPath = media.logo || media.Logo

    // Objet de base pour le média
    const mediaData: MediaData = {
      id: media.id,
      title: media.title,
      description: media.description,
      categories: parseToArray(media.categories),
      directors: parseToArray(media.directors),
      casting: parseToArray(media.casting),
      mainImage: mainImagePath ? `${BASE_URL}${mainImagePath}` : null,
      logo: logoPath ? `${BASE_URL}${logoPath}` : null,
      type: media.type,
      videoPath: media.type === 'film' ? `${BASE_URL}/storage/media/film/${media.id}.mp4` : '',
    }

    // Si le média est une série, on ajoute les épisodes
    if (media.type === 'series' && media.episodes) {
      mediaData.episodes = media.episodes.map((episode: any) => {
        return {
          id: episode.id,
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          title: episode.title,
          description: episode.description,
          image: episode.imageSeries ? `${BASE_URL}${episode.imageSeries}` : mediaData.mainImage, // Image par défaut si aucune
          videoPath: `${BASE_URL}/storage/media/series/${media.id}/season_${episode.seasonNumber}/episode_${episode.episodeNumber}.mp4`,
        }
      })
    }

    return mediaData
  }

  /**
   * Transforme un tableau d'enregistrements média.
   */
  private serializeMedias(medias: any[]): MediaData[] {
    return medias.map((media) => this.serializeMedia(media))
  }

  public async getLatestMedia({ response }: HttpContext) {
    try {
      const medias = await Media.query()
        .select('id', 'title', 'categories', 'main_image', 'logo', 'type', 'directors', 'casting')
        .orderBy('created_at', 'desc')
        .limit(5)

      const result = this.serializeMedias(medias)
      return response.ok(result)
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
        .select('id', 'title', 'categories', 'main_image', 'logo', 'type', 'directors', 'casting')
        .where('type', type)
        .orderBy('created_at', 'desc')
      const result = this.serializeMedias(medias)
      return response.ok(result)
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
        .orderBy('created_at', 'desc')
      const result = this.serializeMedias(results)
      return response.ok(result)
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

      // Si le média est une série, on charge également ses épisodes
      if (media.type === 'series') {
        const episodes = await EpisodesSery.query()
          .where('mediaId', mediaId)
          .orderBy('seasonNumber')
          .orderBy('episodeNumber')

        media.$setRelated('episodes', episodes)
      }

      const result = this.serializeMedia(media)
      return response.ok(result)
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving media information.',
        error,
      })
    }
  }

  public async getAllMedias({ response }: HttpContext) {
    try {
      const medias = await Media.query().select('id', 'title', 'type')

      // Formatter les résultats
      const result = {
        films: medias.filter((m) => m.type === 'film').map((m) => ({ id: m.id, title: m.title })),
        series: medias
          .filter((m) => m.type === 'series')
          .map((m) => ({ id: m.id, title: m.title })),
      }

      return response.ok(result)
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving media ids and titles.',
        error,
      })
    }
  }
}
