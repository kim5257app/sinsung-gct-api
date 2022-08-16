import moment, { Moment } from 'moment-timezone';

export default {
  toLocalTime(utc: string, timezone: string): Moment {
    return moment.utc(utc).tz(timezone);
  },
  getUtcTime(format?: string): string {
    return moment.utc().format(
      format ? format : 'YYYY-MM-DD HH:mm:ss'
    );
  },
  moment,
};
