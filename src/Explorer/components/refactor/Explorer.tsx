import React, { CSSProperties } from "react";

import { GraphQLFieldMap } from "graphql";
import { AvailableFragments, NewOperationType } from "../../types";

export const generateActionOptions = (
  queryFields: GraphQLFieldMap<any, any> | undefined | null,
  mutationFields: GraphQLFieldMap<any, any> | undefined | null,
  subscriptionFields: GraphQLFieldMap<any, any> | undefined | null,
  styleConfig: any
) => {
  const actionsOptions = [
    !!queryFields ? (
      <option
        key="query"
        className={"toolbar-button"}
        style={styleConfig.styles.buttonStyle}
        // type="link"
        value={"query"}
      >
        Query
      </option>
    ) : null,

    !!mutationFields ? (
      <option
        key="mutation"
        className={"toolbar-button"}
        style={styleConfig.styles.buttonStyle}
        // type="link"
        value={"mutation"}
      >
        Mutation
      </option>
    ) : null,

    !!subscriptionFields ? (
      <option
        key="subscription"
        className={"toolbar-button"}
        style={styleConfig.styles.buttonStyle}
        // type="link"
        value={"subscription"}
      >
        Subscription
      </option>
    ) : null,
  ].filter(Boolean);

  return actionsOptions;
};

export const generateActionElements = (
  actionsOptions: (JSX.Element | null)[],
  styleConfig: any,
  newOperationType: NewOperationType | null,
  addOperationTypeSetter: (type: NewOperationType) => any,
  addOperationType: (type: NewOperationType) => any
) => {
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
              flexGrow: 0,
              textAlign: "right",
            }}
          >
            Add new{" "}
          </span>
          <select
            onChange={(event) =>
              addOperationTypeSetter(event.target.value as NewOperationType)
            }
            value={newOperationType!}
            style={{ flexGrow: 2 }}
          >
            {actionsOptions}
          </select>
          <button
            type="submit"
            className="toolbar-button"
            onClick={() =>
              newOperationType ? addOperationType(newOperationType) : null
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

  return actionsEl;
};

export const getAvailableFragments = (relevantOperations: any[]) => {
  const availableFragments: AvailableFragments = relevantOperations.reduce(
    (acc: any, operation) => {
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

  return availableFragments;
};

export const EXPLORER_ROOT_STYLES: CSSProperties = {
  fontSize: 12,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  margin: 0,
  padding: 8,
  fontFamily: 'Consolas, Inconsolata, "Droid Sans Mono", Monaco, monospace',
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

export const checkCommit = (options?: { commit: boolean }) => {
  let commit;
  if (typeof options === "object" && typeof options.commit !== "undefined") {
    commit = options.commit;
  } else {
    commit = true;
  }

  return commit;
};
