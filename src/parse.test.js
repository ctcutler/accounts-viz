import { parse } from './parse';
import fs from 'fs';

it('parses', () => {
  const fileContent = fs.readFileSync('src/App.js', 'utf8');
  console.log(fileContent);
  parse(fileContent);
});
