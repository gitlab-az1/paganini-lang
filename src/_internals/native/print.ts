import { isBrowser } from '../utils';
import { RuntimeValue, runtimeValueToString } from '../../runtime/values';



export function printf(message: RuntimeValue, ...args: RuntimeValue[]): void {
  if(isBrowser()) return void console.log(runtimeValueToString(message), ...(args.map(runtimeValueToString)));

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { format } = require('util');
  let msg = format(runtimeValueToString(message), ...(args.map(runtimeValueToString)));

  if(msg.charAt(msg.length - 1) !== '\n') {
    msg += '\n';
  }

  process.stdout.write(msg);
}

export function print(message: RuntimeValue): void {
  if(isBrowser()) return void console.log(runtimeValueToString(message));
  process.stdout.write(runtimeValueToString(message));
}
