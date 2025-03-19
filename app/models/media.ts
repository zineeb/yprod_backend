import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import * as relations from '@adonisjs/lucid/types/relations'
import EpisodesSery from '#models/episodes_series'

export default class Media extends BaseModel {
  public static table = 'medias'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column({
    consume: (value: string | null) => (value ? JSON.parse(value) : []),
    prepare: (value: string[]) => JSON.stringify(value),
  })
  declare categories: string[]

  @column()
  declare description: string | null

  @column({
    consume: (value: string | null) => (value ? JSON.parse(value) : []),
    prepare: (value: string[]) => JSON.stringify(value),
  })
  declare directors: string[]

  @column()
  declare nbEpisodes: number | null

  @column({
    consume: (value: string | null) => (value ? JSON.parse(value) : []),
    prepare: (value: string[]) => JSON.stringify(value),
  })
  declare casting: string[] | null

  @column()
  declare mainImage: string | null

  @column()
  declare logo: string | null

  @column()
  declare type: 'film' | 'series'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare updatedAt: DateTime

  @column()
  get videoPath(): string {
    return `/storage/media/${this.type}/${this.id}.mp4`
  }

  @hasMany(() => EpisodesSery)
  declare episodes: relations.HasMany<typeof EpisodesSery>
}
