import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("staking_apy", (table) => {
    table.string("asset").primary();
    table.string("apy");
    table.string("total_rewards");
    table.string("total_rewards_in_usd");
    table.string("total_staked");
    table.string("total_staked_in_usd");
    table.string("start_level");
    table.string("start_timestamp");
    table.string("farming_contract");
    table.string("duration");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("staking_apy");
}
