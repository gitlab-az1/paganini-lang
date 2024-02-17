import {
  print,
  printf,
} from './print';

import { math } from './math';


export const nativeMethods = {
  print,
  printf,
  math,
} as const;

export default Object.freeze(nativeMethods) as typeof nativeMethods;
