import { DateTime } from 'luxon'
import {BaseModel, belongsTo, column} from '@adonisjs/lucid/orm'
import Media from "#models/media";
import * as relations from "@adonisjs/lucid/types/relations";

export default class EpisodesSery extends BaseModel {
  public static table = 'episodes_series'

  @column({isPrimary: true})
  declare id: number

  @column()
  declare mediaId: number

  @column()
  declare seasonNumber: number

  @column()
  declare episodeNumber: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare imageSeries: string | null

  @column.dateTime({autoCreate: true})
  declare createdAt: DateTime

  @column.dateTime({autoCreate: true, autoUpdate: true})
  declare updatedAt: DateTime

  @belongsTo(() => Media)
  declare media: relations.BelongsTo<typeof Media>
}
