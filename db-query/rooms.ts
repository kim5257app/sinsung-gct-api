import { DBArgs } from '../db/typedef';
import util from '../util';
import dbHelper from './helper';

const roomsFields = {
  roomNo: 'rooms.`no`',
  name: 'rooms.`name`',
  created: 'rooms.created',
  updated: 'rooms.updated',
  disabled: 'rooms.disabled',
  offset: 'room_user_map.`offset`',
  id: 'room_user_map.id',
};

export default {
  addRoom: (args: DBArgs) => ({
    sql:
      "INSERT INTO rooms(`name`, public, `write`)\n" +
      "VALUES (:name, :public, :write)",
    args,
  }),
  updateRoom: (args: DBArgs) => ({
    sql: (() => {
      const update =
        "UPDATE rooms\n" +
        "SET\n";

      let set = dbHelper.transUpdateToSql(
        args,
        [
          'name',
          'public',
          'write',
        ],
        roomsFields,
      );

      const where = "\nWHERE no=:no";

      return (set !== '') ? `${update}${set}${where}` : '';
    })(),
    args: () => ({
      ...args,
      public: (args.public) ? 1 : 0,
      write: (args.write) ? 1 : 0,
    }),
  }),
  getRoomListSummary: (args: DBArgs) => ({
    sql: (() => {
      const where = dbHelper.transFiltersToSql(args.filters, roomsFields);
      const sel =
        "SELECT COUNT(*) AS `count`\n" +
        "FROM rooms\n"

      return `${sel}${((where === '') ? '' : `WHERE\n${where}\n`)}`;
    })(),
    args: [
      ...dbHelper.transFiltersToArgs(args.filters),
    ],
    done: (result: Array<any>) => ((result.length > 0) ? {
      ...result[0],
      public: (result[0].public > 0),
      write: (result[0].write > 0),
    } : null),
  }),
  getRoomList: (args: DBArgs) => ({
    sql: (() => {
      const where = dbHelper.transFiltersToSql(args.filters, roomsFields);
      const order = dbHelper.transSortToSql(args, roomsFields);
      const sel =
        "SELECT\n" +
        "  rooms.`no`, rooms.`name`,\n" +
        "  rooms.public, rooms.`write`,\n" +
        "  rooms.created, rooms.updated, rooms.disabled,\n" +
        "  room_user_map.`offset`\n" +
        "FROM rooms\n" +
        "JOIN room_user_map ON room_user_map.room_no=rooms.`no`\n" +
        "JOIN messages ON messages.room_no=rooms.`no`\n";
      const lookup =
        "JOIN\n" +
        "  (SELECT rooms.`no`" +
        "  FROM rooms\n" +
        "  JOIN room_user_map ON room_user_map.room_no=rooms.`no`\n" +
        "  JOIN messages ON messages.room_no=rooms.`no`\n" +
        ((where === '') ? '' : `WHERE\n${where}\n`) +
        order +
        dbHelper.transOffsetToSql(args) +
        "  ) AS lookup\n" +
        "ON rooms.`no`=lookup.`no`\n";
      return `${sel}${lookup}${order}`;
    })(),
    args: [
      ...dbHelper.transFiltersToArgs(args.filters),
      ...dbHelper.transOffsetToArgs(args),
    ],
  }),
  mappingUser: (args: DBArgs) => ({
    sql:
      "INSERT INTO room_user_map(\n" +
      "  room_no, id,\n" +
      "  `start`,\n" +
      "  `offset`,\n" +
      "  `master`, manager, `write`\n" +
      ")\n" +
      "SELECT\n" +
      "  :roomNo, :id,\n" +
      "  IFNULL(MAX(`no`), 0),\n" +
      "  IFNULL(MAX(`no`), 0),\n" +
      "  :master, :manager, :write\n" +
      "FROM messages",
    args: {
      master: (args.master) ? 1 : 0,
      manager: (args.manager) ? 1 : 0,
      write: (args.write) ? 1 : 0,
    },
  }),
}
