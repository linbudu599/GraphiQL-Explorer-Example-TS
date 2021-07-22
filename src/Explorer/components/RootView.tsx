import React from "react";
import {
  OperationDefinitionNode,
  FragmentDefinitionNode,
  DocumentNode,
  SelectionNode,
} from "graphql";
import { capitalize } from "../constants";
import { NewOperationType, RootViewProps, Selections } from "../types";
import { isRunShortcut, canRunOperation } from "../utils";
import FieldView from "./FieldView";
import {
  getRootViewElId,
  getRootViewElStyles,
  TitleActions,
} from "./refactor/RootView";

interface RootViewState {
  // 不是真的新·操作类型，而是新版本GraphQL支持的操作类型
  // 在这里是当前的 RootView 代表的操作名称
  newOperationType: NewOperationType;
  // 设置为true 则始终在可用操作标题旁展示操作按钮
  // 即使设置为false 在鼠标移入时也会显式
  displayTitleActions?: boolean;
  // displayTitleActionsOnMouseEnter?: boolean;
}

export default class RootView extends React.PureComponent<
  RootViewProps,
  RootViewState
> {
  state: RootViewState = {
    newOperationType: "query",
    displayTitleActions: true,
  };

  _previousOperationDef?: OperationDefinitionNode | FragmentDefinitionNode;

  componentDidMount() {
    // 每个根类型都会生成一个专用id 形式为 query-MyQuery 这样
    const rootViewElId = getRootViewElId(this.props);

    // 由Explorer调用此组件，Explorer接受一个operationToScrollTo属性
    // Explorer._handleRootViewMount方法会在RootView挂载时将operationToScrollTo
    // 对应的操作滚动到可见部位
    this.props.onMount(rootViewElId);
  }

  // 在explorer中修改字段时使用
  _modifySelections = (
    selections: SelectionNode[],
    options?: { commit: boolean }
  ): DocumentNode => {
    console.log("selections: ", selections);
    // selections 是一个递归结构
    // selections
    // - name
    // - selectionSet
    //   - selections
    //     - name
    //     - selectionSet
    // 但是：
    // - 不包含参数
    // - 表示当前被选择的所有
    // Set也作子集
    let operationDef = this.props.definition;

    if (
      operationDef.selectionSet.selections.length === 0 &&
      this._previousOperationDef
    ) {
      operationDef = this._previousOperationDef;
    }

    let newOperationDef: OperationDefinitionNode | FragmentDefinitionNode;

    if (operationDef.kind === "FragmentDefinition") {
      newOperationDef = {
        ...operationDef,
        selectionSet: {
          ...operationDef.selectionSet,
          selections,
        },
      };
    } else if (operationDef.kind === "OperationDefinition") {
      let cleanedSelections = selections.filter((selection) => {
        return !(
          selection.kind === "Field" && selection.name.value === "__typename"
        );
      });

      // 在当前对象类型下没有被选择的字段时插入占位
      if (cleanedSelections.length === 0) {
        cleanedSelections = [
          {
            kind: "Field",
            name: {
              kind: "Name",
              value: "__typename ## Placeholder value",
            },
          },
        ];
      }

      newOperationDef = {
        ...operationDef,
        selectionSet: {
          ...operationDef.selectionSet,
          selections: cleanedSelections,
        },
      };
    }

    return this.props.onEdit(newOperationDef!, options);
  };

  // 重命名可用操作类型时触发
  _onOperationRename = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.props.onOperationRename(event.target!.value);

  _handlePotentialRun = (event: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("_handlePotentialRun: ");
    if (isRunShortcut(event) && canRunOperation(this.props.definition.kind)) {
      this.props.onRunOperation(this.props.name);
    }
  };

  render() {
    const {
      operationType,
      definition,
      schema,
      getDefaultFieldNames,
      styleConfig,
    } = this.props;
    const rootViewElId = getRootViewElId(this.props);

    const fields = this.props.fields || {};
    const operationDef = definition;
    const selections = operationDef.selectionSet.selections;

    // 可自定义操作展示的name
    const operationDisplayName =
      this.props.name || `${capitalize(operationType)} Name`;

    return (
      <div
        id={rootViewElId}
        // 作用？
        tabIndex={0}
        onKeyDown={this._handlePotentialRun}
        style={getRootViewElStyles(this.props.isLast)}
      >
        <div
          style={{ color: styleConfig.colors.keyword, paddingBottom: 4 }}
          className="graphiql-operation-title-bar"
          onMouseEnter={() => this.setState({ displayTitleActions: true })}
          onMouseLeave={() => this.setState({ displayTitleActions: false })}
        >
          {operationType}{" "}
          <span style={{ color: styleConfig.colors.def }}>
            <input
              style={{
                color: styleConfig.colors.def,
                border: "none",
                borderBottom: "1px solid #888",
                outline: "none",
                width: `${Math.max(4, operationDisplayName.length)}ch`,
              }}
              autoComplete="false"
              placeholder={`${capitalize(operationType)} Name`}
              value={this.props.name}
              onKeyDown={this._handlePotentialRun}
              onChange={this._onOperationRename}
            />
          </span>
          {/* 如果当前的操作是片段类型，则展示其基类 */}
          {!!this.props.onTypeName ? (
            <span>
              <br />
              {`on ${this.props.onTypeName}`}
            </span>
          ) : (
            ""
          )}
          {!!this.state.displayTitleActions && (
            <TitleActions
              styleConfig={styleConfig}
              // 对可用操作进行的操作
              // 其操作方法无需入参 因为在渲染RootView时传入的方法
              // 已经绑定了参数

              // 复制可用操作
              // 在Explorer中会调用 cloneOperation 方法
              // 生成 Origin Copy 这样的形式
              // 并修改状态
              // this.props.onEdit(print(newOperationDef));
              // print方法会从AST生成plain string
              onOperationClone={this.props.onOperationClone}
              // 删除可用操作
              onOperationDestroy={this.props.onOperationDestroy}
            />
          )}
        </div>

        {Object.keys(fields)
          // TODO: 可配置字段排序
          .sort()
          .map((fieldName: string) => (
            <FieldView
              key={fieldName}
              field={fields[fieldName]}
              selections={selections}
              modifySelections={this._modifySelections}
              schema={schema}
              getDefaultFieldNames={getDefaultFieldNames}
              getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
              makeDefaultArg={this.props.makeDefaultArg}
              onRunOperation={this.props.onRunOperation}
              styleConfig={this.props.styleConfig}
              onCommit={this.props.onCommit}
              definition={this.props.definition}
              availableFragments={this.props.availableFragments}
            />
          ))}
      </div>
    );
  }
}
