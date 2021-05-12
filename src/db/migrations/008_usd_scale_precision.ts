import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("rolling_wrap_usd_volume", (table) => {
    table.decimal("value", 256, 6).alter();
  });
  await knex.schema.alterTable("notional_usd", (table) => {
    table.decimal("value", 256, 6).alter();
  });
  await knex.schema.alterTable("wrap_usd_volume", (table) => {
    table.decimal("value", 256, 6).alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("rolling_wrap_usd_volume", (table) => {
    table.decimal("value", 256, 2).alter();
  });
  await knex.schema.alterTable("notional_usd", (table) => {
    table.decimal("value", 256, 2).alter();
  });
  await knex.schema.alterTable("wrap_usd_volume", (table) => {
    table.decimal("value", 256, 2).alter();
  });
}
