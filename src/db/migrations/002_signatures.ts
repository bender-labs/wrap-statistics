import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("signatures", (table) => {
    table.string("cid").primary();
    table.string("signer");
    table.string("wrap_id");
    table.string("type");
    table.string("signature");
    table.integer("level");
    table.string("erc");
    table.string("reason");
    table.string("owner").index();
    table.string("amount");
    table.string("token_id");
    table.string("transaction_hash");
    table.string("operation_id");
    table.string("block_hash");
    table.integer("log_index");
    table.string("signer_address");
  });
  // await knex.schema.createTable("wraps", (table) => {
  //   table.string("id").primary();
  //   table.bigInteger("created_at");
  //   table.bigInteger("updated_at");
  //   table.string("type");
  //   table.string("token");
  //   table.decimal("amount", 256);
  //   table.string("token_id");
  //   table.string("ethereum_symbol");
  //   table.string("ethereum_from");
  //   table.string("ethereum_transaction_hash");
  //   table.string("ethereum_block_hash");
  //   table.bigInteger("ethereum_block");
  //   table.decimal("ethereum_transaction_fee", 256);
  //   table.bigInteger("ethereum_timestamp");
  //   table.decimal("ethereum_notional_value", 256);
  //   table.string("tezos_to");
  //   table.bigInteger("signature_count");
  //   table.string("status");
  // });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("signatures");
  // await knex.schema.dropTableIfExists("wraps");
}
