import React from "react";
import {
  OperationDefinitionNode,
  FragmentDefinitionNode,
  DocumentNode,
} from "graphql";
import { capitalize } from "../constants";
import { NewOperationType, RootViewProps, Selections } from "../types";
import { isRunShortcut, canRunOperation } from "../utils";
import FieldView from "./FieldView";

interface RootViewState {
  // 区分于旧的 OperationType， 去除了 fragment 作为操作类型
  newOperationType: NewOperationType;
  // 是否在操作类型title旁展示移除与复制操作
  displayTitleActions: boolean;
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
    const rootViewElId = this._rootViewElId();
    console.log('rootViewElId: ', rootViewElId);

    // 继承自Explorer组件
    this.props.onMount(rootViewElId);
  }

  _modifySelections = (
    selections: Selections,
    options?: { commit: boolean }
  ): DocumentNode => {
    let operationDef: FragmentDefinitionNode | OperationDefinitionNode =
      this.props.definition;

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
          // @ts-ignore
          selections,
        },
      };
    } else if (operationDef.kind === "OperationDefinition") {
      let cleanedSelections = (selections as unknown as any[]).filter(
        (selection) => {
          return !(
            selection.kind === "Field" && selection.name.value === "__typename"
          );
        }
      );

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

    return this.props.onEdit(newOperationDef, options);
  };

  _onOperationRename = (event) =>
    this.props.onOperationRename(event.target.value);

  _handlePotentialRun = (event) => {
    if (isRunShortcut(event) && canRunOperation(this.props.definition.kind)) {
      this.props.onRunOperation(this.props.name);
    }
  };

  _rootViewElId = () => {
    const { operationType, name } = this.props;
    const rootViewElId = `${operationType}-${name || "unknown"}`;
    return rootViewElId;
  };



  render() {
    const {
      operationType,
      definition,
      schema,
      getDefaultFieldNames,
      styleConfig,
    } = this.props;
    const rootViewElId = this._rootViewElId();

    const fields = this.props.fields || {};
    const operationDef = definition;
    const selections = operationDef.selectionSet.selections;

    const operationDisplayName =
      this.props.name || `${capitalize(operationType)} Name`;

    return (
      <div
        id={rootViewElId}
        tabIndex="0"
        onKeyDown={this._handlePotentialRun}
        style={{
          // The actions bar has its own top border
          borderBottom: this.props.isLast ? "none" : "1px solid #d6d6d6",
          marginBottom: "0em",
          paddingBottom: "1em",
        }}
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
          {!!this.props.onTypeName ? (
            <span>
              <br />
              {`on ${this.props.onTypeName}`}
            </span>
          ) : (
            ""
          )}
          {!!this.state.displayTitleActions ? (
            <React.Fragment>
              <button
                type="submit"
                className="toolbar-button"
                onClick={() => this.props.onOperationDestroy()}
                style={{
                  ...styleConfig.styles.actionButtonStyle,
                }}
              >
                <span>{"\u2715"}</span>
              </button>
              <button
                type="submit"
                className="toolbar-button"
                onClick={() => this.props.onOperationClone()}
                style={{
                  ...styleConfig.styles.actionButtonStyle,
                }}
              >
                <span>{"⎘"}</span>
              </button>
            </React.Fragment>
          ) : (
            ""
          )}
        </div>

        {Object.keys(fields)
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
