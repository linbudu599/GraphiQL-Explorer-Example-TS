import React from "react";
import {
  DocumentNode,
  OperationDefinitionNode,
  FragmentDefinitionNode,
  DefinitionNode,
  print,
  GraphQLObjectType,
  ASTNode,
  OperationTypeNode,
} from "graphql";
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
import {
  ExplorerProps,
  ExplorerState,
  NewOperationType,
  AvailableFragments,
} from "../types";
import {
  defaultGetDefaultFieldNames,
  defaultGetDefaultScalarArgValue,
  memoizeParseQuery,
} from "../utils";
import RootView from "./RootView";
import {
  checkCommit,
  EXPLORER_ROOT_STYLES,
  generateActionElements,
  generateActionOptions,
  getAvailableFragments,
} from "./refactor/Explorer";

export default class Explorer extends React.PureComponent<
  ExplorerProps,
  ExplorerState
> {
  static defaultProps = {
    getDefaultFieldNames: defaultGetDefaultFieldNames,
    getDefaultScalarArgValue: defaultGetDefaultScalarArgValue,
  };

  state: ExplorerState = {
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

  _onEdit = (query: string): void => {
    console.log("_onEdit: ");
    this.props.onEdit(query);
  };

  _setAddOperationType = (value: NewOperationType) => {
    this.setState({ newOperationType: value });
  };

  _handleRootViewMount = (rootViewElId: string) => {
    if (
      !!this.state.operationToScrollTo &&
      this.state.operationToScrollTo === rootViewElId
    ) {
      const selector = `.graphiql-explorer-root #${rootViewElId}`;
      const el = document.querySelector(selector);

      el && el.scrollIntoView();
    }
  };

  render() {
    // GraphQL Schema、初始 query、默认参数的处理逻辑
    const { schema, query, makeDefaultArg } = this.props;

    if (!schema) {
      return (
        <div style={{ fontFamily: "sans-serif" }} className="error-container">
          [GraphiQL-Explorer]No Schema Available
        </div>
      );
    }

    // TODO: 类型定义
    const styleConfig = {
      // 各部分默认颜色
      colors: this.props.colors || defaultColors,
      // 字段勾选组件
      checkboxChecked: this.props.checkboxChecked || defaultCheckboxChecked,
      // 字段未勾选组件
      checkboxUnchecked:
        this.props.checkboxUnchecked || defaultCheckboxUnchecked,
      // 关闭箭头组件
      arrowClosed: this.props.arrowClosed || defaultArrowClosed,
      // 开启箭头组件
      arrowOpen: this.props.arrowOpen || defaultArrowOpen,
      styles: this.props.styles
        ? {
            ...defaultStyles,
            ...this.props.styles,
          }
        : defaultStyles,
    };

    // astNode: undefined
    // description: null
    // extensionASTNodes: undefined
    // extensions: undefined
    // isTypeOf: undefined
    // name: "Query"
    // _fields: { me: { … }, airtable: { … }, apollo: { … }, asana: { … }, box: { … }, … }
    // _interfaces: []
    const queryType = schema.getQueryType();
    console.log("queryType: ", queryType);
    const mutationType = schema.getMutationType();
    console.log("mutationType: ", mutationType);
    const subscriptionType = schema.getSubscriptionType();

    // 至少需要存在一个可用的操作类型
    if (!queryType && !mutationType && !subscriptionType) {
      return <div>Missing query type</div>;
    }

    // 获取操作类型下的所有字段
    const queryFields = queryType && queryType.getFields();
    const mutationFields = mutationType && mutationType.getFields();
    const subscriptionFields = subscriptionType && subscriptionType.getFields();

    // { kind: "Document", definitions: Array(3), loc: undefined }
    // definitions: Array(3)
    // 0: { kind: "OperationDefinition", operation: "query", name: { … }, variableDefinitions: Array(0), directives: Array(0), … }
    // 1: { kind: "OperationDefinition", operation: "query", name: { … }, variableDefinitions: Array(0), directives: Array(0), … }
    // 2: { kind: "FragmentDefinition", name: { … }, typeCondition: { … }, directives: Array(0), selectionSet: { … }, … }
    // length: 3
    // __proto__: Array(0)
    // kind: "Document"
    // loc: undefined

    // directives: []
    // kind: "OperationDefinition"
    // loc: undefined
    // name: { kind: "Name", value: "npmPackage", loc: undefined }
    // operation: "query"
    // selectionSet: { kind: "SelectionSet", selections: Array(1), loc: undefined }
    // variableDefinitions: []
    const parsedQuery: DocumentNode = memoizeParseQuery(query);
    console.log("parsedQuery: ", parsedQuery);

    // 获取默认查询的字段？这个和example是啥关系？
    // 应该就是查看对象类型中是否有id这样的关键字段
    const getDefaultFieldNames =
      this.props.getDefaultFieldNames || defaultGetDefaultFieldNames;

    // __typename
    console.log(
      "getDefaultFieldNames: ",
      getDefaultFieldNames(queryType as GraphQLObjectType)
    );

    const getDefaultScalarArgValue =
      this.props.getDefaultScalarArgValue || defaultGetDefaultScalarArgValue;

    const definitions = parsedQuery.definitions;

    // 返回相关操作
    // TODO: iql中除了这两个还能输入哪种？
    const _relevantOperations = definitions
      .map((definition) => {
        // 对于对象类型定义与片段定义 直接返回
        if (definition.kind === "FragmentDefinition") {
          return definition;
        } else if (definition.kind === "OperationDefinition") {
          return definition;
        } else {
          return null;
        }
      })
      .filter(Boolean);
    // 等同于definitions？
    console.log("_relevantOperations: ", _relevantOperations);

    // 默认展开一个MyQuery Query
    const relevantOperations =
      // If we don't have any relevant definitions from the parsed document,
      // then at least show an expanded Query selection
      (
        _relevantOperations.length === 0
          ? DEFAULT_DOCUMENT.definitions
          : _relevantOperations
      ) as DefinitionNode[];

    const renameOperation = (
      targetOperation: DefinitionNode,
      name: string
    ): ASTNode => {
      const newName =
        name == null || name === ""
          ? null
          : { kind: "Name", value: name, loc: undefined };
      const newOperation = { ...targetOperation, name: newName };

      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.map((existingOperation) => {
        // if (targetOperation === existingOperation) {
        //   return newOperation;
        // } else {
        //   return existingOperation;
        // }

        return targetOperation === existingOperation
          ? newOperation
          : existingOperation;
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions as unknown as DefinitionNode[],
      };
    };

    const cloneOperation = (
      targetOperation: OperationDefinitionNode | FragmentDefinitionNode
    ): ASTNode => {
      const kind =
        targetOperation.kind === "FragmentDefinition"
          ? "fragment"
          : targetOperation.operation;

      // let kind;
      // if (targetOperation.kind === "FragmentDefinition") {
      //   kind = "fragment";
      // } else {
      //   kind = targetOperation.operation;
      // }

      const newOperationName =
        ((targetOperation.name && targetOperation.name.value) || "") + "Copy";

      const newName = {
        kind: "Name",
        value: newOperationName,
        loc: undefined,
      };

      const newOperation = {
        ...targetOperation,
        name: newName,
      } as DefinitionNode;

      const existingDefs = parsedQuery.definitions;

      const newDefinitions: DefinitionNode[] = [...existingDefs, newOperation];

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const destroyOperation = (targetOperation: DefinitionNode) => {
      const existingDefs = parsedQuery.definitions;

      const newDefinitions = existingDefs.filter((existingOperation) => {
        // if (targetOperation === existingOperation) {
        //   return false;
        // } else {
        //   return true;
        // }

        return targetOperation !== existingOperation;
      });

      return {
        ...parsedQuery,
        definitions: newDefinitions,
      };
    };

    const addOperation = (kind: NewOperationType) => {
      console.log("kind: ", kind);
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

      const newOperationDef: ASTNode = {
        ...parsedQuery,
        definitions: newDefinitions as unknown as DefinitionNode[],
      };

      this.setState({ operationToScrollTo: `${kind}-${newOperationName}` });

      this.props.onEdit(print(newOperationDef));
    };

    // 下方切换操作类型
    const actionsOptions = generateActionOptions(
      queryFields,
      mutationFields,
      subscriptionFields,
      styleConfig
    );

    const actionsEl = generateActionElements(
      actionsOptions,
      styleConfig,
      this.state.newOperationType,
      this._setAddOperationType,
      addOperation
    );

    // 拿到所有已定义的片段
    const availableFragments = getAvailableFragments(relevantOperations);

    // Display: GraphiQL Explorer by OneGraph Contribute on GitHub
    const attribution = this.props.showAttribution ? <Attribution /> : null;

    return (
      <div
        ref={(ref) => {
          this._ref = ref;
        }}
        style={EXPLORER_ROOT_STYLES}
        className="graphiql-explorer-root"
      >
        <div
          style={{
            flexGrow: 1,
            overflow: "scroll",
          }}
        >
          {/* 使用相关操作渲染RootView */}
          {(relevantOperations as any[]).map(
            (
              operation: OperationDefinitionNode | FragmentDefinitionNode,
              index
            ) => {
              const operationName =
                operation && operation.name && operation.name.value;

              const operationType: OperationTypeNode | "fragment" =
                operation.kind === "FragmentDefinition"
                  ? "fragment"
                  : (operation && operation.operation) || "query";

              const onOperationRename = (newName: string) => {
                const newOperationDef = renameOperation(operation, newName);
                this.props.onEdit(print(newOperationDef));
              };

              const onOperationClone = () => {
                console.log("onOperationClone: ");
                const newOperationDef = cloneOperation(operation);
                this.props.onEdit(print(newOperationDef));
              };

              const onOperationDestroy = () => {
                console.log("onOperationDestroy: ");
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
                console.log("onCommit: ");
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
                  // commit是什么操作？
                  onCommit={onCommit}
                  // 点击修改explorer字段时触发
                  onEdit={(
                    newDefinition?: DefinitionNode,
                    options?: { commit: boolean }
                  ): DocumentNode => {
                    console.log("onEdit");
                    const commit = checkCommit(options);

                    // 是否产生了新的字段定义
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

                      commit ? onCommit(newQuery) : void 0;
                      return newQuery;

                      // if (commit) {
                      //   onCommit(newQuery);
                      //   return newQuery;
                      // } else {
                      //   return newQuery;
                      // }
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
                      this.props.onRunOperation(operationName!);
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
