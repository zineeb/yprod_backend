import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Media from '#models/media'
import * as relations from '@adonisjs/lucid/types/relations'

export default class EpisodeSeries extends BaseModel {
  public static table = 'episodesSeries'

  @column({ isPrimary: true })
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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  get videoPath(): string {
    return `/storage/media/series/${this.mediaId}/season_${this.seasonNumber}/episode_${this.episodeNumber}.mp4`
  }

  @belongsTo(() => Media)
  declare media: relations.BelongsTo<typeof Media>
}
