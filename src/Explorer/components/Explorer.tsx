// @ts-nocheck
import {
  DocumentNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  DefinitionNode,
  GraphQLObjectType,
} from "graphql";
import React, { Props } from "react";
import {
  defaultColors,
  defaultCheckboxChecked,
  defaultCheckboxUnchecked,
  defaultArrowClosed,
  defaultArrowOpen,
  defaultStyles,
  DEFAULT_DOCUMENT,
  capitalize,
  Attribution,
} from "../constants";
import { State, NewOperationType, AvailableFragments } from "../types";
import {
  defaultGetDefaultFieldNames,
  defaultGetDefaultScalarArgValue,
  memoizeParseQuery,
} from "../utils";
import RootView from "./RootView";

export default class Explorer extends React.PureComponent<Props<any>, State> {
  static defaultProps = {
    getDefaultFieldNames: defaultGetDefaultFieldNames,
    getDefaultScalarArgValue: defaultGetDefaultScalarArgValue,
  };

  state: any = {
    newOperationType: "query",
    operation: null,
    operationToScrollTo: null,
  };

  _ref?: any;
  _resetScroll = () => {
    const container = this._ref;
    if (container) {
      container.scrollLeft = 0;
    }
  };
  componentDidMount() {
    this._resetScroll();
  }

  _onEdit = (query: string): void => this.props.onEdit(query);

  _setAddOperationType = (value: NewOperationType) => {
    this.setState({ newOperationType: value });
  };

  _handleRootViewMount = (rootViewElId: string) => {
    if (
      !!this.state.operationToScrollTo &&
      this.state.operationToScrollTo === rootViewElId
    ) {
      var selector = `.graphiql-explorer-root #${rootViewElId}`;

      var el = document.querySelector(selector);
      el && el.scrollIntoView();
    }
  };

