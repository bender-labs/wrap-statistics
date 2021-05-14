import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable("tvl");
  await knex.schema.dropTable("wrap_usd_volume");
  await knex.schema.dropTable("rolling_wrap_usd_volume");
  await knex.schema.createTable("projection_total_value_locked", (table) => {
    table.bigInteger("timestamp").index();
    table.string("asset");
    table.decimal("amount", 256, 18);
    table.decimal("usd_value", 256, 6);
  });
  await knex.schema.table("projection_total_value_locked", (table) => {
    table.primary(["timestamp", "asset"]);
  });
  await knex.schema.createTable("projection_wrap_volume", (table) => {
    table.bigInteger("start").index();
    table.bigInteger("end").index();
    table.string("asset");
    table.decimal("amount", 256, 18);
    table.decimal("usd_value", 256, 6);
  });
  await knex.schema.table("projection_wrap_volume", (table) => {
    table.primary(["start", "end", "asset"]);
  });
  await knex.schema.createTable("projection_rolling_wrap_volume", (table) => {
    table.string("name");
    table.string("asset");
    table.decimal("amount", 256, 18);
    table.decimal("usd_value", 256, 6);
  });
  await knex.schema.table("projection_rolling_wrap_volume", (table) => {
    table.primary(["name", "asset"]);
  });
  await knex("app_state").where("key", "last_tvl_indexing_timestamp").delete();
  await knex("app_state").where("key", "last_wrapping_usd_volume_build_timestamp").delete();
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("projection_total_value_locked");
  await knex.schema.dropTable("projection_wrap_volume");
  await knex.schema.dropTable("projection_rolling_wrap_volume");
  await knex.schema.createTable("tvl", (table) => {
    table.bigInteger("timestamp").index();
    table.string("asset");
    table.decimal("value", 256, 18);
  });
  await knex.schema.table("tvl", (table) => {
    table.primary(["timestamp", "asset"]);
  });
  await knex.schema.createTable("wrap_usd_volume", (table) => {
    table.bigInteger("start").index();
    table.bigInteger("end").index();
    table.string("asset");
    table.decimal("value", 256, 6);
  });
  await knex.schema.table("wrap_usd_volume", (table) => {
    table.primary(["start", "end", "asset"]);
  });
  await knex.schema.createTable("rolling_wrap_usd_volume", (table) => {
    table.string("name");
    table.string("asset");
    table.decimal("value", 256, 6);
  });
  await knex.schema.table("rolling_wrap_usd_volume", (table) => {
    table.primary(["name", "asset"]);
  });
  await knex("app_state").where("key", "last_tvl_indexing_timestamp").delete();
  await knex("app_state").where("key", "last_wrapping_usd_volume_build_timestamp").delete();
}
