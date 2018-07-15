import { parse } from './parse';
import { filterByAccount, filterByTime } from './compute';
import { Decimal } from 'decimal.js';
import fs from 'fs';

it('filters by account', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = filterByAccount(/^Income/)(parsed.transactions);
  expect(transactions.length).toBe(1);
});

/*
it('filters by time', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  console.log(filterByTime(parsed).transactions[0].postings);
});
*/
