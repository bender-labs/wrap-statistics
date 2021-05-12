import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wrap_usd_volume", (table) => {
    table.bigInteger("start").index();
    table.bigInteger("end").index();
    table.string("asset");
    table.decimal("value", 256, 2);
  });
  await knex.schema.table("wrap_usd_volume", (table) => {
    table.primary(["start", "end", "asset"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wrap_usd_volume");
}
