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
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("signatures");
}
