import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import User from '#models/user'
import * as relations from '@adonisjs/lucid/types/relations'
import Media from '#models/media'

export default class Favorite extends BaseModel {
  public static table = 'userFavorites'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare mediaId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: relations.BelongsTo<typeof User>

  @belongsTo(() => Media)
  declare media: relations.BelongsTo<typeof Media>
}
