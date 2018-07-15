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
 *   - filter by account
 *   - filter to time range
 *   - fill in implicit postings
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

export { filterByAccount, filterByTime };
