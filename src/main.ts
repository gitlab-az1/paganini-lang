import { createInterface } from 'node:readline';

import Parser from './parsing/parser';
import { evaluate } from './runtime/interpreter';
import { createGlobalEnvironment } from './runtime/env';


async function _main() {
  console.clear();
  // style the console

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const e = createGlobalEnvironment();

  const question = (clear?: boolean) => {
    if(clear) {
      console.clear();
    }

    rl.question('>> ', input => {
      if(!input || input === 'exit') {
        rl.close();
        return process.exit(0);
      }

      if(input === 'clear') return question(true);
      const parser = new Parser(input);
      
      try {
        const ast = parser.parse();
        const result = evaluate(ast, e);

        console.log(ast, result);

        question();
      } catch (err: any) {
        console.log('\n\n'.concat(err.message), '\n');
        process.exit(1);
      }
    });
  };

  question();
}

_main();
