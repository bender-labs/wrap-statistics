import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wraps", (table) => {
    table.string("id").primary();
    table.bigInteger("created_at");
    table.bigInteger("updated_at");
    table.string("type");
    table.string("token");
    table.decimal("amount", 256);
    table.string("token_id");
    table.string("ethereum_symbol");
    table.string("ethereum_from");
    table.string("ethereum_transaction_hash");
    table.string("ethereum_block_hash");
    table.bigInteger("ethereum_block");
    table.decimal("ethereum_transaction_fee", 256);
    table.bigInteger("ethereum_timestamp");
    table.decimal("ethereum_notional_value", 256);
    table.string("tezos_to");
    table.string("status");
    table.string("step");
  });
  await knex.schema.createTable("app_state", (table) => {
    table.string("key").primary();
    table.string("value");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wraps");
  await knex.schema.dropTableIfExists("app_state");
}
