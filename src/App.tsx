import * as React from "react";
import "./styles.css";
import { Info } from "./Info";
import { Slider } from "./Slider";

export interface SliderData {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  unit?: string;
}

interface State {
  sliders: SliderData[];
}

export default class App extends React.Component<{}, State> {
  
  constructor(props: any) {
    super(props);
    this.state = {
      sliders: [
        {
          label: "Label",
          max: 100,
          min: 0,
          step: 0,
          value: 67,
          unit: "%"
        },
        {
          label: "Label 2",
          max: 1,
          min: 0,
          step: 0,
          value: 0.33
        },
      ],
    };
  }

  handleSliderChange(id: number, value: number) {
    const sliders = this.state.sliders.slice();
    sliders[id].value = value;
    this.setState({sliders: sliders});
    //console.log(this.state.sliders);
  }

  render() {
    const sliderList = this.state.sliders.map((slider, index) =>
      <Slider
        key={index}
        label = {slider.label}
        max = {slider.max}
        min = {slider.min}
        step = {slider.step}
        value = {slider.value}
        unit = {slider.unit}
        onChange = {(value) => this.handleSliderChange(index, value)}
      />
    );

    return (
      <div className="App">
        <h1>Custom Control Slider Challenge</h1>
        <Info />
        <hr />

        <p>INTERACTIVE SLIDERS TO GO HERE</p>
        <div className="slider-group">
          {sliderList}
        </div>
      </div>
    );
  }
}
