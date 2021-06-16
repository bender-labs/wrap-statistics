import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("liquidity_mining_apy", (table) => {
    table.string("base").primary();
    table.string("quote");
    table.string("apy");
    table.string("total_rewards_per_day");
    table.string("total_rewards_per_day_in_usd");
    table.string("total_staked_in_usd");
    table.string("farming_contract");
    table.string("quipuswap_contract");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("liquidity_mining_apy");
}
