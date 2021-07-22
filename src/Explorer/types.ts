import * as React from "react";
import type {
  ArgumentNode,
  DefinitionNode,
  DocumentNode,
  FieldNode,
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLField,
  GraphQLFieldMap,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  InlineFragmentNode,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  ObjectFieldNode,
  ObjectValueNode,
  SelectionNode,
  SelectionSetNode,
  VariableDefinitionNode,
  ValueNode,
  GraphQLObjectType,
} from "graphql";

export type Field = GraphQLField<any, any>;

export type GetDefaultScalarArgValue = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  underlyingArgType: GraphQLEnumType | GraphQLScalarType
) => ValueNode;

export type MakeDefaultArg = (
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField
) => boolean;

export type Colors = {
  keyword: string,
  def: string,
  property: string,
  qualifier: string,
  attribute: string,
  number: string,
  string: string,
  builtin: string,
  string2: string,
  variable: string,
  atom: string,
};

export type StyleMap = {
  [key: string]: unknown;
};

export type Styles = {
  explorerActionsStyle: StyleMap,
  buttonStyle: StyleMap,
  actionButtonStyle: StyleMap,
};

export type StyleConfig = {
  colors: Colors,
  arrowOpen: JSX.Element,
  arrowClosed: JSX.Element,
  checkboxChecked: JSX.Element,
  checkboxUnchecked: JSX.Element,
  styles: Styles,
};

export type Props = {
  query: string,
  width?: number,
  title?: string,
  schema?: GraphQLSchema,
  onEdit: (arg: string) => void,
  getDefaultFieldNames?: (type: GraphQLObjectType) => Array<string>,
  getDefaultScalarArgValue?: GetDefaultScalarArgValue,
  makeDefaultArg?: MakeDefaultArg,
  onToggleExplorer: () => void,
  explorerIsOpen: boolean,
  onRunOperation?: (name: string) => void,
  colors?: Colors,
  arrowOpen?: JSX.Element,
  arrowClosed?: JSX.Element,
  checkboxChecked?: JSX.Element,
  checkboxUnchecked?: JSX.Element,
  styles?: {
    explorerActionsStyle?: StyleMap,
    buttonStyle?: StyleMap,
    actionButtonStyle?: StyleMap,
  },
  showAttribution: boolean,
};

export type OperationType = "query" | "mutation" | "subscription" | "fragment";
export type NewOperationType = "query" | "mutation" | "subscription";

export type ExplorerState = {
  operation: OperationDefinitionNode | null,
  newOperationType: NewOperationType | null,
  operationToScrollTo: string | null,
};

export type ExplorerProps = {
  query: string,
  width?: number,
  title?: string,
  schema?: GraphQLSchema,
  onEdit: (txt: string) => void,
  getDefaultFieldNames?: (type: GraphQLObjectType) => Array<string>,
  getDefaultScalarArgValue?: GetDefaultScalarArgValue,
  makeDefaultArg?: MakeDefaultArg,
  onToggleExplorer: () => void,
  explorerIsOpen: boolean,
  onRunOperation?: (name: string) => void,
  colors?: Colors,
  arrowOpen?: JSX.Element,
  arrowClosed?: JSX.Element,
  checkboxChecked?: JSX.Element,
  checkboxUnchecked?: JSX.Element,
  styles?: {
    explorerActionsStyle?: StyleMap,
    buttonStyle?: StyleMap,
    actionButtonStyle?: StyleMap,
  },
  showAttribution?: boolean,
}

export type Selections = ReadOnlyArray<SelectionNode>;

export type AvailableFragments = { [key: string]: FragmentDefinitionNode };



export type InputArgViewProps = {
  arg: GraphQLArgument,
  selection: ObjectValueNode,
  parentField: Field,
  modifyFields: (
    fields: ObjectFieldNode[],
    commit?: boolean
  ) => DocumentNode | null,
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg,
  onRunOperation: () => void,
  styleConfig: StyleConfig,
  onCommit: (newDoc: DocumentNode) => void,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
};


