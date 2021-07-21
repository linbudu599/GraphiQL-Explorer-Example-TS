import React from 'react'

import { GraphQLFieldMap, } from "graphql";
import { NewOperationType } from "../../types";

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
  addOperationType: (type: NewOperationType) => any,

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
              newOperationType
                ? addOperationType(newOperationType)
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

  return actionsEl
};
