import * as R from 'ramda';
import parsed from './parsed';
import {
  filterByAccount, balance, dataPoints, addEmptyPoints, accumulateValues, hydrate, makeDates
} from './compute';

const formatDate = R.invoker(1, "toLocaleDateString")("en-US");
const formatDecimal = R.invoker(0, 'valueOf');
const dataSeries = (granularity, pattern, start, end, accumulate) => {
  const { prices, transactions } = hydrate(parsed);
  return R.compose(
    R.map(formatDecimal),
    R.pluck(1),
    d => accumulate ? accumulateValues(d) : d,
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

export { dateLabels, dataSeries };