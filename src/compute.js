import R from "ramda";
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
 *   - add empty data points (internal and external)
 *   - (optional) accumulate values
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

const transactionBefore = date => transaction => date === null || date >= transaction.date;
const transactionAfter = date => transaction => date === null || date <= transaction.date;

/* Input: pattern, list of transactions
 * Output: list of transactions having postings having accounts that match RE
 */
const filterByAccount = accountRE => R.filter(transactionHasAccount(accountRE));

/* Input: start, end, list of transactions
 * Output:
 * - list of transactions that occurred between start and end
 *   - endpoints are included
 *   - null start or end means open-ended range
 */
const filterByTime = (start, end) => R.compose(
  R.filter(transactionBefore(end)),
  R.filter(transactionAfter(start))
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

export { filterByAccount, filterByTime, toDollars, balance, dataPoints };
