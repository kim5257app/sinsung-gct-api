import { DBArgs } from '../db/typedef';
import util from '../util';
import dbHelper from './helper';

const usersFields = {
  id: 'users.id',
};

export default {
  addUser: (args: DBArgs) => ({
    sql:
      "INSERT INTO users(id, `name`)\n" +
      "VALUES (:id, :name)\n" +
      "ON DUPLICATE KEY UPDATE\n" +
      "  name=VALUE(`name`)",
    args,
  }),
  updateUser: (args: DBArgs) => ({
    sql: (() => {
      const update =
        "UPDATE users\n" +
        "SET\n";

      let set = dbHelper.transUpdateToSql(
        args,
        [
          'name',
          'permission',
        ],
        usersFields,
      );

      const where = "\nWHERE id=:id";

      return (set !== '') ? `${update}${set}${where}` : '';
    })(),
    args,
  }),
  getUserListSummary: (args: DBArgs) => ({
    sql: (() => {
      const where = dbHelper.transFiltersToSql(args.filters, usersFields);
      const sel =
        "SELECT COUNT(*) AS `count`\n" +
        "FROM users\n"

      return `${sel}${((where === '') ? '' : `WHERE\n${where}\n`)}`;
    })(),
    args: [
      ...dbHelper.transFiltersToArgs(args.filters),
    ],
    done: (result: Array<any>) => ((result.length > 0) ? result[0] : null),
  }),
  getUserList: (args: DBArgs) => ({
    sql: (() => {
      const where = dbHelper.transFiltersToSql(args.filters, usersFields);
      const order = dbHelper.transSortToSql(args, usersFields);
      const sel =
        "SELECT\n" +
        "  users.id, `name`, permission,\n" +
        "  created, updated\n" +
        "FROM users\n";
      const lookup =
        "JOIN\n" +
        "  (SELECT users.id FROM users\n" +
        ((where === '') ? '' : `WHERE\n${where}\n`) +
        order +
        dbHelper.transOffsetToSql(args) +
        "  ) AS lookup\n" +
        "ON users.id=lookup.id\n";
      return `${sel}${lookup}${order}`;
    })(),
    args: [
      ...dbHelper.transFiltersToArgs(args.filters),
      ...dbHelper.transOffsetToArgs(args),
    ],
  }),
}
