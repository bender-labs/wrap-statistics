import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("stacking_apy", (table) => {
    table.renameColumn("total_rewards", "total_rewards_per_day");
    table.renameColumn("total_rewards_in_usd", "total_rewards_per_day_in_usd")
  });
}

export async function down(_knex: Knex): Promise<void> {
  return Promise.resolve();
}
