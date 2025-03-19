import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { join } from 'node:path'
import { createReadStream, existsSync } from 'node:fs'

const AuthController = () => import('#controllers/auth_controller')
const MediaController = () => import('#controllers/media_controller')
const MediaAdminController = () => import('#controllers/media_admin_controller')

router.get('/', async () => ({ hello: 'world' }))

// 🔥 Nouvelle route pour servir les fichiers statiques (images, vidéos)
router.get('/storage/media/*', async ({ request, response }) => {
  const fileParam = request.param('*')
  const filePath = join(
    process.cwd(),
    'public/storage/media',
    Array.isArray(fileParam) ? fileParam.join('/') : fileParam
  )

  if (!existsSync(filePath)) {
    return response.notFound({ message: 'File not found' })
  }

  return response.stream(createReadStream(filePath))
})

// Routes pour les médias
router.get('medias/latest', [MediaController, 'getLatestMedia'])
router.get('medias', [MediaController, 'getMediasByType'])
router.get('search', [MediaController, 'search'])
router.get('media', [MediaController, 'showInformations'])

// Routes d'authentification
router.post('auth/register', [AuthController, 'register'])
router.post('auth/login', [AuthController, 'login'])
router.get('auth/session', [AuthController, 'session'])

// Routes administratives protégées par middleware "admin"
router
  .group(() => {
    router.post('media', [MediaAdminController, 'createOrUpdateMedia'])
    router.put('media/:id', [MediaAdminController, 'createOrUpdateMedia'])
    router.delete('media/:id', [MediaAdminController, 'deleteMedia'])

    router.post('episode', [MediaAdminController, 'createOrUpdateEpisode'])
    router.put('episode/:episodeId', [MediaAdminController, 'createOrUpdateEpisode'])
    router.delete('episode/:episodeId', [MediaAdminController, 'deleteEpisode'])
  })
  .use(middleware.auth())
  .use(middleware.admin())
