import { GraphQLObjectType, isLeafType, GraphQLArgument, GraphQLOutputType, isWrappingType, GraphQLInputType, GraphQLScalarType, GraphQLEnumType, VariableDefinitionNode, ValueNode, isScalarType, isNonNullType, GraphQLInputField, isEnumType, ArgumentNode, isInputObjectType, isRequiredInputField, ObjectFieldNode, DocumentNode, parse } from "graphql";
import { DEFAULT_DOCUMENT } from "./constants";
import { Field, GetDefaultScalarArgValue, MakeDefaultArg, StyleConfig } from "./types";

export function Checkbox(props: { checked: boolean, styleConfig: StyleConfig }) {
  return props.checked
    ? props.styleConfig.checkboxChecked
    : props.styleConfig.checkboxUnchecked;
}

export function defaultValue(
  argType: GraphQLEnumType | GraphQLScalarType
): ValueNode {
  if (isEnumType(argType)) {
    return { kind: "EnumValue", value: argType.getValues()[0].name };
  } else {
    switch (argType.name) {
      case "String":
        return { kind: "StringValue", value: "" };
      case "Float":
        return { kind: "FloatValue", value: "1.5" };
      case "Int":
        return { kind: "IntValue", value: "10" };
      case "Boolean":
        return { kind: "BooleanValue", value: false };
      default:
        return { kind: "StringValue", value: "" };
    }
  }
}

// ctrl + enter，快速执行
export function isRunShortcut(event: React.KeyboardEvent<HTMLInputElement>) {
  return event.ctrlKey && event.key === "Enter";
}

// 除片段以外，均是可执行的
export function canRunOperation(operationName: string) {
  // it does not make sense to try to execute a fragment
  return operationName !== "FragmentDefinition";
}

export function defaultInputObjectFields(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg,
  parentField: Field,
  fields: Array<GraphQLInputField>
): Array<ObjectFieldNode> {
  const nodes: ObjectFieldNode[] = [];
  for (const field of fields) {
    if (
      isRequiredInputField(field) ||
      (makeDefaultArg && makeDefaultArg(parentField, field))
    ) {
      const fieldType = unwrapInputType(field.type);
      if (isInputObjectType(fieldType)) {
        const fields = fieldType.getFields();
        nodes.push({
          kind: "ObjectField",
          name: { kind: "Name", value: field.name },
          value: {
            kind: "ObjectValue",
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              parentField,
              Object.keys(fields).map((k) => fields[k])
            ),
          },
        });
      } else if (isLeafType(fieldType)) {
        nodes.push({
          kind: "ObjectField",
          name: { kind: "Name", value: field.name },
          value: getDefaultScalarArgValue(parentField, field, fieldType),
        });
      }
    }
  }
  return nodes;
}

export function defaultArgs(
  getDefaultScalarArgValue: GetDefaultScalarArgValue,
  makeDefaultArg: MakeDefaultArg,
  field: Field
): Array<ArgumentNode> {
  const args: ArgumentNode[] = [];
  for (const arg of field.args) {
    if (
      isRequiredArgument(arg) ||
      (makeDefaultArg && makeDefaultArg(field, arg))
    ) {
      const argType = unwrapInputType(arg.type);
      if (isInputObjectType(argType)) {
        const fields = argType.getFields();
        args.push({
          kind: "Argument",
          name: { kind: "Name", value: arg.name },
          value: {
            kind: "ObjectValue",
            fields: defaultInputObjectFields(
              getDefaultScalarArgValue,
              makeDefaultArg,
              field,
              Object.keys(fields).map((k) => fields[k])
            ),
          },
        });
      } else if (isLeafType(argType)) {
        args.push({
          kind: "Argument",
          name: { kind: "Name", value: arg.name },
          value: getDefaultScalarArgValue(field, arg, argType),
        });
      }
    }
  }
  return args;
}

export function parseQuery(text: string): DocumentNode | Error | null {
  try {
    if (!text.trim()) {
      return null;
    }
    return parse(
      text,
      // Tell graphql to not bother track locations when parsing, we don't need
      // it and it's a tiny bit more expensive.
      { noLocation: true }
    );
  } catch (e) {
    return new Error(e);
  }
}

