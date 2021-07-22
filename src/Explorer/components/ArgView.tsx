import {
  ArgumentNode,
  DocumentNode,
  isInputObjectType,
  isLeafType,
  VariableDefinitionNode,
  ValueNode,
  ObjectFieldNode,
} from "graphql";
import React from "react";
import { ArgViewProps, ArgViewState } from "../types";
import {
  unwrapInputType,
  defaultInputObjectFields,
  coerceArgValue,
} from "../utils";
import AbstractArgView from "./AbstractArgView";

export default class ArgView extends React.PureComponent<
  ArgViewProps,
  ArgViewState
> {
  _previousArgSelection?: ArgumentNode;
  _getArgSelection = () => {
    const { selection } = this.props;

    return (selection.arguments || []).find(
      (arg) => arg.name.value === this.props.arg.name
    );
  };
  _removeArg = (commit: boolean): DocumentNode | null => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    // @ts-ignore
    return this.props.modifyArguments(
      (selection.arguments || []).filter((arg) => arg !== argSelection),
      { commit }
    );
  };
  _addArg = (commit: boolean): DocumentNode | null => {
    const {
      selection,
      getDefaultScalarArgValue,
      makeDefaultArg,
      parentField,
      arg,
    } = this.props;
    const argType = unwrapInputType(arg.type);

    let argSelection = null;
    if (this._previousArgSelection) {
      argSelection = this._previousArgSelection;
    } else if (isInputObjectType(argType)) {
      const fields = argType.getFields();
      argSelection = {
        kind: "Argument",
        name: { kind: "Name", value: arg.name },
        value: {
          kind: "ObjectValue",
          fields: defaultInputObjectFields(
            getDefaultScalarArgValue,
            makeDefaultArg,
            parentField,
            Object.keys(fields).map((k) => fields[k])
          ),
        },
      };
    } else if (isLeafType(argType)) {
      argSelection = {
        kind: "Argument",
        name: { kind: "Name", value: arg.name },
        value: getDefaultScalarArgValue(parentField, arg, argType),
      };
    }

    if (!argSelection) {
      console.error("Unable to add arg for argType", argType);
      return null;
    } else {
      // @ts-ignore
      return this.props.modifyArguments(
        [...(selection.arguments || []), argSelection] as ArgumentNode[],
        { commit }
      );
    }
  };
  _setArgValue = (
    event: React.ChangeEvent<HTMLSelectElement> | VariableDefinitionNode,
    options?: { commit: boolean }
  ) => {
    let settingToNull = false;
    let settingToVariable = false;
    let settingToLiteralValue = false;

    try {
      if ("kind" in event && event.kind === "VariableDefinition") {
        settingToVariable = true;
      } else if (event === null || typeof event === "undefined") {
        settingToNull = true;
      } else if ("kind" in event && typeof event.kind === "string") {
        settingToLiteralValue = true;
      }
    } catch (e) {}
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    if (!argSelection && !settingToVariable) {
      console.error("missing arg selection when setting arg value");
      return null;
    }
    const argType = unwrapInputType(this.props.arg.type);

    const handleable =
      isLeafType(argType) ||
      settingToVariable ||
      settingToNull ||
      settingToLiteralValue;

    if (!handleable) {
      console.warn("Unable to handle non leaf types in ArgView._setArgValue");
      return null;
    }

    let targetValue: string | VariableDefinitionNode;
    let value: ValueNode | null;

    if (event === null || typeof event === "undefined") {
      value = null;
    } else if (
      "target" in event &&
      event.target &&
      typeof event.target.value === "string"
    ) {
      targetValue = event.target.value;
      value = coerceArgValue(argType, targetValue);
      // @ts-ignore
    } else if (!event.target && event.kind === "VariableDefinition") {
      // @ts-ignore
      targetValue = event;
      // @ts-ignore
      value = targetValue.variable;
      // @ts-ignore
    } else if (typeof event.kind === "string") {
      // @ts-ignore
      value = event;
    }

    return this.props.modifyArguments(
      (selection.arguments || []).map((a) =>
        a === argSelection
          ? {
              ...a,
              value: value!,
            }
          : a
      ),
      { commit: options?.commit! }
    );
  };

  _setArgFields = (
    fields: ObjectFieldNode[],
    commit: boolean
  ): DocumentNode | null => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();

    if (!argSelection) {
      console.error("missing arg selection when setting arg value");
      return null;
    }

    // @ts-ignore
    return this.props.modifyArguments(
      (selection.arguments || []).map((a) =>
        a === argSelection
          ? {
              ...a,
              value: {
                kind: "ObjectValue",
                fields,
              },
            }
          : a
      ),
      { commit }
    );
  };

  render() {
    const { arg, parentField } = this.props;
    const argSelection = this._getArgSelection();

    return (
      <AbstractArgView
        argValue={argSelection ? argSelection.value : null}
        arg={arg}
        parentField={parentField}
        addArg={this._addArg}
        removeArg={this._removeArg}
        setArgFields={this._setArgFields}
        // @ts-ignore
        setArgValue={this._setArgValue}
        getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
        makeDefaultArg={this.props.makeDefaultArg}
        onRunOperation={this.props.onRunOperation}
        styleConfig={this.props.styleConfig}
        onCommit={this.props.onCommit}
        definition={this.props.definition}
      />
    );
  }
}
