import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'media_videos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('media_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('medias')
        .onDelete('CASCADE')
      table
        .integer('episode_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('episodes_series')
        .onDelete('CASCADE')
      table.string('url_video').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
