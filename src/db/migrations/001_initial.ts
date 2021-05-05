import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("locks", (table) => {
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
    table.decimal("ethereum_transaction_fee", 256, 0);
    table.bigInteger("ethereum_timestamp");
    table.decimal("ethereum_notional_value", 256, 2);
    table.string("tezos_to");
  });
  await knex.schema.createTable("app_state", (table) => {
    table.string("key").primary();
    table.string("value");
  });
  await knex.schema.createTable("tezos_quorum", (table) => {
    table.string("admin").primary();
    table.integer("threshold");
  });
  await knex.schema.createTable("tezos_quorum_signers", (table) => {
    table.string("ipns_key").primary();
    table.string("public_key");
    table.boolean("active");
  });
  await knex.schema.createTable("ethereum_quorum", (table) => {
    table.string("admin").primary();
    table.integer("threshold");
  });
  await knex.schema.createTable("ethereum_quorum_signers", (table) => {
    table.string("address").primary();
    table.boolean("active");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("locks");
  await knex.schema.dropTableIfExists("app_state");
  await knex.schema.dropTableIfExists("tezos_quorum");
  await knex.schema.dropTableIfExists("tezos_quorum_signers");
  await knex.schema.dropTableIfExists("ethereum_quorum");
  await knex.schema.dropTableIfExists("ethereum_quorum_signers");
}
