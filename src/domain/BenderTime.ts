import {DateTime, Interval} from "luxon";

export class BenderTime {

  getIntervals(interval: string): Interval[] {
    const referenceTime = DateTime.utc();

    switch (interval) {
      case "days": {
        const currentDayClosing = DateTime.utc().set({hour: 14, minute: 0, second: 0, millisecond: 0});
        return this.getIntervalFor(referenceTime, "days", currentDayClosing, this._daysFromLaunch());
      }
      case "weeks": {
        const currentWeekClosing = DateTime.utc().startOf("week").set({hour: 14, minute: 0, second: 0, millisecond: 0});
        return this.getIntervalFor(referenceTime, "weeks", currentWeekClosing, Math.ceil(this._daysFromLaunch() / 7));
      }
      default:
        return [];
    }
  }

  _daysFromLaunch(): number {
    return DateTime.utc().diff(DateTime.fromMillis(BenderTime.startMs), 'day').days;
  }

  getBenderDayFor(timestamp: number): Interval {
    const referenceTime = DateTime.fromMillis(timestamp, {zone: "utc"});
    const currentDayClosing = referenceTime.set({hour: 14, minute: 0, second: 0, millisecond: 0});
    return this.getIntervalFor(referenceTime, "days", currentDayClosing, 0)[0];
  }

  getBenderWeekFor(timestamp: number): Interval {
    const referenceTime = DateTime.fromMillis(timestamp, {zone: "utc"});
    const currentWeekClosing = referenceTime.startOf("week").set({hour: 14, minute: 0, second: 0, millisecond: 0});
    return this.getIntervalFor(referenceTime, "weeks", currentWeekClosing, 0)[0];
  }

  getIntervalFor(timeReference: DateTime, interval: string, currentIntervalClosing: DateTime, depth: number): Interval[] {
    const intervals: Interval[] = [];

    const initialInterval = timeReference.toMillis() < currentIntervalClosing.toMillis() ?
      Interval.fromDateTimes(currentIntervalClosing.minus({[interval]: 1}), currentIntervalClosing) :
      Interval.fromDateTimes(currentIntervalClosing, currentIntervalClosing.plus({[interval]: 1}));

    intervals.push(initialInterval);

    for (let i = 1; i < depth; i++) {
      intervals.push(Interval.fromDateTimes(initialInterval.start.minus({[interval]: i}), initialInterval.start.minus({[interval]: i - 1})));
    }

    return intervals;
  }

  public static startMs = 1619445600000;
}
