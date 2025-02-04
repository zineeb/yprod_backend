import { DateTime } from 'luxon'
import {BaseModel, column, hasMany} from '@adonisjs/lucid/orm'
import EpisodesSery from "#models/episodes_sery";
import * as relations from "@adonisjs/lucid/types/relations";

export default class Media extends BaseModel {
  public static table = 'medias'

  @column({isPrimary: true})
  declare id: number

  @column()
  declare title: string

  @column({
    consume: (value) => (value ? JSON.parse(value) : []),
    prepare: (value) => JSON.stringify(value),
  })
  declare categories: string[];

  @column()
  declare description: string | null

  @column({
    consume: (value) => (value ? JSON.parse(value) : []),
    prepare: (value) => JSON.stringify(value),
  })
  declare directors: string[] | null

  @column()
  declare nbEpisodes: number | null

  @column({
    consume: (value) => (value ? JSON.parse(value) : []),
    prepare: (value) => JSON.stringify(value),
  })
  declare casting: string[] | null

  @column()
  declare mainImage: string | null

  @column()
  declare logo: string | null

  @column()
  declare type: 'film' | 'series'

  @column.dateTime({autoCreate: true})
  declare createdAt: DateTime

  @column.dateTime({autoCreate: true, autoUpdate: true})
  declare updatedAt: DateTime

  @hasMany(() => EpisodesSery)
  declare episodes: relations.HasMany<typeof EpisodesSery>
}
