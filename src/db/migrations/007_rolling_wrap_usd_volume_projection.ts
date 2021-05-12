import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("rolling_wrap_usd_volume", (table) => {
    table.string("name");
    table.string("asset");
    table.decimal("value", 256, 2);
  });
  await knex.schema.table("rolling_wrap_usd_volume", (table) => {
    table.primary(["name", "asset"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("rolling_wrap_usd_volume");
}
