import { Error } from '../debug/error';
import { DBArgs } from '../db/typedef';
import {query} from "express";

interface QueryFields {[name: string]: string}

export interface QueryFilter {
  where?: string;
  filters?: QueryFilter[];
  column?: string;
  condition?: string;
  value?: string | number | string[] | number[] | boolean | boolean[];
}

interface QueryOrder {
  sortBy?: string[];
  sortDesc?: string[];
}

interface QueryOffset {
  page?: number;
  itemsPerPage?: number;
  start?: number;
  count?: number;
}

const condTables: {[key: string]: string} = {
  inc: 'LIKE (?)',
  eq: '=?',
  ne: '!=?',
  gt: '>?',
  ge: '>=?',
  lt: '<?',
  le: '<=?',
  in: '', // 직접 생성
  none: 'IS NULL',
};

function makeCondString(filter: QueryFilter): string {
  let condition = condTables[filter.condition!];

  if (filter.condition === 'in') {
    condition = `IN (${(filter.value as []).map(() => '?').join(',')})`
  }

  return condition;
}

function transFilterToSql(filter: QueryFilter, fields: QueryFields): string {
  const column = (fields[filter.column!] != null)
    ? fields[filter.column!] : filter.column;
  const condition = makeCondString(filter);

  if (condition == null) {
    Error.makeThrow({
      name: 'WRONG_VALUE',
      message: 'Wrong filters',
    });
  }

  return `${column} ${condition}`;
}

export default {
  transUpdateToSql(args: DBArgs, columns: string[], fields: QueryFields): string {
    const items: string[] = [];

    columns.forEach((col) => {
      if (args[col] !== undefined) {
        const field = (fields[col] != null) ? fields[col] : col;
        items.push(`${field}=:${col}`);
      }
    });

    return items.join(',');
  },
  transFiltersToSql(filters: QueryFilter[], fields: QueryFields): string {
    const where = filters.map((filter, idx) => {
      let sql;

      if (filter.filters != null) {
        if (filter.filters.length > 0) {
          const operator = (idx > 0) ? filter.where : '';
          sql = `${operator} (${this.transFiltersToSql(filter.filters, fields)})`;
        }
      } else {
        const operator = (idx > 0) ? filter.where : '';
        sql = `${operator} ${transFilterToSql(filter, fields)}`;
      }

      return sql;
    }).join('\n');

    return (where === '') ? '' : where;
  },
  transFiltersToArgs(filters: QueryFilter[]): string[] {
    return filters
      .filter((filter) => (filter.condition !== 'none' || filter.filters != null))
      .map((filter) => {
        let ret: string | string[];
        let value = filter.value;

        if (typeof filter.value === 'boolean') {
          value = (value) ? 1 : 0;
        }

        if (filter.filters != null) {
          ret = this.transFiltersToArgs(filter.filters);
        } else if (filter.condition === 'in') {
          ret = filter.value as [];
        } else {
          ret = (filter.condition === 'inc') ? `%${value}%` : `${value}`;
        }

        return ret;
      }).flat(10);
  },
  transSortToSql({ sortBy, sortDesc }: QueryOrder, fields: QueryFields) {
    let order = '';

    if (sortBy!.length > 0) {
      order = 'ORDER BY ' +
        sortBy!.map((item, idx) => ({
          field: (fields[item] != null) ? fields[item] : item,
          desc: sortDesc![idx] ? 'DESC' : 'ASC',
        })).map(({ field, desc }) => (
          `${field} ${desc}`
        )).join();
    }

    return order;
  },
  transOffsetToArgs(queryOffset: QueryOffset): number[] {
    let ret: number[] = [];

    if (queryOffset.itemsPerPage != null) {
      ret = ((queryOffset.itemsPerPage! > 0)
        ? [(queryOffset.page! - 1) * queryOffset.itemsPerPage!, queryOffset.itemsPerPage,] : []);
    } else if (queryOffset.start != null) {
      ret = [queryOffset.start! - 1, queryOffset.count!];
    }

    return ret;
  },
  transOffsetToSql(queryOffset: QueryOffset): string {
    return (queryOffset.itemsPerPage != null && queryOffset.itemsPerPage > 0)
      || (queryOffset.start != null)
      ? '\nLIMIT ?, ?\n' : '';
  }
}
