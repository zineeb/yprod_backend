/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')
const MediaController = () => import('#controllers/media_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('medias/latest', [MediaController, 'getLatestMedia'])
router.get('medias', [MediaController, 'getMediasByType'])
router.get('search', [MediaController, 'search'])

router.get('media', [MediaController, 'showInformations'])

router.post('auth/register', [AuthController, 'register'])
router.post('auth/login', [AuthController, 'login'])
router.get('auth/session', [AuthController, 'session'])
