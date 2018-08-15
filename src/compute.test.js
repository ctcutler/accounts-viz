import R from "ramda";
import { parse } from './parse';
import {
  filterByAccount, filterByTime, balance, dataPoints, addEmptyPoints, accumulateValues, hydrate
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
  const transactions = balance(parsed.prices)(parsed.transactions);
  const points = dataPoints(/^Assets/, 'day')(transactions);
  const d1 = new Date("2014/01/02");
  const d2 = new Date("2014/01/04");
  expect(filterByTime(d1, d2)(points).length).toBe(2);
  expect(filterByTime(d1, d1)(points).length).toBe(1);
  expect(filterByTime(d1, null)(points).length).toBe(2);
  expect(filterByTime(null, d2)(points).length).toBe(2);
});

it('balances', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = balance(parsed.prices)(parsed.transactions);
  expect(transactions[0].postings[0].commodity).toBe('$');
  expect(transactions[0].postings[0].amount).toEqual(new Decimal('32183.74176'));
  expect(transactions[0].postings[1].commodity).toBe('$');
  expect(transactions[0].postings[1].amount).toEqual(new Decimal('-31959.6211584'));
  expect(transactions[1].postings[1].commodity).toBe('$');
  expect(transactions[1].postings[1].amount).toEqual(new Decimal('-199.99924280'));
  expect(transactions[2].postings[1].commodity).toBe('$');
  expect(transactions[2].postings[1].amount).toEqual(new Decimal('100'));
  expect(transactions[3].postings[0].commodity).toBe('$');
  expect(transactions[3].postings[0].amount).toEqual(new Decimal('308.58617'));
  expect(transactions[3].postings[1].commodity).toBe('$');
  expect(transactions[3].postings[1].amount).toEqual(new Decimal('-308.58617'));
});

it('makes data points', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = balance(parsed.prices)(parsed.transactions);
  const points = dataPoints(/^Assets/, 'day')(transactions);
  expect(points).toEqual([
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/04"), new Decimal('99.9992428')]
  ]);
});

it('fills in missing data points', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = balance(parsed.prices)(parsed.transactions);
  const points = dataPoints(/^Assets/, 'day')(transactions);
  const filledOut = addEmptyPoints(
    'day', new Date("2014/01/01"), new Date("2014/01/05")
  )(points);
  expect(filledOut).toEqual([
    [new Date("2014/01/01"), new Decimal(0)],
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/03"), new Decimal(0)],
    [new Date("2014/01/04"), new Decimal('99.9992428')],
    [new Date("2014/01/05"), new Decimal(0)]
  ]);
  const filledOut2 = addEmptyPoints(
    'day', new Date("2014/01/03"), new Date("2014/01/03")
  )(points);
  expect(filledOut2).toEqual([
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/03"), new Decimal(0)],
    [new Date("2014/01/04"), new Decimal('99.9992428')],
  ]);
});

it('accumulates data points', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const parsed = parse(fileContent);
  const transactions = balance(parsed.prices)(parsed.transactions);
  const points = dataPoints(/^Assets/, 'day')(transactions);
  const accumulated = accumulateValues(points);
  expect(accumulated).toEqual([
    [new Date("2014/01/02"), new Decimal('32183.74176')],
    [new Date("2014/01/04"), new Decimal('32283.7410028')],
  ]);
  const input = [
    [new Date("2014/01/04"), new Decimal(1)],
    [new Date("2014/01/04"), new Decimal(1)],
    [new Date("2014/01/04"), new Decimal(1)],
    [new Date("2014/01/04"), new Decimal(1)],
    [new Date("2014/01/04"), new Decimal(1)]
  ];
  const accumulated2 = accumulateValues(input);
  expect(accumulated2).toEqual([
    [new Date("2014/01/04"), new Decimal(1)],
    [new Date("2014/01/04"), new Decimal(2)],
    [new Date("2014/01/04"), new Decimal(3)],
    [new Date("2014/01/04"), new Decimal(4)],
    [new Date("2014/01/04"), new Decimal(5)]
  ]);
});
