import React, { useState, useEffect } from "react";
import GraphiQL from "graphiql";
import GraphiQLExplorer from "graphiql-explorer";
// import GraphiQLExplorer from "./Explorer/components/Explorer";
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

const GraphiQLExampleApp: React.FC = () => {
  // use memo ?
  let graphiqlIns = new GraphiQL({
    fetcher,
  });

  const [appState, setAppState] = useState<AppState>({
    schema: undefined,
    query: DEFAULT_QUERY,
    explorerIsOpen: true,
  });

  const { schema, query } = appState;

  const patchAppState = (patchState: Partial<AppState>) => {
    setAppState({
      ...appState,
      ...patchState,
    });
  };

  useEffect(() => {
    fetcher({
      query: getIntrospectionQuery(),
    })
      .then((result) => {
        // const editor = graphiqlIns.getQueryEditor()!;

        // editor.setOption("extraKeys", {
        //   "Shift-Alt-LeftClick":
        //     handleInspectOperation as unknown as KeyMap[string],
        // });

        setAppState({ ...appState, schema: buildClientSchema(result.data) });
      })
      .catch((err) => {
        console.log("err: ", err);
      });
  }, []);

  const handleInspectOperation = (
    codeMirror: CodeMirror.Editor,
    mousePos: CodeMirrorMousePos
  ): boolean | null | void => {
    const parsedQuery = parse(appState.query || "");

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    const token = codeMirror.getTokenAt(mousePos);
    const start = { line: mousePos.line, ch: token.start };
    const end = { line: mousePos.line, ch: token.end };
    const relevantMousePos = {
      start: codeMirror.indexFromPos(start),
      end: codeMirror.indexFromPos(end),
    };

    const position = relevantMousePos;

    const def = parsedQuery.definitions.find((definition) => {
      console.log("definition: ", definition);
      if (!definition.loc) {
        console.log("Missing location information for definition");
        return false;
      }

      const { start, end } = definition.loc;
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
    el && el.scrollIntoView();
  };

  const handleEditQuery = (query?: string): void => {
    patchAppState({ query: query ?? "" });
  };

  const handleToggleExplorer = () => {
    patchAppState({ explorerIsOpen: !appState.explorerIsOpen });
  };

  return (
    <>
      <div className="graphiql-container">
        {/* TODO: provide type definitions */}
        {/* @ts-ignore */}
        <GraphiQLExplorer
          // @ts-ignore
          schema={schema}
          query={query}
          onEdit={handleEditQuery}
          // 在何时调用？
          onRunOperation={(operationName: string) => {
            console.log("operationName: ", operationName);
            graphiqlIns.handleRunQuery(operationName);
          }}
          explorerIsOpen={appState.explorerIsOpen}
          onToggleExplorer={handleToggleExplorer}
          getDefaultScalarArgValue={getDefaultScalarArgValue}
          makeDefaultArg={makeDefaultArg}
        />
        <GraphiQL
          ref={(ref) => (graphiqlIns = ref!)}
          fetcher={fetcher}
          schema={schema}
          query={query}
          onEditQuery={handleEditQuery}
        >
          {/* 使用内置组件额外新增工具栏按钮 */}
          <GraphiQL.Toolbar>
            <GraphiQL.Button
              onClick={() => graphiqlIns.handlePrettifyQuery()}
              label="Prettify"
              title="Prettify Query (Shift-Ctrl-P)"
            />
            <GraphiQL.Button
              onClick={() => graphiqlIns.handleToggleHistory()}
              label="History"
              title="Show History"
            />
            <GraphiQL.Button
              onClick={handleToggleExplorer}
              label="Explorer"
              title="Toggle Explorer"
            />
          </GraphiQL.Toolbar>
        </GraphiQL>
      </div>
    </>
  );
};

export default GraphiQLExampleApp;
