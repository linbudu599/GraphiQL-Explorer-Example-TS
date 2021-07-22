import { isObjectType } from "graphql";
import React, { CSSProperties } from "react";
import { Checkbox } from "../../utils";

export const NODE_STYLES: CSSProperties = {
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  minHeight: "16px",
  WebkitUserSelect: "none",
  userSelect: "none",
};

interface ITmpTinyCompProps {
  type: string;
  styleConfig: any;
  selection: any;
}

export const Arrow: React.FC<ITmpTinyCompProps> = ({
  selection,
  type,
  styleConfig,
}) => {
  return isObjectType(type) ? (
    <span>{!!selection ? styleConfig.arrowOpen : styleConfig.arrowClosed}</span>
  ) : null;
};

export const CheckBoxComp: React.FC<ITmpTinyCompProps> = ({
  selection,
  type,
  styleConfig,
}) => {
  return isObjectType(type) ? null : (
    <Checkbox checked={!!selection} styleConfig={styleConfig} />
  );
};
