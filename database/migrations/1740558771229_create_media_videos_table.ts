import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'mediaVideos'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('mediaId')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('medias')
        .onDelete('CASCADE')
      table
        .integer('episodeId')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('episodesSeries')
        .onDelete('CASCADE')
      table.string('urlVideo').notNullable()
      table.timestamp('createdAt')
      table.timestamp('updatedAt')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
