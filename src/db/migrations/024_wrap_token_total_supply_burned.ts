import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wrap_token_total_supply", (table) => {
    table.string("burned");
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
