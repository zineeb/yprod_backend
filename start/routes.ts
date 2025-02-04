/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AuthController from "#controllers/auth_controller";
import MediaController from "#controllers/media_controller";

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('medias/latest',[MediaController,'getLatestMedia'])
router.get('medias', [MediaController, 'getMediasByType'])
router.get('search', [MediaController, 'search'])

router.get('media',[MediaController, 'showInformations'])

router.post('register',[AuthController,'register'])
router.post('login',[AuthController,'login'])

