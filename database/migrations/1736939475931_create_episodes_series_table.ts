import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'episodes_series'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('episode_number').notNullable()
      table.integer('season_number').notNullable()
      table.string('title').notNullable()
      table.text('description')
      table.string('image_series').nullable().defaultTo(null)
      table.integer('media_id').unsigned().references('id').inTable('medias').onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.index(['season_number', 'episode_number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
