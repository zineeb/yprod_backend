import type { HttpContext } from '@adonisjs/core/http'
import Media from "#models/media";
import EpisodesSery from "#models/episodes_sery";
import {MediaData} from "../../types/media.js";

export default class MediaController {
  public async getLatestMedia({ response }: HttpContext) {
    try {
      const medias = await Media.query()
        .select('id', 'title', 'categories', 'main_image', 'logo')
        .orderBy('created_at', 'desc')
        .limit(5);

      const serialized_medias = medias.map((media) => media.serialize());

      return response.ok(serialized_medias);
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des médias : ',
        error,
      });
    }
  }

  public async getMediasByType({request, response}: HttpContext) {
    try {
      const valid_types = ['film','series']
      const type = request.input('type')

      if (!type || !valid_types.includes(type) ) {
        return response.badRequest({
          message: 'Type de média invalide ou manquant. Les types valides sont "film" et "series".',
        })
      }

      const medias = await Media.query()
        .select('id','title','categories','main_image')
        .where('type', type)
        .orderBy('created_at','desc')

      const serialized_medias = medias.map((media) => media.serialize());


      return response.ok(serialized_medias)
    } catch (error) {
      return response.internalServerError({ message: 'Erreur lors de la récupération des médias : ' , error })
    }
  }

  public async search({request, response}: HttpContext) {
    try {
      const search_term = request.input('q')

      if (!search_term) {
        return response.badRequest({
          message: 'Veuillez fournir un terme de recherche.',
        })
      }

      const results = await Media.query()
        .where('title', 'LIKE', `%${search_term}%`)
        .select('id', 'title', 'type')
        .orderBy('created_at', 'desc')

      return response.ok(results)
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la recherche des médias.',
        error,
      })
    }
  }

  public async showInformations({ request, response }: HttpContext) {
    try {
      const media_id = request.input('id');
      const media = await Media.find(media_id);

      if (!media) {
        return response.notFound({
          message: 'No such media',
        });
      }

      const media_data: MediaData = {
        id: media.id,
        title: media.title,
        description: media.description,
        categories: media.categories,
        directors: media.directors,
        casting: media.casting,
        main_image: media.mainImage,
        logo: media.logo,
        type: media.type,
      };

      if (media.type === 'series') {
        const episodes = await EpisodesSery.query()
          .where('id_serie', media_id)
          .orderBy('nb_episode');

        media_data.episodes = episodes.map((episode) => ({
          id: episode.id,
          season_number: episode.seasonNumber,
          episode_number: episode.episodeNumber,
          title: episode.title,
          description: episode.description,
          created_at: episode.createdAt,
          image: episode.imageSeries || media.mainImage,
        }));
      }

      return response.ok(media_data);
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération du média.',
        error,
      });
    }
  }
}
