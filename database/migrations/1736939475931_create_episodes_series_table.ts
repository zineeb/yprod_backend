// Migration for episodes_series table (series episodes)
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'episodes_series'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('nb_episode').notNullable()
      table.integer('nb_season').notNullable()
      table.string('title').notNullable()
      table.text('description')
      table.string('image_series').nullable().defaultTo(null)
      table.integer('id_serie').unsigned().references('id').inTable('medias').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['nb_season', 'nb_episode'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
