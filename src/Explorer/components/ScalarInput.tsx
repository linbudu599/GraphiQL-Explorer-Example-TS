import * as React from "react";
import { ScalarInputProps } from "../types";
import { unwrapInputType } from "../utils";

export default class ScalarInput extends React.PureComponent<
  ScalarInputProps,
  {}
> {
  _ref?: any;
  _handleChange = (event: React.SyntheticEvent) => {
    this.props.setArgValue(event, true);
  };

  componentDidMount() {
    const input = this._ref;
    const activeElement = document.activeElement;
    if (
      input &&
      activeElement &&
      !(activeElement instanceof HTMLTextAreaElement)
    ) {
      input.focus();
      input.setSelectionRange(0, input.value.length);
    }
  }

  render() {
    const { arg, argValue, styleConfig } = this.props;
    const argType = unwrapInputType(arg.type);
    // @ts-ignore
    const value = typeof argValue.value === "string" ? argValue.value : "";
    const color =
      this.props.argValue.kind === "StringValue"
        ? styleConfig.colors.string
        : styleConfig.colors.number;
    return (
      <span style={{ color }}>
        {argType.name === "String" ? '"' : ""}
        <input
          style={{
            border: "none",
            borderBottom: "1px solid #888",
            outline: "none",
            width: `${Math.max(1, Math.min(15, value.length))}ch`,
            color,
          }}
          ref={(ref) => {
            this._ref = ref;
          }}
          type="text"
          onChange={this._handleChange}
          value={value}
        />
        {argType.name === "String" ? '"' : ""}
      </span>
    );
  }
}
