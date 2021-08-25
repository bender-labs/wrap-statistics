import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wrap_token_total_supply", (table) => {
    table.bigInteger("timestamp").primary();
    table.bigInteger("level");
    table.string("value");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wrap_token_total_supply");
}
