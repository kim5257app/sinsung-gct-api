import mariadb from 'mariadb';
import { DBArgs } from './typedef';
import { Error } from '../debug/error';

export class Transaction {
  private pool: mariadb.Pool;
  private conn: mariadb.PoolConnection | undefined;

  constructor(pool: mariadb.Pool) {
    this.pool = pool;
  }

  public async begin() {
    this.conn = await this.pool.getConnection();
    await this.conn.beginTransaction();
  }

  public async commit() {
    await this.conn?.commit();
    this.conn?.release();
  }

  public async rollback() {
    await this.conn?.rollback();
    this.conn?.release();
  }

  public async query(form: {
    sql: string,
    batch?: boolean,
    args: DBArgs | DBArgs[] | (string | number)[],
    done?: (result: Array<any>) => any
  }) {
    try {
      let namedPlaceholders;

      if (form.batch && form.args instanceof Array) {
        namedPlaceholders = !(form.args[0] instanceof Array);
      } else {
        namedPlaceholders = !(form.args instanceof Array);
      }

      let result;

      if (form.batch != null && form.batch) {
        result = await this.conn?.batch({sql: form.sql, namedPlaceholders}, form.args);
      } else {
        result = await this.conn?.query({sql: form.sql, namedPlaceholders}, form.args);
      }

      return (form.done != null) ? form.done(result) : result;
    } catch (error) {
      Error.makeThrow(error);
    }
  }
}
