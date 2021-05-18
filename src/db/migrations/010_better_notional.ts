import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("notional_usd").delete();
  await knex("app_state").where("key", "last_usd_xtz_indexing_timestamp").delete();
  await knex("app_state").where("key", "last_notional_indexing_timestamp").delete();
}

export async function down(knex: Knex): Promise<void> {
  await knex("notional_usd").delete();
  await knex("app_state").where("key", "last_usd_xtz_indexing_timestamp").delete();
  await knex("app_state").where("key", "last_notional_indexing_timestamp").delete();
}
