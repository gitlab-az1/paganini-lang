export type NodeType = 
  | 'Program'
  | 'IntegerLiteral'
  | 'DecimalLiteral'
  | 'BinaryExpression'
  | 'StringLiteral'
  | 'Identifier'
  | 'Symbol'
  | 'CallExpression'
  | 'UnaryExpression'
  | 'FunctionDeclaration'
  | 'NullLiteral'
  | 'VariableDeclaration'
  | 'AssignmentExpression'
  | 'Property'
  | 'ObjectLiteral'
  | 'MemberExpression'
  | 'CallExpression';


export interface Statement {
  kind: NodeType;
}

export interface Program extends Statement {
  kind: 'Program';
  body: Statement[];
}

export interface Expression extends Statement {}

export interface BinaryExpression extends Expression {
  kind: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface Identifier extends Expression {
  kind: 'Identifier';
  symbol: string;
}

export interface Symbol extends Expression {
  kind: 'Symbol';
  symbol: string;
}

export interface IntegerLiteral extends Expression {
  kind: 'IntegerLiteral';
  value: number;
}

export interface DecimalLiteral extends Expression {
  kind: 'DecimalLiteral';
  value: number;
}

export interface NullLiteral extends Expression {
  kind: 'NullLiteral';
  value: 'null';
}

export interface VariableDeclaration extends Statement {
  kind: 'VariableDeclaration';
  constant: boolean;
  varname: string;
  value?: Expression;
}

export interface StringLiteral extends Expression {
  kind: 'StringLiteral';
  value: string;
}

export interface AssignmentExpression extends Expression {
  kind: 'AssignmentExpression';
  target: Expression;
  value: Expression;
}

export interface Property extends Expression {
  kind: 'Property';
  key: string;
  value?: Expression;
}

export interface ObjectLiteral extends Expression {
  kind: 'ObjectLiteral';
  properties: Property[];
}

export interface CallExpression extends Expression {
  kind: 'CallExpression';
  arguments: Expression[];
  caller: Expression;
}

export interface MemberExpression extends Expression {
  kind: 'MemberExpression';
  object: Expression;
  property: Expression;
  computed: boolean;
}
