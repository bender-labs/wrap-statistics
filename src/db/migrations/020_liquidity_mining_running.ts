import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("liquidity_mining_apy", (table) => {
    table.boolean("running");
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
