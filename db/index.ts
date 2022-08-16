import mariadb from 'mariadb';
import { DBArgs } from './typedef';
import { Error } from '../debug/error';
import { Transaction } from './transaction';

export interface DBConfig extends mariadb.PoolConfig {
}

export class Database {
  static instance: Database | undefined;

  static async initialize(config: DBConfig): Promise<void> {
    Database.instance = new Database({
      ...config,
      insertIdAsNumber: true,
      bigIntAsNumber: true,
    });
    await Database.instance.checkConnection();
  }

  private readonly pool: mariadb.Pool;

  constructor (config: DBConfig) {
    this.pool = mariadb.createPool(config);
  }

  public async checkConnection() {
    let conn: mariadb.PoolConnection | undefined;

    try {
      conn = await this.pool?.getConnection();
    } catch (error) {
      Error.makeThrow(error);
    } finally {
      conn?.release();
    }
  }

  public async query(form: {
    sql: string,
    batch?: boolean,
    args: DBArgs | DBArgs[] | (string | number)[],
    done?: (result: Array<any>) => any
  }) {
    let conn;
    try {
      conn = await this.pool?.getConnection();

      let namedPlaceholders;

      if (form.batch && form.args instanceof Array) {
        namedPlaceholders = !(form.args[0] instanceof Array);
      } else {
        namedPlaceholders = !(form.args instanceof Array);
      }

      let result;

      if (form.batch != null && form.batch) {
        result = await conn?.batch({sql: form.sql, namedPlaceholders}, form.args);
      } else {
        result = await conn?.query({sql: form.sql, namedPlaceholders}, form.args);
      }

      return (form.done != null) ? form.done(result) : result;
    } catch (error) {
      Error.makeThrow(error);
    } finally {
      conn?.release();
    }
  }

  public async beginTransaction() {
    let transaction = null;

    if (this.pool) {
      transaction = new Transaction(this.pool);
      await transaction.begin();
    }

    return transaction!;
  }
}

export default {
  initialize: Database.initialize,
  getInstance: () => (Database.instance!),
}
