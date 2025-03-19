import type { HttpContext } from '@adonisjs/core/http'
import Media from '#models/media'
import EpisodesSery from '#models/episodes_series'
import { MediaData } from '../../types/media.js'

export default class MediaController {
  /**
   * Transforme un enregistrement média (en snake_case) en objet camelCase.
   */
  private serializeMedia(media: any): MediaData {
    // Helper pour parser une chaîne JSON en tableau, sinon renvoyer un tableau vide
    const parseToArray = (field: unknown): string[] => {
      if (Array.isArray(field)) {
        return field.map(String) // S'assure que tous les éléments sont des strings
      }
      if (typeof field === 'string') {
        try {
          return JSON.parse(field).map(String) // Convertit JSON en tableau de strings
        } catch {
          return [] // Retourne un tableau vide en cas d'erreur de parsing
        }
      }
      return []
    }

    // Construction du chemin vidéo pour les films
    const videoPath = `/storage/media/${media.type}/${media.id}.mp4`

    return {
      id: media.id,
      title: media.title,
      description: media.description,
      categories: parseToArray(media.categories), // Converti en tableau
      directors: parseToArray(media.directors),
      casting: parseToArray(media.casting),
      mainImage: media.main_image || media.mainImage,
      logo: media.logo,
      type: media.type,
      videoPath: videoPath,
    }
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
        .select('id', 'title', 'categories', 'main_image', 'logo')
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
        .select('id', 'title', 'categories', 'main_image')
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
          .orderBy('episodeNumber')
        // Stocker les épisodes dans la relation "episodes" pour faciliter la sérialisation
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
}
