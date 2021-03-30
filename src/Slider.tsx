import React from "react";
import "./slider.css";
import { SliderData } from "./App"

interface SliderProps extends SliderData {
  onChange(value: number): void;
}

interface SliderState {
  valueNormalised: {
    previous: number;
    current: number;
    target: number;
  }
  offset: {
    wrapper: number;
    mouse: number;
    previous: number;
    current: number;
    target: number;
  }
  dragStartPosition: number;
  active: boolean;
  dragging: boolean;
  stepRatios: number[];
}

export class Slider extends React.Component<SliderProps, SliderState> {

  scheduledAnimationFrame: any;
  rangeRef: any;
  handleRef: any;

  constructor(props: SliderProps) {
    super(props);
    this.state = {
      valueNormalised: {
        previous: -1,
        current: this.getNormalized(this.props.value),
        target: this.getNormalized(this.props.value)
      },
      offset: {
        wrapper: 0,
        mouse: 0,
        previous: -1,
        current: 0,
        target: 0
      },
      dragStartPosition: 0,
      active: false,
      dragging: false,
      stepRatios: this.calculateStepRatios()
    }

    this.rangeRef = React.createRef();
    this.handleRef = React.createRef();
    
  }

  componentDidMount() {
    //
  }

  render() {
    const valueFormatted = this.props.unit ? this.props.value.toFixed(0) + this.props.unit : this.props.value.toFixed(2);

    return (
      <div className="slider">
        <label onClick={() => this.handleSliderChange()}>{ this.props.label }</label>
        <div className="range" ref={this.rangeRef}>
          <div 
            className="handle"
            ref={this.handleRef}
            draggable="true"
            onDragStart={this.handleDragStart}
            onDragEnd={this.handleDragEnd}
            onDrag={this.handleDrag}
          >
            {"drag me: " + valueFormatted}
          </div>
        </div>
      </div>
    );
  }

  handleDragEnd() {
    
  }

  handleDragStart() {

  }

  handleDrag() {

  }

  handleSliderChange() {
    const value = this.translateNormalized(Math.random());
    this.props.onChange(value);
  }

  getNormalized( value: number ) {
    let normalized = (value - this.props.min) / (this.props.max - this.props.min);
    return normalized
  }

  translateNormalized( value: number ) {
    let unnormalized = value * (this.props.max - this.props.min) + this.props.min;
    return unnormalized
  }

  calculateStepRatios() {
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


}
