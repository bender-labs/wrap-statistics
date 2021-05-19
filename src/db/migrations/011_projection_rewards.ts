import {Knex} from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("projection_rewards", (table) => {
    table.bigInteger("start").index();
    table.bigInteger("end").index();
    table.string("asset");
    table.string("tezos_address");
    table.decimal("amount", 256, 18);
    table.decimal("reward", 256, 18);
  });
  await knex.schema.table("projection_rewards", (table) => {
    table.primary(["start", "end", "asset", "tezos_address"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("projection_rewards");
}
