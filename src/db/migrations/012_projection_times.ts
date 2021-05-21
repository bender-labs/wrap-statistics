import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("projection_rewards").delete();
  await knex("projection_total_value_locked").delete();
  await knex("projection_wrap_volume").delete();
  await knex("projection_rolling_wrap_volume").delete();
  await knex("app_state").where("key", "last_rewards_build_timestamp").delete();
  await knex("app_state").where("key", "last_wrapping_usd_volume_build_timestamp").delete();
  await knex("app_state").where("key", "last_tvl_indexing_timestamp").delete();
}

export async function down(knex: Knex): Promise<void> {
  await knex("projection_rewards").delete();
  await knex("projection_total_value_locked").delete();
  await knex("projection_wrap_volume").delete();
  await knex("projection_rolling_wrap_volume").delete();
  await knex("app_state").where("key", "wrap_usd_volume_last_day_start").delete();
  await knex("app_state").where("key", "wrap_usd_volume_last_day_end").delete();
  await knex("app_state").where("key", "wrap_usd_volume_last_week_start").delete();
  await knex("app_state").where("key", "wrap_usd_volume_last_week_end").delete();
  await knex("app_state").where("key", "rewards_last_week_start").delete();
  await knex("app_state").where("key", "rewards_last_week_end").delete();
}
