export type NodeType = 
  | 'Program'
  | 'IntegerLiteral'
  | 'DecimalLiteral'
  | 'BinaryExpression'
  | 'Identifier'
  | 'Symbol'
  | 'CallExpression'
  | 'UnaryExpression'
  | 'FunctionDeclaration'
  | 'NullLiteral'
  | 'VariableDeclaration';


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
