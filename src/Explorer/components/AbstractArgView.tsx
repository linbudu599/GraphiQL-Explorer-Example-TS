import {
  isScalarType,
  isEnumType,
  isInputObjectType,
  parseType,
  VariableDefinitionNode,
  visit,
  DocumentNode,
  OperationDefinitionNode,
  isRequiredArgument,
  GraphQLArgument,
} from "graphql";
import * as React from "react";
import { AbstractArgViewProps } from "../types";
import { unwrapInputType, Checkbox } from "../utils";
import InputArgView from "./InputArgView";
import ScalarInput from "./ScalarInput";

export default class AbstractArgView extends React.PureComponent<
  AbstractArgViewProps,
  { displayArgActions: boolean }
> {
  state = { displayArgActions: false };
  render() {
    const { argValue, arg, styleConfig } = this.props;
    /* TODO: handle List types*/
    const argType = unwrapInputType(arg.type);

    let input = null;
    if (argValue) {
      if (argValue.kind === "Variable") {
        input = (
          <span style={{ color: styleConfig.colors.variable }}>
            ${argValue.name.value}
          </span>
        );
      } else if (isScalarType(argType)) {
        if (argType.name === "Boolean") {
          input = (
            <select
              style={{
                color: styleConfig.colors.builtin,
              }}
              // @ts-ignore
              onChange={this.props.setArgValue}
              // @ts-ignore
              value={
                argValue.kind === "BooleanValue" ? argValue.value : undefined
              }
            >
              <option key="true" value="true">
                true
              </option>
              <option key="false" value="false">
                false
              </option>
            </select>
          );
        } else {
          input = (
            <ScalarInput
              setArgValue={this.props.setArgValue}
              arg={arg}
              argValue={argValue}
              onRunOperation={this.props.onRunOperation}
              styleConfig={this.props.styleConfig}
            />
          );
        }
      } else if (isEnumType(argType)) {
        if (argValue.kind === "EnumValue") {
          input = (
            <select
              style={{
                backgroundColor: "white",
                color: styleConfig.colors.string2,
              }}
              // @ts-ignore
              onChange={this.props.setArgValue}
              value={argValue.value}
            >
              {argType.getValues().map((value) => (
                <option key={value.name} value={value.name}>
                  {value.name}
                </option>
              ))}
            </select>
          );
        } else {
          console.error(
            "arg mismatch between arg and selection",
            argType,
            argValue
          );
        }
      } else if (isInputObjectType(argType)) {
        if (argValue.kind === "ObjectValue") {
          const fields = argType.getFields();
          input = (
            <div style={{ marginLeft: 16 }}>
              {Object.keys(fields)
                .sort()
                .map((fieldName) => (
                  <InputArgView
                    key={fieldName}
                    arg={fields[fieldName] as GraphQLArgument}
                    parentField={this.props.parentField}
                    selection={argValue}
                    modifyFields={this.props.setArgFields}
                    getDefaultScalarArgValue={
                      this.props.getDefaultScalarArgValue
                    }
                    makeDefaultArg={this.props.makeDefaultArg}
                    onRunOperation={this.props.onRunOperation}
                    styleConfig={this.props.styleConfig}
                    onCommit={this.props.onCommit}
                    definition={this.props.definition}
                  />
                ))}
            </div>
          );
        } else {
          console.error(
            "arg mismatch between arg and selection",
            argType,
            argValue
          );
        }
      }
    }

    const variablize = () => {
      /**
      1. Find current operation variables
      2. Find current arg value
      3. Create a new variable
      4. Replace current arg value with variable
      5. Add variable to operation
      */

      const baseVariableName = arg.name;
      const conflictingNameCount = (
        this.props.definition.variableDefinitions || []
      ).filter((varDef) =>
        varDef.variable.name.value.startsWith(baseVariableName)
      ).length;

      let variableName;
      if (conflictingNameCount > 0) {
        variableName = `${baseVariableName}${conflictingNameCount}`;
      } else {
        variableName = baseVariableName;
      }
      // To get an AST definition of our variable from the instantiated arg,
      // we print it to a string, then parseType to get our AST.
      const argPrintedType = arg.type.toString();
      const argType = parseType(argPrintedType);

      const base: VariableDefinitionNode = {
        kind: "VariableDefinition",
        variable: {
          kind: "Variable",
          name: {
            kind: "Name",
            value: variableName,
          },
        },
        type: argType,
        directives: [],
      };

      const variableDefinitionByName = (name: string) =>
        (this.props.definition.variableDefinitions || []).find(
          (varDef) => varDef.variable.name.value === name
        );

      let variable: VariableDefinitionNode | null;

      let subVariableUsageCountByName: {
        [key: string]: number;
      } = {};

      if (typeof argValue !== "undefined" && argValue !== null) {
        /** In the process of devariabilizing descendent selections,
         * we may have caused their variable definitions to become unused.
         * Keep track and remove any variable definitions with 1 or fewer usages.
         * */
        const cleanedDefaultValue = visit(argValue, {
          Variable(node) {
            const varName = node.name.value;
            const varDef = variableDefinitionByName(varName);

            subVariableUsageCountByName[varName] =
              subVariableUsageCountByName[varName] + 1 || 1;

            if (!varDef) {
              return;
            }

            return varDef.defaultValue;
          },
        });

        const isNonNullable = base.type.kind === "NonNullType";

        // We're going to give the variable definition a default value, so we must make its type nullable
        const unwrappedBase = isNonNullable
          ? // @ts-ignore
            { ...base, type: base.type.type }
          : base;

        variable = { ...unwrappedBase, defaultValue: cleanedDefaultValue };
      } else {
        variable = base;
      }

      const newlyUnusedVariables = Object.entries(subVariableUsageCountByName)
        // $FlowFixMe: Can't get Object.entries to realize usageCount *must* be a number
        .filter(([_, usageCount]: [string, number]) => usageCount < 2)
        .map(([varName, _]) => varName);

      if (variable) {
        const newDoc: DocumentNode | null = this.props.setArgValue(
          variable,
          false
        );

        if (newDoc) {
          const targetOperation = newDoc.definitions.find((definition: any) => {
            if (
              !!definition.operation &&
              !!definition.name &&
              !!definition.name.value &&
              //
              !!this.props.definition.name &&
              !!this.props.definition.name.value
            ) {
              return definition.name.value === this.props.definition.name.value;
            } else {
              return false;
            }
          });

          const newVariableDefinitions: Array<VariableDefinitionNode> = [
            // @ts-ignore
            ...(targetOperation.variableDefinitions || []),
            variable,
          ].filter(
            (varDef) =>
              newlyUnusedVariables.indexOf(varDef.variable.name.value) === -1
          );

          const newOperation = {
            ...targetOperation,
            variableDefinitions: newVariableDefinitions,
          };

          const existingDefs = newDoc.definitions;

          const newDefinitions = existingDefs.map((existingOperation) => {
            if (targetOperation === existingOperation) {
              return newOperation;
            } else {
              return existingOperation;
            }
          });

          const finalDoc = {
            ...newDoc,
            definitions: newDefinitions,
          };

          this.props.onCommit(finalDoc as any);
        }
      }
    };

    const devariablize = () => {
      /**
       * 1. Find the current variable definition in the operation def
       * 2. Extract its value
       * 3. Replace the current arg value
       * 4. Visit the resulting operation to see if there are any other usages of the variable
       * 5. If not, remove the variableDefinition
       */
      // @ts-ignore
      if (!argValue || !argValue.name || !argValue.name.value) {
        return;
      }

      // @ts-ignore
      const variableName = argValue.name.value;
      const variableDefinition = (
        this.props.definition.variableDefinitions || []
      ).find((varDef) => varDef.variable.name.value === variableName);

      if (!variableDefinition) {
        return;
      }

      const defaultValue = variableDefinition.defaultValue;
      // @ts-ignore
      const newDoc: DocumentNode | null = this.props.setArgValue(defaultValue, {
        commit: false,
      });

      if (newDoc) {
        // @ts-ignore
        const targetOperation: OperationDefinitionNode | null =
          newDoc.definitions.find(
            (definition: any) =>
              // @ts-ignore
              definition.name.value === this.props.definition.name.value
          );

        if (!targetOperation) {
          return;
        }

        // After de-variabilizing, see if the variable is still in use. If not, remove it.
        let variableUseCount = 0;

        visit(targetOperation, {
          Variable(node) {
            if (node.name.value === variableName) {
              variableUseCount = variableUseCount + 1;
            }
          },
        });

        let newVariableDefinitions = targetOperation.variableDefinitions || [];

        // A variable is in use if it shows up at least twice (once in the definition, once in the selection)
        if (variableUseCount < 2) {
          newVariableDefinitions = newVariableDefinitions.filter(
            (varDef) => varDef.variable.name.value !== variableName
          );
        }

        const newOperation = {
          ...targetOperation,
          variableDefinitions: newVariableDefinitions,
        };

        const existingDefs = newDoc.definitions;

        const newDefinitions = existingDefs.map((existingOperation) => {
          if (targetOperation === existingOperation) {
            return newOperation;
          } else {
            return existingOperation;
          }
        });

        const finalDoc = {
          ...newDoc,
          definitions: newDefinitions,
        };

        this.props.onCommit(finalDoc);
      }
    };

    const isArgValueVariable = argValue && argValue.kind === "Variable";

    const variablizeActionButton = !this.state.displayArgActions ? null : (
      <button
        type="submit"
        className="toolbar-button"
        title={
          isArgValueVariable
            ? "Remove the variable"
            : "Extract the current value into a GraphQL variable"
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();

          if (isArgValueVariable) {
            devariablize();
          } else {
            variablize();
          }
        }}
        style={styleConfig.styles.actionButtonStyle}
      >
        <span style={{ color: styleConfig.colors.variable }}>{"$"}</span>
      </button>
    );

    return (
      <div
        style={{
          cursor: "pointer",
          minHeight: "16px",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        data-arg-name={arg.name}
        data-arg-type={argType.name}
        className={`graphiql-explorer-${arg.name}`}
      >
        <span
          style={{ cursor: "pointer" }}
          onClick={(event) => {
            const shouldAdd = !argValue;
            if (shouldAdd) {
              this.props.addArg(true);
            } else {
              this.props.removeArg(true);
            }
            this.setState({ displayArgActions: shouldAdd });
          }}
        >
          {isInputObjectType(argType) ? (
            <span>
              {!!argValue
                ? this.props.styleConfig.arrowOpen
                : this.props.styleConfig.arrowClosed}
            </span>
          ) : (
            <Checkbox
              checked={!!argValue}
              styleConfig={this.props.styleConfig}
            />
          )}
          <span
            style={{ color: styleConfig.colors.attribute }}
            title={arg.description!}
            onMouseEnter={() => {
              // Make implementation a bit easier and only show 'variablize' action if arg is already added
              if (argValue !== null && typeof argValue !== "undefined") {
                this.setState({ displayArgActions: true });
              }
            }}
            onMouseLeave={() => this.setState({ displayArgActions: false })}
          >
            {arg.name}
            {isRequiredArgument(arg) ? "*" : ""}: {variablizeActionButton}{" "}
          </span>{" "}
        </span>
        {input || <span />}{" "}
      </div>
    );
  }
}
