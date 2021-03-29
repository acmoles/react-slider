import React from "react";
import "./slider.css";
import { SliderData } from "./App"

interface SliderProps extends SliderData {
  onChange(value: number): void;
}

interface SliderState {
  valueNormalised: number;
  dragging: boolean;
}

export class Slider extends React.Component<SliderProps, SliderState> {
  state: SliderState = {
    valueNormalised: 0,
    dragging: false
  };

  constructor(props: SliderProps) {
    super(props);
    // TODO init
  }

  componentDidMount() {
    //
  }

  render() {
    // Value display
    return (
      <div className="slider">
        <label onClick={() => this.props.onChange(Math.random())}>{ this.props.label }</label>
        <div className="range">
          <div className="handle">{"drag me" + (this.props.unit ? this.props.unit : "")}</div>
        </div>
      </div>
    );
  }
}
