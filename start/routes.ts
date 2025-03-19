import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const MediaController = () => import('#controllers/media_controller')
const MediaAdminController = () => import('#controllers/media_admin_controller')

router.get('/', async () => ({ hello: 'world' }))

router.get('medias/latest', [MediaController, 'getLatestMedia'])
router.get('medias', [MediaController, 'getMediasByType'])
router.get('search', [MediaController, 'search'])
router.get('media', [MediaController, 'showInformations'])
// router.get('medias/all', [MediaController, 'getAllMedias'])

router.post('auth/register', [AuthController, 'register'])
router.post('auth/login', [AuthController, 'login'])
router.get('auth/session', [AuthController, 'session'])

// Administrative routes protected by the "admin" middleware
router
  .group(() => {
    // Create or update a media (film or series)
    router.post('media', [MediaAdminController, 'createOrUpdateMedia'])
    router.put('media/:id', [MediaAdminController, 'createOrUpdateMedia'])
    router.delete('media/:id', [MediaAdminController, 'deleteMedia'])

    // Create or update an episode for a series
    router.post('episode', [MediaAdminController, 'createOrUpdateEpisode'])
    router.put('episode/:episodeId', [MediaAdminController, 'createOrUpdateEpisode'])
    // Delete an episode from a series
    router.delete('episode/:episodeId', [MediaAdminController, 'deleteEpisode'])
  })
  .use(middleware.auth())
  .use(middleware.admin())
