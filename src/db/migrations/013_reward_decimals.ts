import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex("projection_rewards").delete();
  await knex("app_state").where("key", "last_rewards_build_timestamp").delete();
  await knex.schema.alterTable("projection_rewards", (table) => {
    table.decimal("reward", 256, 8).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex("projection_rewards").delete();
  await knex("app_state").where("key", "last_rewards_build_timestamp").delete();
  await knex.schema.alterTable("projection_rewards", (table) => {
    table.decimal("reward", 256, 18).alter();
  });
}
