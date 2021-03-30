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
  dragStartPosition: number;
  active: boolean;
  dragging: boolean;
  stepRatios: number[];
  wrapperRange: number;

  scheduledAnimationFrame: any;
  rangeRef: any;
  handleRef: any;

  constructor(props: SliderProps) {
    super(props);
    this.state = {
      offsetHandle: this.getNormalized(this.props.value) // TODO, not current value but current calculated offset
    }

    this.rangeRef = React.createRef();
    this.handleRef = React.createRef();

    this.valueNormalised = this.getNormalized(this.props.value);
    this.offsetWrapper = 0;
    this.offsetMouse = 0;
    this.dragStartPosition = 0;
    this.active = false;
    this.dragging = false;
    this.stepRatios = this.calculateStepRatios(); 
    this.wrapperRange = 0; // Calculated in didMount hook
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowChange);
    this.animate(true);
    this.scheduledAnimationFrame = requestAnimationFrame(() => {
      this.animate();
    })
    this.wrapperRange = this.calculateRange(); 
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowChange);
    cancelAnimationFrame(this.scheduledAnimationFrame);
  }

  handleWindowChange = () => {
    this.reflow();
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
            onMouseDown={this.handleDragStart}
            onMouseUp={this.handleDragEnd}
            onMouseMove={this.handleDrag}
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

  animate(first?: boolean) {
    if (this.dragging) {
      // set target value
    }


    this.scheduledAnimationFrame = requestAnimationFrame(() => {
      this.animate();
    })
  }

  getNormalized( value: number ) {
    let normalized = (value - this.props.min) / (this.props.max - this.props.min);
    return normalized
  }

  translateNormalized( value: number ) {
    let unnormalized = value * (this.props.max - this.props.min) + this.props.min;
    return unnormalized
  }

  updateOffsetFromValue() {

  }

  reflow() {
    this.setRangeOffset();
    this.wrapperRange = this.calculateRange();
    //this.valuePrecision = this.calculateValuePrecision();
    this.updateOffsetFromValue();
  }

  setRangeOffset() {

  }

  calculateRange() {
    return this.rangeRef.current.offsetWidth - this.handleRef.current.offsetWidth;
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
