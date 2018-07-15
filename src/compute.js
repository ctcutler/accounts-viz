import R from "ramda";
import { Decimal } from 'decimal.js';

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
 *   - fill in implicit amounts
 *   - aggregate to specified granularity
 *   - fill in missing data points
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

const mergeLeft = R.flip(R.merge);

/* Input: transaction with 1 amount-less posting
 * Output: transaction with amount-less posting set to negated sum of other posting amounts
 */
const balanceTransaction = transaction => {
  const postings = transaction.postings;
  const sum = R.reduce((acc, val) => acc.add(val.amount || 0), new Decimal(0), postings);
  const amount = sum.negated();
  const commodity = R.compose(
    R.head,
    R.filter(x => x !== undefined),
    R.map(R.prop('commodity'))
  )(postings);
  const updateIndex = R.findIndex(R.propEq('amount', undefined), postings);
  const postingUpdate = { amount, commodity };
  const balancedPostings = R.adjust(mergeLeft(postingUpdate), updateIndex, postings);
  return R.assoc('postings', balancedPostings, transaction);
};

/* Input: list of transactions
 * Output: list of balanced transactions
 */
const balance = R.map(balanceTransaction);

export { filterByAccount, filterByTime, balance };
