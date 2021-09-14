import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("liquidity_mining_apy", (table) => {
    table.bigInteger("remaining_blocks").alter();
    table.bigInteger("remaining_seconds").alter();
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
