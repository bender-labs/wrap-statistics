import {DateTime, Interval} from "luxon";

export class BenderTime {

  public static startMs = 1619445600000;

  getIntervals(interval: string): Interval[] {
    switch (interval) {
      case "days": {
        const todayClosing = DateTime.utc().set({hour: 14, minute: 0, second: 0, millisecond: 0});
        return this.getIntervalFor("days", todayClosing, this._daysFromLaunch());
      }
      case "weeks": {
        const weekClosing = DateTime.utc().startOf("week").set({hour: 14, minute: 0, second: 0, millisecond: 0});
        return this.getIntervalFor("weeks", weekClosing, Math.ceil(this._daysFromLaunch() / 7));
      }
      default:
        return [];
    }
  }

  _daysFromLaunch(): number {
    return DateTime.utc().diff(DateTime.fromMillis(BenderTime.startMs), 'day').days;
  }

  getIntervalFor(interval: string, currentClosing: DateTime, depth: number): Interval[] {
    const intervals: Interval[] = [];
    const now = DateTime.utc();

    const initialInterval = now.toMillis() < currentClosing.toMillis() ?
      Interval.fromDateTimes(currentClosing.minus({[interval]: 1}), now) :
      Interval.fromDateTimes(currentClosing, now);

    intervals.push(initialInterval);

    for (let i = 1; i < depth; i++) {
      intervals.push(Interval.fromDateTimes(initialInterval.start.minus({[interval]: i}), initialInterval.start.minus({[interval]: i - 1})));
    }

    return intervals;
  }
}
