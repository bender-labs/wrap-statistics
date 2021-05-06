import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tvl", (table) => {
    table.bigInteger("timestamp").index();
    table.string("asset");
    table.decimal("value", 256, 18);
  });
  await knex.schema.table("tvl", (table) => {
    table.primary(["timestamp", "asset"]);
  });
  await knex.schema.createTable("notional_usd", (table) => {
    table.bigInteger("timestamp").index();
    table.string("asset");
    table.decimal("value", 256, 2);
  });
  await knex.schema.table("notional_usd", (table) => {
    table.primary(["timestamp", "asset"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tvl");
  await knex.schema.dropTableIfExists("notional_usd");
}
