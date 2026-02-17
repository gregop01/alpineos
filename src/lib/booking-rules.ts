import { addDays, differenceInDays, format, isBefore, parseISO } from 'date-fns';

export interface BookingRuleInput {
  provider: string;
  rolling_window_days: number | null;
  opening_time_pt: string | null;
  opening_time_mt: string | null;
  seasonal_launch_date: string | null;
  rules_metadata: Record<string, unknown>;
}

export interface NextOpening {
  date: string;
  daysUntil: number;
  timeZone: 'PT' | 'MT';
  time: string;
}

/**
 * Compute the next booking opening for a location based on its provider's rules.
 * Uses rolling windows and seasonal launch dates from the booking_rules table.
 */
export function getNextOpening(
  rules: BookingRuleInput | null,
  _locationId?: string
): NextOpening | null {
  if (!rules) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Seasonal launch (e.g. Berg Lake Dec 2, Bowron Feb 25)
  if (rules.seasonal_launch_date) {
    const launch = parseISO(rules.seasonal_launch_date);
    if (isBefore(today, launch)) {
      const daysUntil = differenceInDays(launch, today);
      const time = rules.opening_time_pt ?? rules.opening_time_mt ?? '07:00';
      return {
        date: format(launch, 'yyyy-MM-dd'),
        daysUntil,
        timeZone: rules.opening_time_mt ? 'MT' : 'PT',
        time,
      };
    }
  }

  // Rolling window (e.g. BC Parks 90 days)
  const windowDays = rules.rolling_window_days;
  if (windowDays != null) {
    const nextDate = addDays(today, windowDays);
    const daysUntil = differenceInDays(nextDate, today);
    const time = rules.opening_time_pt ?? rules.opening_time_mt ?? '07:00';
    return {
      date: format(nextDate, 'yyyy-MM-dd'),
      daysUntil,
      timeZone: rules.opening_time_mt ? 'MT' : 'PT',
      time,
    };
  }

  return null;
}