  render() {
    const { schema, query, makeDefaultArg } = this.props;

    if (!schema) {
      return (
        <div style={{ fontFamily: "sans-serif" }} className="error-container">
          No Schema Available
        </div>
      );
    }
    const styleConfig = {
      colors: this.props.colors || defaultColors,
      checkboxChecked: this.props.checkboxChecked || defaultCheckboxChecked,
      checkboxUnchecked:
        this.props.checkboxUnchecked || defaultCheckboxUnchecked,
      arrowClosed: this.props.arrowClosed || defaultArrowClosed,
      arrowOpen: this.props.arrowOpen || defaultArrowOpen,
      styles: this.props.styles
        ? {
            ...defaultStyles,
            ...this.props.styles,
          }
        : defaultStyles,
    };
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType();
    if (!queryType && !mutationType && !subscriptionType) {
      return <div>Missing query type</div>;
    }
    const queryFields = queryType && queryType.getFields();
    const mutationFields = mutationType && mutationType.getFields();
    const subscriptionFields = subscriptionType && subscriptionType.getFields();

    const parsedQuery: DocumentNode = memoizeParseQuery(query);
    const getDefaultFieldNames =
      this.props.getDefaultFieldNames || defaultGetDefaultFieldNames;
    const getDefaultScalarArgValue =
      this.props.getDefaultScalarArgValue || defaultGetDefaultScalarArgValue;

    const definitions = parsedQuery.definitions;

    const _relevantOperations = definitions
      .map((definition) => {
        if (definition.kind === "FragmentDefinition") {
          return definition;
        } else if (definition.kind === "OperationDefinition") {
          return definition;
        } else {
          return null;
        }
      })
      .filter(Boolean);

    const relevantOperations =
      // If we don't have any relevant definitions from the parsed document,
      // then at least show an expanded Query selection
      _relevantOperations.length === 0
        ? DEFAULT_DOCUMENT.definitions
        : _relevantOperations;

    const renameOperation = (targetOperation, name) => {
      const newName =
        name == null || name === ""
          ? null
          : { kind: "Name", value: name, loc: undefined };
      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.map((existingOperation) => {
        if (targetOperation === existingOperation) {
          return newOperation;
        } else {
          return existingOperation;
        }
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const cloneOperation = (
      targetOperation: OperationDefinitionNode | FragmentDefinitionNode
    ) => {
      let kind;
      if (targetOperation.kind === "FragmentDefinition") {
        kind = "fragment";
      } else {
        kind = targetOperation.operation;
      }

      const newOperationName =
        ((targetOperation.name && targetOperation.name.value) || "") + "Copy";

      const newName = {
        kind: "Name",
        value: newOperationName,
        loc: undefined,
      };

      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = [...existingDefs, newOperation];

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const destroyOperation = (targetOperation) => {
      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.filter((existingOperation) => {
        if (targetOperation === existingOperation) {
          return false;
        } else {
          return true;
        }
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const addOperation = (kind: NewOperationType) => {
      const existingDefs = parsedQuery.definitions;

      const viewingDefaultOperation =
        parsedQuery.definitions.length === 1 &&
        parsedQuery.definitions[0] === DEFAULT_DOCUMENT.definitions[0];

      const MySiblingDefs = viewingDefaultOperation
        ? []
        : existingDefs.filter((def) => {
            if (def.kind === "OperationDefinition") {
              return def.operation === kind;
            } else {
              // Don't support adding fragments from explorer
              return false;
            }
          });

      const newOperationName = `My${capitalize(kind)}${
        MySiblingDefs.length === 0 ? "" : MySiblingDefs.length + 1
      }`;

      // Add this as the default field as it guarantees a valid selectionSet
      const firstFieldName = "__typename # Placeholder value";

      const selectionSet = {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: {
              kind: "Name",
              value: firstFieldName,
              loc: null,
            },
            arguments: [],
            directives: [],
            selectionSet: null,
            loc: null,
          },
        ],
        loc: null,
      };

      const newDefinition = {
        kind: "OperationDefinition",
        operation: kind,
        name: { kind: "Name", value: newOperationName },
        variableDefinitions: [],
        directives: [],
        selectionSet: selectionSet,
        loc: null,
      };

      const newDefinitions =
        // If we only have our default operation in the document right now, then
        // just replace it with our new definition
        viewingDefaultOperation
          ? [newDefinition]
          : [...parsedQuery.definitions, newDefinition];

      const newOperationDef = {
        ...parsedQuery,
        definitions: newDefinitions,
      };

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      this.props.onEdit(print(newOperationDef));
    };

    const actionsOptions = [
      // !!queryFields ? (
      //   <option
      //     key="query"
      //     className={"toolbar-button"}
      //     style={styleConfig.styles.buttonStyle}
      //     type="link"
      //     value={("query": NewOperationType)}
      //   >
      //     Query
      //   </option>
      // ) : null,
      // !!mutationFields ? (
      //   <option
      //     key="mutation"
      //     className={"toolbar-button"}
      //     style={styleConfig.styles.buttonStyle}
      //     type="link"
      //     value={("mutation": NewOperationType)}
      //   >
      //     Mutation
      //   </option>
      // ) : null,
      // !!subscriptionFields ? (
      //   <option
      //     key="subscription"
      //     className={"toolbar-button"}
      //     style={styleConfig.styles.buttonStyle}
      //     type="link"
      //     value={("subscription": NewOperationType)}
      //   >
      //     Subscription
      //   </option>
      // ) : null,
    ].filter(Boolean);

    const actionsEl =
      actionsOptions.length === 0 ? null : (
        <div
          style={{
            minHeight: "50px",
            maxHeight: "50px",
            overflow: "none",
          }}
        >
          <form
            className="variable-editor-title graphiql-explorer-actions"
            style={{
              ...styleConfig.styles.explorerActionsStyle,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              borderTop: "1px solid rgb(214, 214, 214)",
            }}
            onSubmit={(event) => event.preventDefault()}
          >
            <span
              style={{
                display: "inline-block",
                flexGrow: "0",
                textAlign: "right",
              }}
            >
              Add new{" "}
            </span>
            <select
              onChange={(event) =>
                this._setAddOperationType(event.target.value)
              }
              value={this.state.newOperationType}
              style={{ flexGrow: "2" }}
            >
              {actionsOptions}
            </select>
            <button
              type="submit"
              className="toolbar-button"
              onClick={() =>
                this.state.newOperationType
                  ? addOperation(this.state.newOperationType)
                  : null
              }
              style={{
                ...styleConfig.styles.buttonStyle,
                height: "22px",
                width: "22px",
              }}
            >
              <span>+</span>
            </button>
          </form>
        </div>
      );

    const availableFragments: AvailableFragments = relevantOperations.reduce(
      (acc, operation) => {
        if (operation.kind === "FragmentDefinition") {
          const fragmentTypeName = operation.typeCondition.name.value;
          const existingFragmentsForType = acc[fragmentTypeName] || [];
          const newFragmentsForType = [
            ...existingFragmentsForType,
            operation,
          ].sort((a, b) => a.name.value.localeCompare(b.name.value));
          return {
            ...acc,
            [fragmentTypeName]: newFragmentsForType,
          };
        }

        return acc;
      },
      {}
    );

    const attribution = this.props.showAttribution ? <Attribution /> : null;

    return (
      <div
        ref={(ref) => {
          this._ref = ref;
        }}
        style={{
          fontSize: 12,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
          padding: 8,
          fontFamily:
            'Consolas, Inconsolata, "Droid Sans Mono", Monaco, monospace',
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
        className="graphiql-explorer-root"
      >
        <div
          style={{
            flexGrow: "1",
            overflow: "scroll",
          }}
        >
          {relevantOperations.map(
            (
              operation: OperationDefinitionNode | FragmentDefinitionNode,
              index
            ) => {
              const operationName =
                operation && operation.name && operation.name.value;

              const operationType =
                operation.kind === "FragmentDefinition"
                  ? "fragment"
                  : (operation && operation.operation) || "query";

              const onOperationRename = (newName) => {
                const newOperationDef = renameOperation(operation, newName);
                this.props.onEdit(print(newOperationDef));
              };

              const onOperationClone = () => {
                const newOperationDef = cloneOperation(operation);
                this.props.onEdit(print(newOperationDef));
              };

              const onOperationDestroy = () => {
                const newOperationDef = destroyOperation(operation);
                this.props.onEdit(print(newOperationDef));
              };

              const fragmentType =
                operation.kind === "FragmentDefinition" &&
                operation.typeCondition.kind === "NamedType" &&
                schema.getType(operation.typeCondition.name.value);

              const fragmentFields =
                fragmentType instanceof GraphQLObjectType
                  ? fragmentType.getFields()
                  : null;

              const fields =
                operationType === "query"
                  ? queryFields
                  : operationType === "mutation"
                  ? mutationFields
                  : operationType === "subscription"
                  ? subscriptionFields
                  : operation.kind === "FragmentDefinition"
                  ? fragmentFields
                  : null;

              const fragmentTypeName =
                operation.kind === "FragmentDefinition"
                  ? operation.typeCondition.name.value
                  : null;

              const onCommit = (parsedDocument: DocumentNode) => {
                const textualNewDocument = print(parsedDocument);

                this.props.onEdit(textualNewDocument);
              };

              return (
                <RootView
                  key={index}
                  isLast={index === relevantOperations.length - 1}
                  fields={fields}
                  operationType={operationType}
                  name={operationName}
                  definition={operation}
                  onOperationRename={onOperationRename}
                  onOperationDestroy={onOperationDestroy}
                  onOperationClone={onOperationClone}
                  onTypeName={fragmentTypeName}
                  onMount={this._handleRootViewMount}
                  onCommit={onCommit}
                  onEdit={(
                    newDefinition?: DefinitionNode,
                    options?: { commit: boolean }
                  ): DocumentNode => {
                    let commit;
                    if (
                      typeof options === "object" &&
                      typeof options.commit !== "undefined"
                    ) {
                      commit = options.commit;
                    } else {
                      commit = true;
                    }

                    if (!!newDefinition) {
                      const newQuery: DocumentNode = {
                        ...parsedQuery,
                        definitions: parsedQuery.definitions.map(
                          (existingDefinition) =>
                            existingDefinition === operation
                              ? newDefinition
                              : existingDefinition
                        ),
                      };

                      if (commit) {
                        onCommit(newQuery);
                        return newQuery;
                      } else {
                        return newQuery;
                      }
                    } else {
                      return parsedQuery;
                    }
                  }}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={getDefaultScalarArgValue}
                  makeDefaultArg={makeDefaultArg}
                  onRunOperation={() => {
                    if (!!this.props.onRunOperation) {
                      this.props.onRunOperation(operationName);
                    }
                  }}
                  styleConfig={styleConfig}
                  availableFragments={availableFragments}
                />
              );
            }
          )}
          {attribution}
        </div>

        {actionsEl}
      </div>
    );
  }
}
