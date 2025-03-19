import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'medias'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.json('categories').notNullable()
      table.text('description')
      table.json('directors')
      table.integer('nb_episodes').nullable()
      table.json('casting')
      table.string('main_image')
      table.string('logo')
      table.enum('type', ['film', 'series']).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
