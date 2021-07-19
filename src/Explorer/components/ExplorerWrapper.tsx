// @ts-nocheck
import React, { Props } from "react";
import { defaultValue } from "../utils";
import ErrorBoundary from "./ErrorBoundry";
import Explorer from "./Explorer";

export default class ExplorerWrapper extends React.PureComponent<
  Props<any>,
  {}
> {
  static defaultValue = defaultValue;
  static defaultProps = {
    width: 320,
    title: "Explorer",
  };

  render() {
    return (
      <div
        className="docExplorerWrap"
        style={{
          height: "100%",
          width: this.props.width,
          minWidth: this.props.width,
          zIndex: 7,
          display: this.props.explorerIsOpen ? "flex" : "none",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div className="doc-explorer-title-bar">
          <div className="doc-explorer-title">{this.props.title}</div>
          <div className="doc-explorer-rhs">
            <div
              className="docExplorerHide"
              onClick={this.props.onToggleExplorer}
            >
              {"\u2715"}
            </div>
          </div>
        </div>
        <div
          className="doc-explorer-contents"
          style={{
            padding: "0px",
            /* Unset overflowY since docExplorerWrap sets it and it'll
            cause two scrollbars (one for the container and one for the schema tree) */
            overflowY: "unset",
          }}
        >
          <ErrorBoundary>
            <Explorer {...this.props} />
          </ErrorBoundary>
        </div>
      </div>
    );
  }
}
