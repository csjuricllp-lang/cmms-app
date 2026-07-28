import { Injectable } from '@nestjs/common';
import { format, addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

@Injectable()
export class DateService {
  /**
   * Returns the current time in UTC
   */
  now(): Date {
    return new Date();
  }

  /**
   * Converts a UTC date to a specific timezone for display/logic
   */
  toTimezone(date: Date | string, timezone: string): Date {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return toZonedTime(d, timezone);
  }

  /**
   * Converts a localized date back to UTC for database storage
   */
  toUTC(date: Date | string, timezone: string): Date {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return fromZonedTime(d, timezone);
  }

  /**
   * Calculates the next due date based on frequency, ensuring no "drift"
   */
  calculateNextDueDate(
    baseDate: Date,
    frequencyType: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS',
    frequencyValue: number,
  ): Date {
    switch (frequencyType) {
      case 'DAYS':
        return addDays(baseDate, frequencyValue);
      case 'WEEKS':
        return addWeeks(baseDate, frequencyValue);
      case 'MONTHS':
        return addMonths(baseDate, frequencyValue);
      case 'YEARS':
        return addYears(baseDate, frequencyValue);
      default:
        return baseDate;
    }
  }

  /**
   * Standardized date formatting for notifications and reports
   */
  format(date: Date, pattern: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return format(date, pattern);
  }
}
