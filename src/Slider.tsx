import React from "react";
import "./slider.css";
import { SliderData } from "./App"

/*
Production TODOs
----------------

- Handle native touch events
- Increase legacy browser compatibility e.g. event.clientX, prefix inline transform style, requestAnimationFrame, addEventListener

Nice to have's
--------------

- Click on slider range to set value
- Smooth snapping to steps
- Overdrag on start/end with snap back to first/last position
- Animate into position on external prop change
- Virtual precision greater than per-pixel?
*/

interface SliderProps extends SliderData {
  onChange(value: number): void;
}

interface SliderState {
  offsetHandle: number;
  dragging: boolean;
}

export class Slider extends React.Component<SliderProps, SliderState> {

  valueNormalised: number;
  offsetWrapper: number;
  offsetMouse: number;
  prevOffsetHandle: number;
  stepRatios: number[];
  wrapperRange: number;

  scheduledAnimationFrame: any;
  rangeRef: any;
  handleRef: any;

  constructor(props: SliderProps) {
    super(props);
    this.state = {
      offsetHandle: 0,
      dragging: false
    }

    this.rangeRef = React.createRef();
    this.handleRef = React.createRef();

    this.valueNormalised = this.getNormalized(this.props.value);
    this.offsetWrapper = 0;
    this.offsetMouse = 0;
    this.prevOffsetHandle = -1;
    this.stepRatios = this.calculateStepRatios(); 
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
    cancelAnimationFrame(this.scheduledAnimationFrame);
  }

  handleWindowChange = () => {
    this.reflow();
  }

  handleMouseMove = (event: any) => {
    this.handleDrag(event);
  }

  handleMouseUp = (event: any) => {
    this.handleDragEnd(event)
  }

  componentDidUpdate(prevProps: SliderProps) {
    if (
      prevProps.min !== this.props.min ||
      prevProps.max !== this.props.max
    ) {
      this.reflow();
      this.setValue(this.getNormalized(this.props.value));
    }

    if (prevProps.step !== this.props.step) {
      this.calculateStepRatios();
    }
  }

  render() {
    // Some kind of formatting config in the future
    const formattedValue = this.props.unit ? this.props.value.toFixed(0) + this.props.unit : this.props.value.toFixed(2);
    const maxFormattedStringLength = this.calculateMaxFormattedCharacters();

    const handleStyle = {
      transform: "translateX(" + this.state.offsetHandle + "px)",
      minWidth: maxFormattedStringLength + "em"
    }

    const sliderClasses = ["slider"];
    if (this.state.dragging) {
      sliderClasses.push("active");
    }

    return (
      <div className={sliderClasses.join(" ")}>
        <label>{ this.props.label }</label>
        <div className="range" ref={this.rangeRef}>
          <div
            className="handle"
            ref={this.handleRef}
            style={handleStyle}
          >
            <div 
              className="hitbox"
              onMouseDown={(event) => {this.handleDragStart(event)}}
            ></div>
            {formattedValue}
          </div>
        </div>
      </div>
    );
  }

  handleDragStart(event: any) {
    event.preventDefault();
    event.stopPropagation();

    // Start drag
    this.setState({dragging: true});
    this.offsetWrapper = GetPosition(this.rangeRef.current);
    this.offsetMouse = event.clientX - GetPosition(this.handleRef.current);
  }

  handleDragEnd(event: any) {
    if (!this.state.dragging) {
      return;
    }
    // Stop drag
    this.setState({dragging: false});
  }

  handleDrag(event: any) {
    if (this.state.dragging) {
      event.preventDefault();

      this.scheduledAnimationFrame = requestAnimationFrame(() => {
        const offset = event.clientX - this.offsetWrapper - this.offsetMouse;
        this.setValueByOffset(offset);
        this.updateOffsetFromValue();
      })
    }
  }

  getNormalized( value: number ) {
    let normalized = (value - this.props.min) / (this.props.max - this.props.min);
    return normalized
  }

  translateNormalized( value: number ) {
    let unnormalized = value * (this.props.max - this.props.min) + this.props.min;
    return unnormalized
  }

  setValue(valueToSet: number) {
    const value = this.translateNormalized(
      this.getAllowableValue(
        valueToSet
      )
    );
    this.props.onChange(value);
  }

  setValueByOffset(offset: number) {
    const value = this.translateNormalized(
      this.getAllowableValue(
        this.getRatioByOffset(offset)
      )
    );
    this.props.onChange(value);
  }

  updateOffsetFromValue() {
    this.valueNormalised = this.getNormalized(this.props.value);

    let offset = this.getOffsetByRatio(
      this.getAllowableValue(
        //this.getClosestStep(this.valueNormalised),
        this.valueNormalised
      )
    );

    if (offset !== this.prevOffsetHandle) {
      this.setState({offsetHandle: offset});
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
    allowable = Math.max(value, 0);
    allowable = Math.min(allowable, 1);

    if (this.props.step > 1) {
      allowable = this.getClosestStep(allowable);
    }

    return allowable;
  }

  reflow() {
    this.offsetWrapper = GetPosition(this.rangeRef.current);
    this.wrapperRange = this.rangeRef.current.clientWidth - this.handleRef.current.offsetWidth;
    this.updateOffsetFromValue();
  }

  getClosestStep(value: number) {
    var stepIndex = 0;
    var min = 1;
    for (var i = 0; i <= this.props.step - 1; i++) {
      if (Math.abs(this.stepRatios[i] - value) < min) {
        min = Math.abs(this.stepRatios[i] - value);
        stepIndex = i;
      }
    }
    return this.stepRatios[stepIndex];
  }

  calculateStepRatios() {
    var stepRatios = [];
    if (this.props.step >= 1) {
      for (var i = 0; i <= this.props.step - 1; i++) {
        if (this.props.step > 1) {
          stepRatios[i] = i / (this.props.step - 1);
        } else {
          // Say, a single step will always have a 0 value
          stepRatios[i] = 0;
        }
      }
    }
    return stepRatios;
  }

  calculateMaxFormattedCharacters() {
    const formattedValueMax = this.props.unit ? this.props.max.toFixed(0) + this.props.unit : this.props.max.toFixed(2);
    const formattedValueMin = this.props.unit ? this.props.min.toFixed(0) + this.props.unit : this.props.min.toFixed(2);
    return Math.max(formattedValueMax.length, formattedValueMin.length);
  }

}


// Helpers

function GetPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.left;
}
