import React, { CSSProperties } from "react";
import { RootViewProps } from "../../types";

export const getRootViewElId = (props: RootViewProps) => {
  const { operationType, name } = props;
  const rootViewElId = `${operationType}-${name || "unknown"}`;
  return rootViewElId;
};

export const getRootViewElStyles = (isLast: boolean): CSSProperties => {
  return {
    // The actions bar has its own top border
    borderBottom: isLast ? "none" : "1px solid #d6d6d6",
    marginBottom: "0em",
    paddingBottom: "1em",
  };
};

export const TitleActions: React.FC<{
  styleConfig: any;
  onOperationDestroy: (...args: any) => any;
  onOperationClone: (...args: any) => any;
}> = ({ styleConfig, onOperationDestroy, onOperationClone }) => {
  return (
    <>
      <button
        type="submit"
        className="toolbar-button"
        onClick={() => onOperationDestroy()}
        style={{
          ...styleConfig.styles.actionButtonStyle,
        }}
      >
        <span>{"\u2715"}</span>
      </button>
      <button
        type="submit"
        className="toolbar-button"
        onClick={() => onOperationClone()}
        style={{
          ...styleConfig.styles.actionButtonStyle,
        }}
      >
        <span>{"⎘"}</span>
      </button>
    </>
  );
};