let parseQueryMemoize: [string, DocumentNode] | null = null;

export function memoizeParseQuery(query: string): DocumentNode {
  if (parseQueryMemoize && parseQueryMemoize[0] === query) {
    return parseQueryMemoize[1];
  } else {
    const result = parseQuery(query);
    if (!result) {
      return DEFAULT_DOCUMENT as DocumentNode;
    } else if (result instanceof Error) {
      if (parseQueryMemoize) {
        // Most likely a temporarily invalid query while they type
        return parseQueryMemoize[1];
      } else {
        return DEFAULT_DOCUMENT as DocumentNode;
      }
    } else {
      parseQueryMemoize = [query, result];
      return result;
    }
  }
}

export function defaultGetDefaultScalarArgValue(
  parentField: Field,
  arg: GraphQLArgument | GraphQLInputField,
  argType: GraphQLEnumType | GraphQLScalarType
): ValueNode {
  return defaultValue(argType);
}

export function defaultGetDefaultFieldNames(type: GraphQLObjectType): Array<string> {
  const fields = type.getFields();

  // Is there an `id` field?
  if (fields["id"]) {
    const res = ["id"];
    if (fields["email"]) {
      res.push("email");
    } else if (fields["name"]) {
      res.push("name");
    }
    return res;
  }

  // Is there an `edges` field?
  if (fields["edges"]) {
    return ["edges"];
  }

  // Is there an `node` field?
  if (fields["node"]) {
    return ["node"];
  }

  if (fields["nodes"]) {
    return ["nodes"];
  }

  // Include all leaf-type fields.
  const leafFieldNames: string[] = [];
  Object.keys(fields).forEach((fieldName) => {
    if (isLeafType(fields[fieldName].type)) {
      leafFieldNames.push(fieldName);
    }
  });

  if (!leafFieldNames.length) {
    // No leaf fields, add typename so that the query stays valid
    return ["__typename"];
  }
  return leafFieldNames.slice(0, 2); // Prevent too many fields from being added
}

export function isRequiredArgument(arg: GraphQLArgument): boolean {
  return isNonNullType(arg.type) && arg.defaultValue === undefined;
}

export function unwrapOutputType(outputType: GraphQLOutputType): any {
  let unwrappedType = outputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

export function unwrapInputType(inputType: GraphQLInputType): any {
  let unwrappedType = inputType;
  while (isWrappingType(unwrappedType)) {
    unwrappedType = unwrappedType.ofType;
  }
  return unwrappedType;
}

export function coerceArgValue(
  argType: GraphQLScalarType | GraphQLEnumType,
  value: string | VariableDefinitionNode
): ValueNode {
  // Handle the case where we're setting a variable as the value
  if (typeof value !== "string" && value.kind === "VariableDefinition") {
    return value.variable;
  } else if (isScalarType(argType)) {
    try {
      switch (argType.name) {
        case "String":
          return {
            kind: "StringValue",
            value: String(argType.parseValue(value)),
          };
        // GQL中，数字也使用字符串表示
        case "Float":
          return {
            kind: "FloatValue",
            value: String(argType.parseValue(parseFloat(value as string))),
          };
        case "Int":
          return {
            kind: "IntValue",
            value: String(argType.parseValue(parseInt(value as string, 10))),
          };
        case "Boolean":
          try {
            const parsed = JSON.parse(value as string);
            if (typeof parsed === "boolean") {
              return { kind: "BooleanValue", value: parsed };
            } else {
              return { kind: "BooleanValue", value: false };
            }
          } catch (e) {
            return {
              kind: "BooleanValue",
              value: false,
            };
          }
        default:
          return {
            kind: "StringValue",
            value: String(argType.parseValue(value)),
          };
      }
    } catch (e) {
      console.error("error coercing arg value", e, value);
      return { kind: "StringValue", value: value as string };
    }
  } else {
    try {
      const parsedValue = argType.parseValue(value);
      if (parsedValue) {
        return { kind: "EnumValue", value: String(parsedValue) };
      } else {
        return { kind: "EnumValue", value: argType.getValues()[0].name };
      }
    } catch (e) {
      return { kind: "EnumValue", value: argType.getValues()[0].name };
    }
  }
}
