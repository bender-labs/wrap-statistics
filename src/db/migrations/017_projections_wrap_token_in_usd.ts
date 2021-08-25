import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("projection_wrap_token_in_usd", (table) => {
    table.bigInteger("timestamp").index();
    table.string("value");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("projection_wrap_token_in_usd");
}
