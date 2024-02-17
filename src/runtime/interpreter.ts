import Environment from './env';
import { Exception } from '../_internals/errors';
import { MAKE_NULL, NativeFunctionValue, NumberValue, ObjectValue, RuntimeValue } from './values';

import {
  AssignmentExpression,
  BinaryExpression,
  CallExpression,
  DecimalLiteral,
  Identifier,
  IntegerLiteral,
  ObjectLiteral,
  Program,
  Statement,
  VariableDeclaration,
} from '../parsing/ast';


export function evaluate(node: Statement, env: Environment): RuntimeValue {
  switch(node.kind) {
    case 'IntegerLiteral':
      return {
        type: 'number',
        value: (node as IntegerLiteral).value,
      } as NumberValue;
    case 'DecimalLiteral':
      return {
        type: 'number',
        value: (node as DecimalLiteral).value,
      } as NumberValue;
    case 'NullLiteral':
      return MAKE_NULL();
    case 'BinaryExpression':
      return _evalBinaryExpr(node as BinaryExpression, env);
    case 'Identifier':
      return _evalIdent(node as Identifier, env);
    case 'VariableDeclaration':
      return _evalDeclaration(node as VariableDeclaration, env);
    case 'AssignmentExpression':
      return _evalAssignment(node as AssignmentExpression, env);
    case 'ObjectLiteral':
      return _evalObject(node as ObjectLiteral, env);
    case 'CallExpression':
      return _evalCall(node as CallExpression, env);
    case 'Program':
      return _evalProgram(node as Program, env);
    default:
      throw new Exception(`The node '${node.kind}' is not yet implemented in the interpreter`);
  }
}

function _evalBinaryExpr(o: BinaryExpression, env: Environment): RuntimeValue {
  const lhs = evaluate(o.left, env);
  const rhs = evaluate(o.right, env);

  if(lhs.type === 'number' && rhs.type === 'number') return _evalNumericExpr(lhs as NumberValue, rhs as NumberValue, o.operator);
  return MAKE_NULL();
}

function _evalNumericExpr(leftHandSide: NumberValue, rightHandSide: NumberValue, operator: string): RuntimeValue {
  let result: number = 0;

  switch(operator) {
    case '+':
      result = leftHandSide.value + rightHandSide.value;
      break;
    case '-':
      result = leftHandSide.value - rightHandSide.value;
      break;
    case '*':
      result = leftHandSide.value * rightHandSide.value;
      break;
    case '/':
      // TODO: division by zero check
      result = leftHandSide.value / rightHandSide.value;
      break;
    case '%':
      // TODO: division by zero check
      result = leftHandSide.value % rightHandSide.value;
      break;
    case '**':
      result = leftHandSide.value ** rightHandSide.value;
      break;
    default:
      throw new Exception(`Unknown operator: ${operator}`);
  }

  return { type: 'number', value: result } as NumberValue;
}

function _evalProgram(p: Program, env: Environment): RuntimeValue {
  let lo: RuntimeValue = MAKE_NULL();

  for(const statement of p.body) {
    lo = evaluate(statement, env);
  }

  return lo;
}

function _evalIdent(ident: Identifier, env: Environment): RuntimeValue {
  return env.lookup(ident.symbol);
}

function _evalDeclaration(v: VariableDeclaration, env: Environment): RuntimeValue {
  const value = v.value ? evaluate(v.value, env) : MAKE_NULL(v.constant);
  return env.declare(v.varname, value);
}

function _evalAssignment(node: AssignmentExpression, env: Environment): RuntimeValue {
  if(node.target.kind !== 'Identifier') {
    throw new Exception(`The target of an assignment must be an identifier, but got ${node.target.kind}`);
  }

  return env.assign((node.target as Identifier).symbol,
    evaluate(node.value, env));
}

function _evalObject(obj: ObjectLiteral, env: Environment): RuntimeValue {
  const o = {
    type: 'object',
    properties: new Map<string, RuntimeValue>(),
  } as ObjectValue;

  for(const prop of obj.properties) {
    // eslint-disable-next-line no-extra-boolean-cast
    const v = !!prop.value ? 
      evaluate(prop.value, env)
      : env.lookup(prop.key);

    o.properties.set(prop.key, v);
  }
  
  return o;
}

function _evalCall(expr: CallExpression, env: Environment): RuntimeValue {
  const args = expr.arguments.map(arg => evaluate(arg, env));

  if(expr.caller.kind !== 'Identifier') {
    throw new Exception(`The caller of a call expression must be an identifier, but got ${expr.caller.kind}`);
  }

  const f = evaluate(expr.caller, env) as NativeFunctionValue;
  
  if(f.type !== 'native_function') {
    throw new Exception(`Failed to invoke handler \`${(expr.caller as Identifier).symbol}\``);
  }

  return f.invokableHandler(env, ...args);
}


export default evaluate;
