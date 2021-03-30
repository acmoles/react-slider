import React from "react";
import "./slider.css";
import { SliderData } from "./App"

interface SliderProps extends SliderData {
  onChange(value: number): void;
}

interface SliderState {
  offsetHandle: number;
}

export class Slider extends React.Component<SliderProps, SliderState> {

  valueNormalised: number;
  offsetWrapper: number;
  offsetMouse: number;
  prevOffsetHandle: number;
  dragging: boolean;
  stepRatios: number[];
  wrapperRange: number;

  scheduledAnimationFrame: any;
  rangeRef: any;
  handleRef: any;

  constructor(props: SliderProps) {
    super(props);
    this.state = {
      offsetHandle: 0
    }

    this.rangeRef = React.createRef();
    this.handleRef = React.createRef();

    this.valueNormalised = this.getNormalized(this.props.value);
    this.offsetWrapper = 0;
    this.offsetMouse = 0;
    this.prevOffsetHandle = -1;
    this.dragging = false;
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

  render() {
    // Some kind of formatting config in the future
    const valueFormatted = this.props.unit ? this.props.value.toFixed(0) + this.props.unit : this.props.value.toFixed(2);
    const maxFormattedStringLength = this.calculateMaxFormattedCharacters()

    const handleStyle = {
      transform: "translateX(" + this.state.offsetHandle + "px)",
      minWidth: maxFormattedStringLength + "em"
    }

    return (
      <div className="slider">
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
            {valueFormatted}
          </div>
        </div>
      </div>
    );
  }

  handleDragStart(event: any) {
    event.preventDefault();
    event.stopPropagation();

    console.log("drag start");

    // Start drag
    this.dragging = true;
    this.offsetWrapper = GetPosition(this.rangeRef.current);
    this.offsetMouse = event.clientX - GetPosition(this.handleRef.current);

    // TODO add active class
  }

  handleDragEnd(event: any) {
    if (!this.dragging) {
      return;
    }
    // Stop drag
    this.dragging = false;

    console.log("drag end");

    // TODO final stepped value to set? Better to snap as dragged...


    // TODO remove active class
  }

  handleDrag(event: any) {
    if (this.dragging) {
      event.preventDefault();
      //console.log("drag update");

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
      //this.getClosestStep(this.valueNormalised),
      this.valueNormalised
    );

    if (offset !== this.prevOffsetHandle) {
      this.setState({offsetHandle: offset})
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

    //TODO set to stepped value
    return allowable;
  }

  reflow() {
    this.offsetWrapper = GetPosition(this.rangeRef.current);
    this.wrapperRange = this.calculateRange();
    //this.valuePrecision = this.calculateValuePrecision();
    this.updateOffsetFromValue();
  }

  calculateRange() {
    return this.rangeRef.current.clientWidth - this.handleRef.current.offsetWidth;
  }

  getClosestStep(value: number) {
    var k = 0;
    var min = 1;
    for (var i = 0; i <= this.props.step - 1; i++) {
      if (Math.abs(this.stepRatios[i] - value) < min) {
        min = Math.abs(this.stepRatios[i] - value);
        k = i;
      }
    }
    return this.stepRatios[k];
  }

  calculateStepRatios() {
    // TODO step should update on prop change
    var stepRatios = [];
    if (this.props.step >= 1) {
      for (var i = 0; i <= this.props.step - 1; i++) {
        if (this.props.step > 1) {
          stepRatios[i] = i / (this.props.step - 1);
        } else {
          // A single step will always have a 0 value
          stepRatios[i] = 0;
        }
      }
    }
    return stepRatios;
  }

  calculateMaxFormattedCharacters() {
    // Improve with formatting config in the future
    const formattedValue = this.props.unit ? this.props.max.toFixed(0) + this.props.unit : this.props.max.toFixed(2);
    return formattedValue.length;
  }


}


// Helpers

function GetPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.left;
}
