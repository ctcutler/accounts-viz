import R from "ramda";
import { parse } from './parse';
import {
  filterByAccount, filterByTime, toDollars, balance, dataPoints, addEmptyPoints,
  accumulateValues, hydrate
} from './compute';
import { Decimal } from 'decimal.js';
import fs from 'fs';

it('hydrates parsed data', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const jsonString = JSON.stringify(parsed);
  const fromJson = JSON.parse(jsonString);
  const hydrated = hydrate(fromJson);
  expect(hydrated).toEqual(parsed);
});

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
  const d2 = new Date("2014/01/04");
  expect(filterByTime(d1, d2)(parsed.transactions).length).toBe(3);
  expect(filterByTime(d1, d1)(parsed.transactions).length).toBe(1);
  expect(filterByTime(d1, null)(parsed.transactions).length).toBe(3);
  expect(filterByTime(null, d2)(parsed.transactions).length).toBe(3);
});

it('converts to dollars', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const inDollars = toDollars(parsed.prices)(parsed.transactions);
  expect(inDollars[0].postings[0].amount).toEqual(new Decimal('32183.74176'));;
  expect(inDollars[0].postings[0].commodity).toBe('$');
  expect(inDollars[1].postings[0].amount).toEqual(new Decimal('199.99924280'));;
  expect(inDollars[1].postings[0].commodity).toBe('$');
  expect(inDollars[1].postings[1].amount).toBe(undefined);
  expect(inDollars[1].postings[1].commodity).toBe(undefined);
});

it('balances', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = R.compose(
    balance,
    toDollars(parsed.prices)
  )(parsed.transactions);
  expect(transactions[0].postings[1].commodity).toBe('$');
  expect(transactions[0].postings[1].amount).toEqual(new Decimal('-32183.74176'));
  expect(transactions[1].postings[1].commodity).toBe('$');
  expect(transactions[1].postings[1].amount).toEqual(new Decimal('-199.99924280'));
  expect(transactions[2].postings[1].commodity).toBe('$');
  expect(transactions[2].postings[1].amount).toEqual(new Decimal('-199.99924280'));
});

it('makes data points', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = R.compose(
    balance,
    toDollars(parsed.prices)
  )(parsed.transactions);
  const points = dataPoints('day')(transactions);
  expect(points).toEqual([
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/04"), new Decimal('399.9984856')]
  ]);
});

it('fills in missing data points', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = R.compose(
    balance,
    toDollars(parsed.prices)
  )(parsed.transactions);
  const points = dataPoints('day')(transactions);
  const filledOut = addEmptyPoints(
    'day', new Date("2014/01/01"), new Date("2014/01/05")
  )(points);
  expect(filledOut).toEqual([
    [new Date("2014/01/01"), new Decimal(0)],
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/03"), new Decimal(0)],
    [new Date("2014/01/04"), new Decimal('399.9984856')],
    [new Date("2014/01/05"), new Decimal(0)]
  ]);
});

it('accumulates data points', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = R.compose(
    balance,
    toDollars(parsed.prices)
  )(parsed.transactions);
  const points = dataPoints('day')(transactions);
  const accumulated = accumulateValues(points);
  expect(accumulated).toEqual([
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/04"), new Decimal('32583.7402456')],
  ]);
});
