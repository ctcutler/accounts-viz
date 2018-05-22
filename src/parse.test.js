import { parse } from './parse';
import fs from 'fs';

it('parses', () => {
  const fileContent = fs.readFileSync('accounts.dat', 'utf8');
  parse(fileContent);
});
