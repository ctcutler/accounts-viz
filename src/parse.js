const R = require('ramda');
const Decimal = require('decimal.js');
const fs = require('fs');

const appendToProp = (prop, o) => v => R.assoc(
    prop, R.append(v, o[prop]), o
);
const toDecimal = R.construct(Decimal);
const toDate= R.constructN(1, Date);

const accountRE = /^account (.*)$/;
const commodityRE = /^commodity (.*)$/;
const priceRE = /^P (\S+ \S+) (\S+) \$(\d+\.\d+)$/;
const commentRE = /^;.*$/;
const transactionRE = /^(\d{4}\/\d{2}\/\d{2}) ([^\n]+)\n([\s\S]+?)$/;
// commodity is prefixed
const prefixPostingRE = /^\s{2,}(.+\S)\s{2,}([^\d\.-])([\d\.-]+)$/;
// commodity is postfixed
const postfixPostingRE = /^\s{2,}(.+\S)\s{2,}([\d\.-]+) (.+)$/;
// there is no amount
const implicitPostingRE = /^\s{2,}(.+)$/;
// the commodity is priced
const pricedPostingRE = /^\s{2,}(.+\S)\s{2,}(.+) (.+) @ \$(.+)$/;
const linesAndTransactionsRE = /\n(?=\S)|\n\n/;

const parseAccount = parsed => R.compose(
  appendToProp("accounts", parsed),
  R.nth(1),
  R.match(accountRE)
);
const parseCommodity = parsed => R.compose(
  appendToProp("commodities", parsed),
  R.nth(1),
  R.match(commodityRE)
);
const parsePrice = parsed => R.compose(
  appendToProp("prices", parsed),
  groups => ({
    date: toDate(groups[1]),
    symbol: groups[2],
    price: toDecimal(groups[3])
  }),
  R.match(priceRE)
);

const append = R.flip(R.append);

const parsePrefixPosting = R.compose(
  groups => ({
    account: groups[1],
    commodity: groups[2],
    amount: toDecimal(groups[3]),
    price: undefined
  }),
  R.match(prefixPostingRE)
);

const parsePostfixPosting = R.compose(
  groups => ({
    account: groups[1],
    commodity: groups[3],
    amount: toDecimal(groups[2]),
    price: undefined
  }),
  R.match(postfixPostingRE)
);

const parsePricedPosting = R.compose(
  groups => ({
    account: groups[1],
    commodity: groups[3],
    amount: toDecimal(groups[2]),
    price: toDecimal(groups[4])
  }),
  R.match(pricedPostingRE)
);

const parseImplicitPosting = R.compose(
  groups => ({
    account: groups[1],
    commodity: undefined,
    amount: undefined,
    price: undefined
  }),
  R.match(implicitPostingRE)
);

const parsePostings = R.compose(
  R.reduce((acc, val) =>
    R.compose(
      append(acc),
      R.cond([
        [ R.test(pricedPostingRE), parsePricedPosting ],
        [ R.test(postfixPostingRE), parsePostfixPosting ],
        [ R.test(prefixPostingRE), parsePrefixPosting ],
        [ R.test(implicitPostingRE), parseImplicitPosting ],
      ])
    )(val),
    []
  ),
  R.split("\n")
);

const parseTransaction = parsed => R.compose(
  appendToProp("transactions", parsed),
  groups => ({
    date: toDate(groups[1]),
    desc: groups[2],
    postings: parsePostings(groups[3])
  }),
  R.match(transactionRE)
);
const parseLine = (acc, val) => R.cond([
  [R.test(accountRE), parseAccount(acc)],
  [R.test(commodityRE), parseCommodity(acc)],
  [R.test(priceRE), parsePrice(acc)],
  [R.test(transactionRE), parseTransaction(acc)],
  [R.test(commentRE), R.always(acc)],
  [R.T, R.always(acc)]
])(val);

const parsedLines = {
  accounts: [],
  commodities: [],
  prices: [],
  transactions: [],
}
const parse = R.compose(
  R.reduce(parseLine, parsedLines),
  R.split(linesAndTransactionsRE)
);


if (require.main === module) {
  // FIXME: file names should probably be a command line arguments
  const fileContent = fs.readFileSync('accounts.dat', 'utf8');
  const parsed = parse(fileContent);
  const jsonString = JSON.stringify(parsed, null, 2);
  const jsString = `const parsed = ${jsonString};\n\nexport default parsed;\n`;
  fs.writeFile('src/parsed.js', jsString, 'utf8');
} else {
  module.exports = { parse };
}
