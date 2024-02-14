import { createInterface } from 'node:readline';

import Parser from './parsing/parser';


async function _main() {
  console.clear();
  // style the console

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = () => {
    rl.question('>> ', input => {
      if(!input || input === 'exit') {
        rl.close();
        return process.exit(0);
      }

      const parser = new Parser(input);
      
      try {
        const ast = parser.parse();
        console.log((JSON.stringify(ast, null, 2)));

        question();
      } catch (err: any) {
        console.log('\n\n'.concat(err.message) + '\n');
        process.exit(1);
      }
    });
  };

  question();
}

_main();
