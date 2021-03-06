import React from "react";

import { Colors } from "./types";

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Names match class names in graphiql app.css
// https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/css/app.css
// map relation: keyword -> cm-keyword
// cm: codemirror
export const defaultColors: Colors = {
  keyword: "#B11A04",
  // OperationName, FragmentName
  def: "#D2054E",
  // FieldName
  property: "#1F61A0",
  // FieldAlias
  qualifier: "#1C92A9",
  // ArgumentName and ObjectFieldName
  attribute: "#8B2BB9",
  number: "#2882F9",
  string: "#D64292",
  // Boolean
  builtin: "#D47509",
  // Enum
  string2: "#0B7FC7",
  variable: "#397D13",
  // Type
  atom: "#CA9800",
};

// TODO: move to components folder

export const defaultArrowOpen = (
  <svg width="12" height="9">
    <path fill="#666" d="M 0 2 L 9 2 L 4.5 7.5 z" />
  </svg>
);

export const defaultArrowClosed = (
  <svg width="12" height="9">
    <path fill="#666" d="M 0 0 L 0 9 L 5.5 4.5 z" />
  </svg>
);

export const defaultCheckboxChecked = (
  <svg
    style={{ marginRight: "3px", marginLeft: "-3px" }}
    width="12"
    height="12"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM16 16H2V2H16V16ZM14.99 6L13.58 4.58L6.99 11.17L4.41 8.6L2.99 10.01L6.99 14L14.99 6Z"
      fill="#666"
    />
  </svg>
);

export const defaultCheckboxUnchecked = (
  <svg
    style={{ marginRight: "3px", marginLeft: "-3px" }}
    width="12"
    height="12"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16 2V16H2V2H16ZM16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0Z"
      fill="#CCC"
    />
  </svg>
);

export function Attribution() {
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: "1em",
        marginTop: 0,
        flexGrow: 1,
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          borderTop: "1px solid #d6d6d6",
          paddingTop: "1em",
          width: "100%",
          textAlign: "center",
        }}
      >
        GraphiQL Explorer by <a href="https://www.onegraph.com">OneGraph</a>
      </div>
      <div>
        Contribute on{" "}
        <a href="https://github.com/OneGraph/graphiql-explorer">GitHub</a>
      </div>
    </div>
  );
}

export const DEFAULT_OPERATION = {
  kind: "OperationDefinition",
  operation: "query",
  variableDefinitions: [],
  name: { kind: "Name", value: "MyQuery" },
  directives: [],
  selectionSet: {
    kind: "SelectionSet",
    selections: [],
  },
};
export const DEFAULT_DOCUMENT = {
  kind: "Document",
  definitions: [DEFAULT_OPERATION],
};

export const defaultStyles = {
  buttonStyle: {
    fontSize: "1.2em",
    padding: "0px",
    backgroundColor: "white",
    border: "none",
    margin: "5px 0px",
    height: "40px",
    width: "100%",
    display: "block",
    maxWidth: "none",
  },

  actionButtonStyle: {
    padding: "0px",
    backgroundColor: "white",
    border: "none",
    margin: "0px",
    maxWidth: "none",
    height: "15px",
    width: "15px",
    display: "inline-block",
    fontSize: "smaller",
  },

  explorerActionsStyle: {
    margin: "4px -8px -8px",
    paddingLeft: "8px",
    bottom: "0px",
    width: "100%",
    textAlign: "center" as "center",
    background: "none",
    borderTop: "none",
    borderBottom: "none",
  },
};
