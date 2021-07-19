// @ts-nocheck
import {
  isInputObjectType,
  isLeafType,
  VariableDefinitionNode,
  ValueNode,
  ObjectFieldNode,
} from "graphql";
import React from "react";
import { InputArgViewProps } from "../types";
import {
  unwrapInputType,
  coerceArgValue,
  defaultInputObjectFields,
} from "../utils";
import AbstractArgView from "./AbstractArgView";

export default class InputArgView extends React.PureComponent<
  InputArgViewProps,
  {}
> {
  _previousArgSelection?: ObjectFieldNode;
  _getArgSelection = () => {
    return this.props.selection.fields.find(
      (field) => field.name.value === this.props.arg.name
    );
  };

  _removeArg = () => {
    const { selection } = this.props;
    const argSelection = this._getArgSelection();
    this._previousArgSelection = argSelection;
    this.props.modifyFields(
      selection.fields.filter((field) => field !== argSelection),
      true
    );
  };

  _addArg = () => {
    const {
      selection,
      arg,
      getDefaultScalarArgValue,
      parentField,
      makeDefaultArg,
    } = this.props;
    const argType = unwrapInputType(arg.type);

    let argSelection: ObjectFieldNode | null = null;
    if (this._previousArgSelection) {
      argSelection = this._previousArgSelection;
    } else if (isInputObjectType(argType)) {
      const fields = argType.getFields();
      argSelection = {
        kind: "ObjectField",
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
        kind: "ObjectField",
        name: { kind: "Name", value: arg.name },
        value: getDefaultScalarArgValue(parentField, arg, argType),
      };
    }

    if (!argSelection) {
      console.error("Unable to add arg for argType", argType);
    } else {
      return this.props.modifyFields(
        [...(selection.fields || []), argSelection],
        true
      );
    }
  };

  _setArgValue = (event: any, options?: { commit: boolean }) => {
    let settingToNull = false;
    let settingToVariable = false;
    let settingToLiteralValue = false;
    try {
      if (event.kind === "VariableDefinition") {
        settingToVariable = true;
      } else if (event === null || typeof event === "undefined") {
        settingToNull = true;
      } else if (typeof event.kind === "string") {
        settingToLiteralValue = true;
      }
    } catch (e) {}

    const { selection } = this.props;

    const argSelection = this._getArgSelection();

    if (!argSelection) {
      console.error("missing arg selection when setting arg value");
      return;
    }
    const argType = unwrapInputType(this.props.arg.type);

    const handleable =
      isLeafType(argType) ||
      settingToVariable ||
      settingToNull ||
      settingToLiteralValue;

    if (!handleable) {
      console.warn(
        "Unable to handle non leaf types in InputArgView.setArgValue",
        event
      );
      return;
    }
    let targetValue: string | VariableDefinitionNode;
    let value: ValueNode | null;

    if (event === null || typeof event === "undefined") {
      value = null;
    } else if (
      !event.target &&
      !!event.kind &&
      event.kind === "VariableDefinition"
    ) {
      targetValue = event;
      value = (targetValue as VariableDefinitionNode).variable;
    } else if (typeof event.kind === "string") {
      value = event;
    } else if (event.target && typeof event.target.value === "string") {
      targetValue = event.target.value;
      value = coerceArgValue(argType, targetValue);
    }

    const newDoc = this.props.modifyFields(
      (selection.fields || []).map((field) => {
        const isTarget = field === argSelection;
        const newField = isTarget
          ? {
              ...field,
              value: value,
            }
          : field;

        return newField;
      }) as ObjectFieldNode[],
      options?.commit
    );

    return newDoc;
  };

  _modifyChildFields = (fields: ObjectFieldNode[]) => {
    return this.props.modifyFields(
      this.props.selection.fields.map((field) =>
        field.name.value === this.props.arg.name
          ? {
              ...field,
              value: {
                kind: "ObjectValue",
                fields: fields,
              },
            }
          : field
      ),
      true
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
        setArgFields={this._modifyChildFields}
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