export type ArgViewProps = {
  parentField: Field,
  arg: GraphQLArgument,
  selection: FieldNode,
  modifyArguments: (
    argumentNodes: Array<ArgumentNode>,
    options?: { commit: boolean }
  ) => DocumentNode | null | undefined | void,
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg,
  onRunOperation: () => void,
  styleConfig: StyleConfig,
  onCommit: (newDoc: DocumentNode) => void,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
};

export type ArgViewState = {};

// Tool Types

export type ReadOnlyArray<T extends any> = Readonly<T>


export type ScalarInputProps = {
  arg: GraphQLArgument,
  argValue: ValueNode,
  setArgValue: (
    event: React.SyntheticEvent<any> | VariableDefinitionNode,
    commit: boolean
  ) => DocumentNode | null;
  onRunOperation: () => void,
  styleConfig: StyleConfig,
};


export type AbstractArgViewProps = {
  argValue?: ValueNode | null,
  arg: GraphQLArgument,
  parentField: Field,
  setArgValue: (
    event: React.ChangeEvent<any> | VariableDefinitionNode,
    options?: { commit: boolean }
  ) => DocumentNode | null | undefined;
  setArgFields: (
    fields: ObjectFieldNode[],
    commit: boolean
  ) => DocumentNode | null,
  addArg: (commit: boolean) => DocumentNode | null,
  removeArg: (commit: boolean) => DocumentNode | null,
  onCommit: (newDoc: DocumentNode) => void,
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg,
  onRunOperation: () => void,
  styleConfig: StyleConfig,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
};

export type FragmentViewProps = {
  fragment: FragmentDefinitionNode,
  selections: SelectionNode[],
  modifySelections: (
    selections: SelectionNode[],
    options?: { commit: boolean }
  ) => DocumentNode | null | undefined | void,
  onCommit: (newDoc: DocumentNode) => void,
  schema: GraphQLSchema,
  styleConfig: StyleConfig,
};

export type FieldViewProps = {
  field: Field,
  selections: readonly SelectionNode[],
  modifySelections: (
    selections: SelectionNode[],
    options?: { commit: boolean }
  ) => DocumentNode | null | undefined | void,
  schema: GraphQLSchema,
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>,
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg?: MakeDefaultArg,
  onRunOperation: () => void,
  styleConfig: StyleConfig,
  onCommit: (newDoc: DocumentNode) => void,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
  availableFragments: AvailableFragments,
};

export type RootViewProps = {
  schema: GraphQLSchema,
  isLast: boolean,
  fields: GraphQLFieldMap<any, any> | null | undefined,
  operationType: OperationType,
  name?: string,
  onTypeName?: string | null,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
  onEdit: (
    operationDef: OperationDefinitionNode | FragmentDefinitionNode,
    options?: { commit: boolean }
  ) => DocumentNode,
  onCommit: (document: DocumentNode) => void,
  onOperationRename: (query: string) => void,
  onOperationDestroy: () => void,
  onOperationClone: () => void,
  onRunOperation: (name?: string) => void,
  onMount: (rootViewElId: string) => void,
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>,
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg?: MakeDefaultArg,
  styleConfig: StyleConfig,
  availableFragments: AvailableFragments,
};

export type AbstractViewProps = {
  implementingType: GraphQLObjectType,
  selections: SelectionNode[],
  modifySelections: (
    selections: SelectionNode[],
    tmp?: { commit: boolean },
  ) => DocumentNode | null,
  schema: GraphQLSchema,
  getDefaultFieldNames: (type: GraphQLObjectType) => Array<string>,
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg?: MakeDefaultArg,
  onRunOperation: () => void,
  onCommit: (newDoc: DocumentNode) => void,
  styleConfig: StyleConfig,
  definition: FragmentDefinitionNode | OperationDefinitionNode,
};
