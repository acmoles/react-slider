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
  dragStartPosition: number;
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
    this.dragStartPosition = 0; // TODO Needed?
    this.dragging = false;
    this.stepRatios = this.calculateStepRatios(); 
    this.wrapperRange = 0; // Calculated in didMount hook
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowChange);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    this.reflow();
    this.layout();
    this.wrapperRange = this.calculateRange(); 
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowChange);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
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

    const handleStyle = {
      transform: 'translateX(' + this.state.offsetHandle + 'px)'
    }

    return (
      <div className="slider">
        <label onClick={() => this.handleSliderChange()}>{ this.props.label }</label>
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
            {"drag me: " + valueFormatted}
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
    this.setRangeOffset();

    this.dragStartPosition = event.clientX; // TODO Needed?
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

    // TODO final stepped value to set?


    // TODO remove active class
  }

  handleDrag(event: any) {
    if (this.dragging) {
      event.preventDefault();
      //console.log("drag update");

      this.scheduledAnimationFrame = requestAnimationFrame(() => {
        const offset = event.clientX - this.offsetWrapper - this.offsetMouse;
        this.setValueByOffset(offset);
        this.layout();
      })

    }
  }

  handleSliderChange() {
    const value = this.translateNormalized(Math.random());
    this.props.onChange(value);
  }

  layout() {
    this.updateOffsetFromValue();
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
      this.getRatioByOffset(offset, this.wrapperRange)
    );
    this.props.onChange(value);
  }

  updateOffsetFromValue() {
    this.valueNormalised = this.getNormalized(this.props.value);

    let offset = this.getOffsetByRatio(
      //this.getClosestStep(this.valueNormalised),
      this.valueNormalised,
      this.wrapperRange
    );

    if (offset !== this.prevOffsetHandle) {
      this.setState({offsetHandle: offset})
      this.prevOffsetHandle = offset;
    }
  }

  getOffsetByRatio(ratio: number, range: number) {
    return Math.round(ratio * range);
  }

  getRatioByOffset(offset: number, range: number) {
    return range ? offset / range : 0;
  }

  reflow() {
    this.setRangeOffset();
    this.wrapperRange = this.calculateRange();
    //this.valuePrecision = this.calculateValuePrecision();
    this.updateOffsetFromValue();
  }

  setRangeOffset() {
    // Needed to compensate for any horizontal scroll
    this.offsetWrapper = GetPosition(this.rangeRef.current);
  }

  calculateRange() {
    return this.rangeRef.current.offsetWidth - this.handleRef.current.offsetWidth;
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

// Helpers

function GetPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return rect.left;
}
