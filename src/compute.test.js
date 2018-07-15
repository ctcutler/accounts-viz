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

it('filters by time', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const d1 = new Date("2014/01/02");
  const d2 = new Date("2014/01/03");
  expect(filterByTime(d1, d2)(parsed.transactions).length).toBe(3);
  expect(filterByTime(d1, d1)(parsed.transactions).length).toBe(1);
  expect(filterByTime(d1, null)(parsed.transactions).length).toBe(3);
  expect(filterByTime(null, d2)(parsed.transactions).length).toBe(3);
});
