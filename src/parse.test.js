import { parse } from './parse';
import { Decimal } from 'decimal.js';
import fs from 'fs';

it('parses', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  parse(fileContent);
});

it('parses accounts', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const accounts = parse(fileContent).accounts;
  expect(accounts.length).toBe(5);
  expect(accounts[1]).toBe("Assets");
});

it('parses commodities', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const commodities = parse(fileContent).commodities;
  expect(commodities.length).toBe(1);
  expect(commodities[0]).toBe("$");
});

it('parses prices', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const prices = parse(fileContent).prices;
  expect(prices.length).toBe(8);
  expect(prices[7]).toEqual({
    date: new Date("2018/02/25 00:00:00"),
    symbol: "TTFIX",
    price: new Decimal("13.03"),
  });
});


it('parses transactions', () => {
  const fileContent = fs.readFileSync('src/test.dat', 'utf8');
  const transactions = parse(fileContent).transactions;
  expect(transactions.length).toBe(3);
  expect(transactions[0]).toEqual({
    date: new Date("2014/01/02"),
    desc: "Initial Balances",
    postings: [
      {
        account: "Assets:Savings Account",
        amount: new Decimal("146.0640"),
        commodity: "QCEQRX",
        price: undefined
      },
      {
        account: "Equity:Initial Balances",
        amount: undefined,
        commodity: undefined,
        price: undefined
      },
    ]
  });
  expect(transactions[1]).toEqual({
    date: new Date("2014/01/03"),
    desc: "Cash from Contribution",
    postings: [
      {
        account: "Assets:Savings Account",
        amount: new Decimal("199.99924280"),
        commodity: "$",
        price: undefined
      },
      {
        account: "Income:Retirement Contributions",
        amount: undefined,
        commodity: undefined,
        price: undefined
      },
    ]
  });
  expect(transactions[2]).toEqual({
    date: new Date("2014/01/03"),
    desc: "Buy QCEQRX with cash from Contribution",
    postings: [
      {
        account: "Assets:Savings Account",
        amount: new Decimal("1.4005"),
        commodity: "QCEQRX",
        price: new Decimal("142.8056")
      },
      {
        account: "Assets:Savings Account",
        amount: undefined,
        commodity: undefined,
        price: undefined
      },
    ]
  });
});
