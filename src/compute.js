import * as R from 'ramda';
import moment from "moment";
import { Decimal } from "decimal.js";

/*
 * target visualizations
 * - net worth
 *   - two accumulating series (assets, liabilities)
 *   - two derived series (net worth, curve-fit projecting into future)
 * - saving rate
 *   - two non-accumulating series (expenses, income)
 *   - N derived series (actual/mean/median saving rate)
 * - common features
 *   - filterable by
 *     - time range
 *     - account
 *   - variable granularity
 *     - (days, weeks, months, quarters, years)
 *   - output format matches charting library requirements
 *
 * I think I can do all of these in one "over time" chart with lots
 * of config options.  So that plus some presets to satisfy the cases
 * seems best.  So what functions do I actually need?
 *
 *
 * processing order
 * - for every non-derived series
 *   x filter by account
 *   x filter to time range
 *   x convert everything to USD
 *   x fill in implicit amounts
 *   x data points in specified granularity
 *   x add empty data points (internal and external)
 *   x accumulate values
 * - derived series
 */


const postingHasAccount = accountRE => R.compose(
  matches => matches.length > 0,
  R.match(accountRE),
  R.prop('account')
);
const transactionHasAccount = accountRE => R.compose(
  matches => matches.length > 0,
  R.filter(postingHasAccount(accountRE)),
  R.prop('postings')
);

const dataPointBefore = date => point => date === null || date >= point[0];
const dataPointAfter = date => point => date === null || date <= point[0];

/* Input: pattern, list of transactions
 * Output: list of transactions having postings having accounts that match RE
 */
const filterByAccount = accountRE => R.filter(transactionHasAccount(accountRE));

/* Input: start, end, list of data points
 * Output:
 * - list of datap oints that occurred between start and end
 *   - endpoints are included
 *   - null start or end means open-ended range
 */
const filterByTime = (start, end) => R.compose(
  R.filter(dataPointBefore(end)),
  R.filter(dataPointAfter(start))
);

const postingToDollars = prices => posting => {
  if (posting.commodity === undefined || posting.commodity === '$') {
    return posting;
  }
  const pricesLookup = R.reduce((acc, val) => R.assoc(val.symbol, val.price, acc), {}, prices);
  const price = posting.price ? posting.price : pricesLookup[posting.commodity];
  return R.merge(posting, {commodity: '$', amount: posting.amount.mul(price), price: undefined});
};

/* Input: list of transactions with arbitrary commodities
 * Output: list of transactions in single commodity
 */
const toDollars = prices => R.map(
  transaction => R.assoc(
    'postings',
    R.map(postingToDollars(prices), transaction.postings),
    transaction
  )
);

const mergeLeft = R.flip(R.merge);

const reducePosting = (acc, v) => acc.add(v.amount);

/* Input: transaction with final posting lacking amount
 * Output: transaction with final posting set to negated sum of other posting amounts
 */
const balanceTransaction = transaction => {
  const postings = transaction.postings;
  const sum = R.reduce(reducePosting, new Decimal(0), R.init(postings));
  const amount = sum.negated();
  const commodity = '$';
  const updateIndex = R.findIndex(R.propEq('amount', undefined), postings);
  const postingUpdate = { amount, commodity };
  const balancedPostings = R.adjust(mergeLeft(postingUpdate), updateIndex, postings);
  return R.assoc('postings', balancedPostings, transaction);
};

/* Input: list of transactions
 * Output: list of balanced transactions
 */
const balance = R.map(balanceTransaction);

const startOf = unit => d => moment(d).startOf(unit).toDate();
const decimalAdd = (x, y) => x.add(y);

/* Input: time granularity (day|week|month|quarter|year), list of transactions
 * Output: list of datapoint objects in that granularity
 */
const dataPoints = granularity => R.compose(
  R.sortBy(R.head),
  R.map(pair => [new Date(pair[0]), pair[1]]),
  R.toPairs,
  R.reduce(R.mergeWith(decimalAdd), {}),
  R.map(
    trans => R.objOf(
      startOf(granularity)(trans.date).toString(),
      R.last(trans.postings).amount.negated()
    )
  )
);

const addTime = (d, n, granularity) => moment(d).add(n, granularity).toDate();
const dateDiff = (start, end, granularity) => moment(end).diff(moment(start), granularity);
const dateMap = R.compose(R.fromPairs, R.map(R.adjust(date => date.toString(), 0)));

/* Input: granularity, start, end, list of data points
 * Output: list of data points from start to end with all missing dates filled in
 */
const addEmptyPoints = (granularity, start, end) => points => {
  const existingMap = dateMap(points);
  const count = dateDiff(start, end, granularity) + 1;
  const dates = R.times(n => addTime(start, n, granularity), count);
  const newPoints = R.map(d => [d, R.defaultTo(Decimal(0), existingMap[d.toString()])], dates);
  const newMap = dateMap(newPoints);
  const merged = R.merge(existingMap, newMap);
  return R.compose(
    R.sortBy(R.head),
    R.map(p => [new Date(p[0]), p[1]]),
    R.toPairs
  )(merged);
};

/* Input: list of data points
 * Output: list of data points where every point's value is the sum of itself and all points that came before it
 */
const accumulateValues = R.reduce(
  R.ifElse(
    (acc, val) => acc.length > 0,
    (acc, val) => R.append([val[0], val[1].add(R.last(acc)[1])], acc),
    (acc, val) => R.append([val[0], val[1]], acc)
  ),
  []
);

// transactions are [{date: Date, postings: [ { amount: Decimal, price: Decimal } ]
// prices are  [{date: Date, price: Decimal}]
const safeDecimal = val => val === undefined ? undefined : new Decimal(val);
const safeDate = val => val === undefined ? undefined : new Date(val);
const hydrateDecimal = prop => obj => R.assoc(prop, safeDecimal(obj[prop]), obj);
const hydrateDate = prop => obj => R.assoc(prop, safeDate(obj[prop]), obj);
const hydratePrice = R.compose(hydrateDecimal('price'), hydrateDate('date'));
const hydratePosting = R.compose(hydrateDecimal('price'), hydrateDecimal('amount'));
const hydrateTransaction = R.compose(
  hydrateDate('date'),
  t => R.assoc('postings', R.map(hydratePosting, t.postings), t)
);

/* Input: parsed data with strings for dates and amounts
 * Output: parsed data with Dates and Decimals
 */
const hydrate = R.compose(
  d => R.assoc('transactions', R.map(hydrateTransaction, d.transactions), d),
  d => R.assoc('prices', R.map(hydratePrice, d.prices), d)
)

export {
  filterByAccount, filterByTime, toDollars, balance, dataPoints, addEmptyPoints,
  accumulateValues, hydrate
};
