import React, { Component } from "react";
import GraphiQL from "graphiql";
import GraphiQLExplorer from "graphiql-explorer";
import { buildClientSchema, getIntrospectionQuery, parse } from "graphql";
import { makeDefaultArg, getDefaultScalarArgValue } from "./CustomArgs";
import CodeMirror, { KeyMap } from "codemirror";

import "graphiql/graphiql.css";
import "./App.css";

import type { GraphQLSchema } from "graphql";
import { DEFAULT_QUERY } from "./constants";
import { fetcher, CodeMirrorMousePos } from "./utils";

type AppState = {
  schema?: GraphQLSchema;
  query: string;
  explorerIsOpen: boolean;
};

// const GraphiQLExampleApp: React.FC = () => {
//   return (
//     <>
//       <h1>1</h1>
//     </>
//   );
// };

export default class GraphiQLExampleApp extends Component<{}, AppState> {
  _graphiql = new GraphiQL({
    fetcher,
  });
  state: AppState = {
    schema: undefined,
    query: DEFAULT_QUERY,
    explorerIsOpen: true,
  };

  componentDidMount() {
    fetcher({
      // Introspection Query：获取完整的GraphQL API信息
      query: getIntrospectionQuery(),
    })
      .then((result) => {
        const editor = this._graphiql.getQueryEditor()!;

        editor.setOption("extraKeys", {});

        editor.setOption("extraKeys", {
          "Shift-Alt-LeftClick": this
            ._handleInspectOperation as unknown as KeyMap[string],
        });

        // 基于拿到的API 信息构建完整的Schema
        // 需要和IntrospectionQuery结合使用
        // 注意，拿到的Schema并不能用来执行操作（query）
        this.setState({ schema: buildClientSchema(result.data) });
      })
      .catch((err) => {
        console.log("err: ", err);
      });
  }

  _handleInspectOperation = (
    codeMirror: CodeMirror.Editor,
    mousePos: CodeMirrorMousePos
  ): boolean | null | void => {
    // GraphQL AST 信息
    // kind、definitions、loc（Location2）
    const parsedQuery = parse(this.state.query || "");

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    // 获取鼠标点击位置的词法token，包括属性（如field、object type name）、符号（如{}）、属性（参数）、普通字符串（参数值等）
    const token = codeMirror.getTokenAt(mousePos);
    const start = { line: mousePos.line, ch: token.start };
    const end = { line: mousePos.line, ch: token.end };
    // token中的start、end标识在本行的开始与结束
    // start从0开始
    // 获取在字符串中的完整位置 如 {start: 232, end: 240}
    const relevantMousePos = {
      start: codeMirror.indexFromPos(start),
      end: codeMirror.indexFromPos(end),
    };

    const position = relevantMousePos;

    // definition：本次查询语句中的Query/Mutation定义
    const def = parsedQuery.definitions.find((definition) => {
      console.log("definition: ", definition);
      if (!definition.loc) {
        // 比如点击到注释上
        console.log("Missing location information for definition");
        return false;
      }

      const { start, end } = definition.loc;
      // GraphQL DefinitionNode中的loc定义需要包含上面Editor的范围
      // 否则就是点击到注释上了，因为不被包含在loc中
      return start <= position.start && end >= position.end;
    });

    if (!def) {
      console.error(
        "Unable to find definition corresponding to mouse position"
      );
      return null;
    }

    const operationKind =
      def.kind === "OperationDefinition"
        ? def.operation
        : def.kind === "FragmentDefinition"
        ? "fragment"
        : "unknown";

    const operationName =
      def.kind === "OperationDefinition" && !!def.name
        ? def.name.value
        : def.kind === "FragmentDefinition" && !!def.name
        ? def.name.value
        : "unknown";

    const selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    const el = document.querySelector(selector);
    console.log("el: ", el);
    // 将对应的类型定义滚动进视口
    // 但是只能做到query/mutation级别 理论来说是可以做到field级别的
    el && el.scrollIntoView();
  };

  _handleEditQuery = (query?: string): void => {
    // query: 进行编辑后，目前编辑器内停留的完整schema
    this.setState({ query: query ?? "" });
  };

  _handleToggleExplorer = () => {
    console.log("_handleToggleExplorer");
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };

  render() {
    const { query, schema } = this.state;

    return (
      <>
        <div className="graphiql-container">
          {/* TODO: provide type definitions */}
          {/* @ts-ignore */}
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={this._handleEditQuery}
            // 在何时调用？
            onRunOperation={(operationName: string) => {
              console.log("operationName: ", operationName);
              this._graphiql.handleRunQuery(operationName);
            }}
            explorerIsOpen={this.state.explorerIsOpen}
            onToggleExplorer={this._handleToggleExplorer}
            getDefaultScalarArgValue={getDefaultScalarArgValue}
            makeDefaultArg={makeDefaultArg}
          />
          <GraphiQL
            ref={(ref) => (this._graphiql = ref!)}
            fetcher={fetcher}
            schema={schema}
            query={query}
            onEditQuery={this._handleEditQuery}
          >
            {/* 使用内置组件额外新增工具栏按钮 */}
            <GraphiQL.Toolbar>
              <GraphiQL.Button
                onClick={() => this._graphiql.handlePrettifyQuery()}
                label="Prettify"
                title="Prettify Query (Shift-Ctrl-P)"
              />
              <GraphiQL.Button
                onClick={() => this._graphiql.handleToggleHistory()}
                label="History"
                title="Show History"
              />
              <GraphiQL.Button
                onClick={this._handleToggleExplorer}
                label="Explorer"
                title="Toggle Explorer"
              />
            </GraphiQL.Toolbar>
          </GraphiQL>
        </div>
      </>
    );
  }
}
