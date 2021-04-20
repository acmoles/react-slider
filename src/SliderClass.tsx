import React, { ReactElement, useState, useEffect, useRef, useCallback } from "react";
import "./slider.css";

/*
Production TODOs
----------------

- Accessibility: keyboard support
- Something other than transitioning box-shadow for better better performance (like more dom elements fading in/out with opacity)
- Either all px or all em for styling rules
*/

export interface SliderData {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  unit?: string;
}

interface SliderProps extends SliderData {
  onChange(value: number): void;
}

interface SliderState {
  offsetHandle: number;
  dragging: boolean;
}

export class SliderClass extends React.Component<SliderProps, SliderState> {
  offsetWrapper: number;
  offsetMouse: number;
  prevOffsetHandle: number;
  wrapperRange: number;

  rangeRef: any;
  handleRef: any;

  constructor(props: SliderProps) {
    super(props);
    this.state = {
      offsetHandle: 0,
      dragging: false
    };

    this.rangeRef = React.createRef();
    this.handleRef = React.createRef();

    this.offsetWrapper = 0;
    this.offsetMouse = 0;
    this.prevOffsetHandle = -1;
    this.wrapperRange = 0; // Calculated in didMount hook reflow
  }

  componentDidMount() {
    window.addEventListener("resize", this.handleWindowChange);
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.handleMouseUp);
    this.reflow();
    this.updateOffsetFromValue();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowChange);
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.handleMouseUp);
  }

  handleWindowChange = () => {
    this.reflow();
  };

  handleMouseMove = (event: any) => {
    this.handleDrag(event);
  };

  handleMouseUp = (event: any) => {
    this.handleDragEnd(event);
  };

  componentDidUpdate(prevProps: SliderProps) {
    if (
      prevProps.min !== this.props.min ||
      prevProps.max !== this.props.max ||
      prevProps.step !== this.props.step
    ) {
      this.reflow();
      // Ensure incoming value is set to allowable value
      const value = this.getAllowableValue(this.props.value);
      this.props.onChange(value);
    }
  }

  render() {
    const formattedValue = this.props.unit
      ? this.props.value.toFixed(0) + this.props.unit
      : this.props.value.toFixed(2);
    const maxFormattedStringLength = CalculateMaxFormattedCharacters(this.props.min, this.props.max, this.props.unit);

    const handleStyle = {
      transform: "translateX(" + this.state.offsetHandle + "px)",
      minWidth: maxFormattedStringLength + "em"
    };

    const sliderClasses = ["slider"];
    if (this.state.dragging) {
      sliderClasses.push("active");
    }

    return (
      <div className={sliderClasses.join(" ")}>
        <label>{this.props.label}</label>
        <div className="range" ref={this.rangeRef}>
          <div
            className="handle"
            ref={this.handleRef}
            style={handleStyle}
            onMouseDown={
              (event) => {this.handleDragStart(event);}
            }
            role="slider"
            aria-valuemin={this.props.min}
            aria-valuenow={Math.round((this.props.value * 100) / 100)}
            aria-valuemax={this.props.max}
            >
            {formattedValue}
          </div>
        </div>
      </div>
    );
  }

  handleDragStart(event: any) {
    event.preventDefault();
    event.stopPropagation();

    this.setState({ dragging: true });
    this.offsetWrapper = GetPosition(this.rangeRef.current);
    this.offsetMouse = event.clientX - GetPosition(this.handleRef.current);
  }

  handleDragEnd(event: any) {
    if (!this.state.dragging) {
      return;
    }
    this.setState({ dragging: false });
  }

  handleDrag(event: any) {
    if (this.state.dragging) {
      event.preventDefault();
      const offset = event.clientX - this.offsetWrapper - this.offsetMouse;
      this.setValueByOffset(offset);
      this.updateOffsetFromValue();
    }
  }

  setValueByOffset(offset: number) {
    const ratio = this.getRatioByOffset(offset);
    let value = this.translateNormalized(ratio);
    value = this.getAllowableValue(value);
    this.props.onChange(value);
  }

  updateOffsetFromValue() {
    const valueAllowable = this.getAllowableValue(this.props.value);
    const ratio = this.getNormalized(valueAllowable);
    const offset = this.getOffsetByRatio(ratio);

    if (offset !== this.prevOffsetHandle) {
      this.setState({ offsetHandle: offset });
      this.prevOffsetHandle = offset;
    }
  }

  getOffsetByRatio(ratio: number) {
    return Math.round(ratio * this.wrapperRange);
  }

  getRatioByOffset(offset: number) {
    return this.wrapperRange ? offset / this.wrapperRange : 0;
  }

  getAllowableValue(value: number) {
    let allowable = value;
    allowable = Math.max(value, this.props.min);
    allowable = Math.min(allowable, this.props.max);

    if (this.props.step) {
      allowable = this.getClosestStep(allowable);
    }

    return allowable;
  }

  getNormalized(value: number) {
    let normalized =
      (value - this.props.min) / (this.props.max - this.props.min);
    return normalized;
  }

  translateNormalized(value: number) {
    let unnormalized =
      value * (this.props.max - this.props.min) + this.props.min;
    return unnormalized;
  }

  reflow() {
    this.offsetWrapper = GetPosition(this.rangeRef.current);
    this.wrapperRange = this.rangeRef.current.clientWidth - this.handleRef.current.offsetWidth;
    this.updateOffsetFromValue();
  }

  getClosestStep(value: number) {
    return Math.round(value / this.props.step) * this.props.step;
  }
}

// Helpers

function GetPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.left;
}

function CalculateMaxFormattedCharacters(min: number, max: number, unit?: string) {
  const formattedValueMax = unit ? max.toFixed(0) + unit : max.toFixed(2);
  const formattedValueMin = unit ? min.toFixed(0) + unit : min.toFixed(2);
  return Math.max(formattedValueMax.length, formattedValueMin.length);
}