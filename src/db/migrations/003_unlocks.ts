import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("unlocks", (table) => {
    table.string('id').primary();
    table.bigInteger("created_at");
    table.bigInteger("updated_at");
    table.string('type');
    table.string('token');
    table.string('amount');
    table.string('token_id');
    table.string("ethereum_symbol");
    table.string("ethereum_to");
    table.string("ethereum_transaction_hash");
    table.string("ethereum_block_hash");
    table.bigInteger("ethereum_block");
    table.decimal("ethereum_transaction_fee", 256, 0);
    table.bigInteger("ethereum_timestamp");
    table.decimal("ethereum_notional_value", 256, 2);
    table.boolean('success');
    table.string('tezos_operation_hash');
    table.string('tezos_from');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("unlocks");
}
