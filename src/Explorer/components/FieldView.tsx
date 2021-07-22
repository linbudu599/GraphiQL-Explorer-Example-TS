import {
  SelectionNode,
  FieldNode,
  SelectionSetNode,
  getNamedType,
  isObjectType,
  ArgumentNode,
  DocumentNode,
  isInterfaceType,
  isUnionType,
  FragmentDefinitionNode,
  GraphQLFieldMap,
} from "graphql";
import React from "react";
import { FieldViewProps, Selections } from "../types";
import { defaultArgs, unwrapOutputType } from "../utils";
import AbstractView from "./AbstractView";
import ArgView from "./ArgView";
import FragmentView from "./FragmentView";
import {
  Arrow,
  CheckBoxComp,
  NODE_STYLES,
  getApplicableFragments,
} from "./refactor/FieldView";

export default class FieldView extends React.PureComponent<
  FieldViewProps,
  { displayFieldActions: boolean }
> {
  state = { displayFieldActions: false };

  _previousSelection?: SelectionNode;

  _addAllFieldsToSelections = (
    rawSubfields: GraphQLFieldMap<any, any> | false
  ) => {
    const subFields: Array<FieldNode> = !!rawSubfields
      ? Object.keys(rawSubfields).map((fieldName) => {
          return {
            kind: "Field",
            name: { kind: "Name", value: fieldName },
            arguments: [],
          };
        })
      : [];

    const subSelectionSet: SelectionSetNode = {
      kind: "SelectionSet",
      selections: subFields,
    };

    const nextSelections: SelectionNode[] = [
      ...this.props.selections.filter((selection) => {
        if (selection.kind === "InlineFragment") {
          return true;
        } else {
          // Remove the current selection set for the target field
          return selection.name.value !== this.props.field.name;
        }
      }),
      {
        kind: "Field",
        name: { kind: "Name", value: this.props.field.name },
        arguments: defaultArgs(
          this.props.getDefaultScalarArgValue,
          this.props.makeDefaultArg,
          this.props.field
        ),
        selectionSet: subSelectionSet,
      },
    ];

    this.props.modifySelections(nextSelections);
  };

  _addFieldToSelections = (rawSubfields: GraphQLFieldMap<any, any> | false) => {
    const nextSelections = [
      ...this.props.selections,
      this._previousSelection || {
        kind: "Field",
        name: { kind: "Name", value: this.props.field.name },
        arguments: defaultArgs(
          this.props.getDefaultScalarArgValue,
          this.props.makeDefaultArg,
          this.props.field
        ),
      },
    ];

    this.props.modifySelections(nextSelections);
  };

  _handleUpdateSelections = (event: React.MouseEvent<HTMLSpanElement>) => {
    const selection = this._getSelection();
    if (selection && !event.altKey) {
      this._removeFieldFromSelections();
    } else {
      const fieldType = getNamedType(this.props.field.type);
      const rawSubfields = isObjectType(fieldType) && fieldType.getFields();

      const shouldSelectAllSubfields = !!rawSubfields && event.altKey;

      shouldSelectAllSubfields
        ? this._addAllFieldsToSelections(rawSubfields)
        : this._addFieldToSelections(rawSubfields);
    }
  };

  _removeFieldFromSelections = () => {
    const previousSelection = this._getSelection();
    this._previousSelection = previousSelection!;
    this.props.modifySelections(
      this.props.selections.filter(
        (selection) => selection !== previousSelection
      )
    );
  };

  _getSelection = (): FieldNode | null => {
    // console.log(this.props.field);
    // SelectionNode  包含 FieldNode | FragmentSpreadNode | InlineFragmentNode;
    // 这里需要的是拿到FieldNode，
    // selection：当前被选择的字段 在这里拿到与 this.props.field.name 对应的
    const selection = this.props.selections.find((selection) => {
      return (
        selection.kind === "Field" &&
        this.props.field.name === selection.name.value
      );
    });
    if (!selection) {
      return null;
    }
    if (selection.kind === "Field") {
      return selection;
    }

    return null;
  };

  _setArguments = (
    argumentNodes: Array<ArgumentNode>,
    options?: { commit: boolean }
  ): DocumentNode | null | undefined | void => {
    const selection = this._getSelection();
    if (!selection) {
      console.error("Missing selection when setting arguments", argumentNodes);
      return null;
    }
    return this.props.modifySelections(
      this.props.selections.map((s) =>
        s === selection
          ? {
              alias: selection.alias,
              arguments: argumentNodes,
              directives: selection.directives,
              kind: "Field",
              name: selection.name,
              selectionSet: selection.selectionSet,
            }
          : s
      ),
      options
    );
  };

  _modifyChildSelections = (
    selections: SelectionNode[],
    options?: { commit: boolean }
  ): DocumentNode | null => {
    // 实际上是把子集拿出来给modifySelections做修饰？
    return this.props.modifySelections(
      this.props.selections.map((selection) => {
        if (
          selection.kind === "Field" &&
          this.props.field.name === selection.name.value
        ) {
          if (selection.kind !== "Field") {
            throw new Error("invalid selection");
          }
          return {
            alias: selection.alias,
            arguments: selection.arguments,
            directives: selection.directives,
            kind: "Field",
            name: selection.name,
            selectionSet: {
              kind: "SelectionSet",
              selections,
            },
          };
        }
        return selection;
      }),
      options
    ) as any;
  };

  render() {
    const { field, schema, getDefaultFieldNames, styleConfig } = this.props;
    // console.log("field: ", field.type);
    // 被勾选的字段
    const selection = this._getSelection();
    // GraphQLNonNull {ofType: GraphQLObjectType1}
    // 👇🏻
    // GraphQLObjectType1
    const type = unwrapOutputType(field.type);
    // 当前字段接受的查询参数
    const args = field.args.sort((a, b) => a.name.localeCompare(b.name));
    let className = `graphiql-explorer-node graphiql-explorer-${field.name}`;

    if (field.isDeprecated) {
      className += " graphiql-explorer-deprecated";
    }

    const applicableFragments = getApplicableFragments(
      this.props.availableFragments,
      type
    ) as unknown as FragmentDefinitionNode[];

    const node = (
      <div className={className}>
        <span
          title={field.description || ""}
          style={NODE_STYLES}
          data-field-name={field.name}
          data-field-type={type.name}
          onClick={this._handleUpdateSelections}
          onMouseEnter={() => {
            // 只有在含有可用的子集时，才显示
            // 这个动作按钮的触发将会将当前的有效子集单独作为一个新的fragment（fragment onType为当前的字段），并
            const containsMeaningfulSubselection =
              isObjectType(type) &&
              selection &&
              selection.selectionSet &&
              selection.selectionSet.selections.filter(
                (selection) => selection.kind !== "FragmentSpread"
              ).length > 0;

            console.log(
              "containsMeaningfulSubselection: ",
              containsMeaningfulSubselection
            );

            if (containsMeaningfulSubselection) {
              this.setState({ displayFieldActions: true });
            }
          }}
          onMouseLeave={() => this.setState({ displayFieldActions: false })}
        >
          <Arrow
            type={type}
            styleConfig={this.props.styleConfig}
            selection={selection}
          />
          <CheckBoxComp
            type={type}
            styleConfig={this.props.styleConfig}
            selection={selection}
          />
          <span
            style={{ color: styleConfig.colors.property }}
            className="graphiql-explorer-field-view"
          >
            {field.name}
          </span>
          {!this.state.displayFieldActions ? null : (
            <button
              type="submit"
              className="toolbar-button"
              title="Extract selections into a new reusable fragment"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                // 1. Create a fragment spread node
                // 2. Copy selections from this object to fragment
                // 3. Replace selections in this object with fragment spread
                // 4. Add fragment to document
                const typeName = type.name;
                // NpmPackageDownloadPeriodData 这种应该是预先定义好的， 不是拼接的
                let newFragmentName = `${typeName}Fragment`;

                // 查看是否已经有重名的
                const conflictingNameCount = (applicableFragments || []).filter(
                  (fragment) => fragment.name.value.startsWith(newFragmentName)
                ).length;

                if (conflictingNameCount > 0) {
                  newFragmentName = `${newFragmentName}${conflictingNameCount}`;
                }

                const childSelections = selection
                  ? selection.selectionSet
                    ? selection.selectionSet.selections
                    : []
                  : [];

                // const childSelections =
                //   selection?.selectionSet?.selections ?? [];

                // 替换原本query中的子集展开
                const nextSelections = [
                  {
                    kind: "FragmentSpread",
                    name: {
                      kind: "Name",
                      value: newFragmentName,
                    },
                    directives: [],
                  },
                ];

                // 新插入到explorer中的
                const newFragmentDefinition: FragmentDefinitionNode = {
                  kind: "FragmentDefinition",
                  name: {
                    kind: "Name",
                    value: newFragmentName,
                  },
                  typeCondition: {
                    kind: "NamedType",
                    name: {
                      kind: "Name",
                      value: type.name,
                    },
                  },
                  directives: [],
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: childSelections,
                  },
                };

                // commit是控制修改后是否提交查询语句？
                // 获取修改完毕的
                const newDoc = this._modifyChildSelections(
                  nextSelections as SelectionNode[],
                  { commit: false }
                );

                if (newDoc) {
                  // 修改完毕
                  const newDocWithFragment: DocumentNode = {
                    ...newDoc,
                    definitions: [...newDoc.definitions, newFragmentDefinition],
                  };

                  // 在最顶层的onCommit方法接手解析完毕的doc node，转换为plain string
                  // 再交给onEdit方法来更新当前面板中的query
                  this.props.onCommit(newDocWithFragment);
                } else {
                  console.warn("Unable to complete extractFragment operation");
                }
              }}
              style={{
                ...styleConfig.styles.actionButtonStyle,
              }}
            >
              <span>{"…"}</span>
            </button>
          )}
        </span>
        {selection && args.length ? (
          <div
            style={{ marginLeft: 16 }}
            className="graphiql-explorer-graphql-arguments"
          >
            {args.map((arg) => (
              <ArgView
                key={arg.name}
                parentField={field}
                arg={arg}
                selection={selection}
                modifyArguments={this._setArguments}
                getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                makeDefaultArg={this.props.makeDefaultArg!}
                onRunOperation={this.props.onRunOperation}
                styleConfig={this.props.styleConfig}
                onCommit={this.props.onCommit}
                definition={this.props.definition}
              />
            ))}
          </div>
        ) : null}
      </div>
    );

    if (
      selection &&
      (isObjectType(type) || isInterfaceType(type) || isUnionType(type))
    ) {
      const fields = isUnionType(type) ? {} : type.getFields();
      const childSelections = (
        selection
          ? selection.selectionSet
            ? selection.selectionSet.selections
            : []
          : []
      ) as SelectionNode[];
      return (
        <div className={`graphiql-explorer-${field.name}`}>
          {node}
          <div style={{ marginLeft: 16 }}>
            {!!applicableFragments
              ? (
                  applicableFragments as unknown as FragmentDefinitionNode[]
                ).map((fragment) => {
                  const type = schema.getType(
                    fragment.typeCondition.name.value
                  );
                  const fragmentName = fragment.name.value;
                  return !type ? null : (
                    <FragmentView
                      key={fragmentName}
                      fragment={fragment}
                      selections={childSelections}
                      modifySelections={this._modifyChildSelections}
                      schema={schema}
                      styleConfig={this.props.styleConfig}
                      onCommit={this.props.onCommit}
                    />
                  );
                })
              : null}
            {Object.keys(fields)
              .sort()
              .map((fieldName) => (
                <FieldView
                  key={fieldName}
                  field={fields[fieldName]}
                  selections={childSelections}
                  modifySelections={this._modifyChildSelections}
                  schema={schema}
                  getDefaultFieldNames={getDefaultFieldNames}
                  getDefaultScalarArgValue={this.props.getDefaultScalarArgValue}
                  makeDefaultArg={this.props.makeDefaultArg}
                  onRunOperation={this.props.onRunOperation}
                  styleConfig={this.props.styleConfig}
                  onCommit={this.props.onCommit}
                  definition={this.props.definition}
                  availableFragments={this.props.availableFragments}
                />
              ))}
            {isInterfaceType(type) || isUnionType(type)
              ? schema
                  .getPossibleTypes(type)
                  .map((type) => (
                    <AbstractView
                      key={type.name}
                      implementingType={type}
                      selections={childSelections}
                      modifySelections={this._modifyChildSelections}
                      schema={schema}
                      getDefaultFieldNames={getDefaultFieldNames}
                      getDefaultScalarArgValue={
                        this.props.getDefaultScalarArgValue
                      }
                      makeDefaultArg={this.props.makeDefaultArg}
                      onRunOperation={this.props.onRunOperation}
                      styleConfig={this.props.styleConfig}
                      onCommit={this.props.onCommit}
                      definition={this.props.definition}
                    />
                  ))
              : null}
          </div>
        </div>
      );
    }
    return node;
  }
}
