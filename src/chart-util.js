import * as R from 'ramda';
import parsed from './parsed';
import moment from "moment";
import {
  filterByAccount, balance, dataPoints, addEmptyPoints, accumulateValues, hydrate, makeDates,
  filterByTime
} from './compute';

const formatDate = R.invoker(1, "toLocaleDateString")("en-US");
const formatDecimal = R.invoker(0, 'valueOf');
const ifTrue = (p, f) => d => p ? f(d) : d;
const dataSeries = options => {
  const { granularity, pattern, start, end, accumulate, negate } = options;
  const { prices, transactions } = hydrate(parsed);
  return R.compose(
    R.map(formatDecimal),
    ifTrue(negate, R.map(x => x.mul(-1))),
    R.pluck(1),
    filterByTime(start, end),
    ifTrue(accumulate, accumulateValues),
    addEmptyPoints(granularity, start, end),
    dataPoints(pattern, granularity),
    balance(prices),
    filterByAccount(pattern)
  )(transactions);
};
const dateLabels = (granularity, start, end) => {
  const dates = makeDates(granularity, start, end);
  return R.map(formatDate, dates);
};

const sumSeries = R.zipWith(R.add);

// base on the formula found here: http://math.stackexchange.com/questions/204020/what-is-the-equation-used-to-calculate-a-linear-trendline/204021#204021
const lrSlope = (xs, ys) =>
  (
    (xs.length * R.sum(R.zipWith(R.multiply, xs, ys)))
    -
    (R.sum(xs) * R.sum(ys))
  )
  /
  (
    (xs.length * R.sum(R.map(x => x * x, xs)))
    -
    (R.sum(xs) * R.sum(xs))
  );
const lrOffset = (xs, ys, slope) => (R.sum(ys) - (slope * R.sum(xs))) / xs.length;

/* If length is truthy, will return trend series that is that long, rather than length
 * of input series. */
const trendSeries = (s, length) => {
  const rateIndexes = R.range(0, s.length);
  const extendedRateIndexes = R.range(0, length ? length : s.length);
  const m = lrSlope(rateIndexes, s);
  const b = lrOffset(rateIndexes, s, m);
  return R.map(R.compose(R.add(b), R.multiply(m)), extendedRateIndexes);
};

const START = new Date("2014/11/01");
const END = moment().startOf("month").toDate();
const dateRange = () => [ START, END ];

export { dateLabels, dataSeries, sumSeries, trendSeries, dateRange };
