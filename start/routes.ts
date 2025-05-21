import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { join } from 'node:path'
import { createReadStream, existsSync } from 'node:fs'

const AuthController = () => import('#controllers/auth_controller')
const MediaController = () => import('#controllers/media_controller')
const MediaAdminController = () => import('#controllers/media_admin_controller')

router.get('/', async () => ({ hello: 'world' }))

// start/routes.ts
import { statSync } from 'node:fs'

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

  const stat = statSync(filePath)
  const size = stat.size
  const range = request.header('range')

  /* ------------------------------------------------------------------ */
  /* 1. PAS d'en-tête Range  → envoi complet (200)                      */
  /* ------------------------------------------------------------------ */
  if (!range) {
    response
      .status(200)
      .header('Content-Length', size.toString())
      .header('Content-Type', 'video/mp4')
      .header('Accept-Ranges', 'bytes')
    return response.stream(createReadStream(filePath))
  }

  /* ------------------------------------------------------------------ */
  /* 2. AVEC Range → découpe + 206 Partial Content                      */
  /* ------------------------------------------------------------------ */
  // exemple "bytes=12345-" ou "bytes=12345-67890"
  const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
  const start = Number(startStr)
  const end = endStr ? Number(endStr) : size - 1
  const chunk = end - start + 1

  response
    .status(206)
    .header('Content-Range', `bytes ${start}-${end}/${size}`)
    .header('Accept-Ranges', 'bytes')
    .header('Content-Length', chunk.toString())
    .header('Content-Type', 'video/mp4')

  return response.stream(createReadStream(filePath, { start, end }))
})

// Routes pour les médias
router.get('medias/latest', [MediaController, 'getLatestMedia'])
router.get('medias', [MediaController, 'getMediasByType'])
router.get('search', [MediaController, 'search'])
router.get('media', [MediaController, 'showInformations'])
router.get('medias/all', [MediaController, 'getAllMedias'])
router.get('episodes/all', [MediaAdminController, 'getEpisodes'])

// Routes d'authentification
router.post('auth/register', [AuthController, 'register'])
router.post('auth/login', [AuthController, 'login'])
router.get('auth/session', [AuthController, 'session'])
router.post('auth/logout', [AuthController, 'logout'])

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
