import Environment from './env';

export type ValueType =
  | 'null'
  | 'number'
  | 'boolean'
  | 'string'
  | 'symbol'
  | 'object'
  | 'native_function';


export interface RuntimeValue {
  type: ValueType;
  readonly: boolean;
}

export interface NullValue extends RuntimeValue {
  type: 'null';
  value: null;
}

export interface NumberValue extends RuntimeValue {
  type: 'number';
  value: number;
}

export interface BooleanValue extends RuntimeValue {
  type: 'boolean';
  value: boolean;
}

export interface StringValue extends RuntimeValue {
  type: 'string';
  value: string;
}

export interface ObjectValue extends RuntimeValue {
  type: 'object';
  properties: Map<string, RuntimeValue>;
}

export interface SymbolValue extends RuntimeValue {
  type: 'symbol';
  symbol: symbol;
}


export type FunctionCall = (env: Environment, ...args: RuntimeValue[]) => RuntimeValue;

export interface NativeFunctionValue extends RuntimeValue {
  type: 'native_function';
  invokableHandler: FunctionCall;
}


export function runtimeValueToString(message: RuntimeValue): string {
  let output: string = '';

  switch(message.type) {
    case 'boolean':
      output = String((message as BooleanValue).value);
      break;
    case 'native_function':
      output = `func ${(message as NativeFunctionValue).invokableHandler.name ?? 'anonymous'}() { [native code] }`;
      break;
    case 'null':
      output = '[null]';
      break;
    case 'number':
      output = String((message as NumberValue).value);
      break;
    case 'object':
      output = JSON.stringify((message as ObjectValue).properties.entries(), null, 2);
      break;
    case 'string':
      output = (message as StringValue).value;
      break;
    case 'symbol':
      output = `[Symbol ${String((message as SymbolValue).symbol)}]`;
      break;
    default:
      output = String(message);
  }

  return output;
}


export function MAKE_NUMBER(value: number = 0, readonly: boolean = false): NumberValue {
  return {
    type: 'number',
    readonly,
    value,
  };
}

export function MAKE_NULL(readonly: boolean = false): NullValue {
  return {
    type: 'null',
    value: null,
    readonly,
  };
}

export function MAKE_BOOL(value: boolean = false, readonly: boolean = false): BooleanValue {
  return {
    type: 'boolean',
    readonly,
    value,
  };
}

export function MAKE_STRING(value: string = '', readonly: boolean = false): StringValue {
  return {
    type: 'string',
    readonly,
    value,
  };
}

export function MAKE_NATIVE_METHOD(invokableHandler: FunctionCall, readonly: boolean = false): NativeFunctionValue {
  return {
    type: 'native_function',
    readonly,
    invokableHandler,
  };
}
