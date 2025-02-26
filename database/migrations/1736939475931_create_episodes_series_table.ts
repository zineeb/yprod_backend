import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'episodesSeries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('episodeNumber').notNullable()
      table.integer('seasonNumber').notNullable()
      table.string('title').notNullable()
      table.text('description')
      table.string('imageSeries').nullable().defaultTo(null)
      table.integer('mediaId').unsigned().references('id').inTable('medias').onDelete('CASCADE')
      table.timestamp('createdAt')
      table.timestamp('updatedAt')
      table.index(['seasonNumber', 'episodeNumber'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
