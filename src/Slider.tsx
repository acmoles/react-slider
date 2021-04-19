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

export function Slider({
  label,
  max,
  min,
  step,
  value,
  unit,
  onChange,
}: SliderProps): ReactElement {

    // React state
    const [offsetHandle, setOffsetHandle] = useState(0);
    const [dragging, _setDragging] = useState(false);

    // event listeners don't have access to updated state, ref workaround
    const draggingRef = useRef(dragging);
    const setDragging = (data: boolean) => {
      draggingRef.current = data;
      _setDragging(data);
    };

    // DOM Nodes TODO
    const rangeRef = useCallback(node => {
      if (node !== null) {
        console.log("change range ref");
        
        // Update mutable state on change
        offsetWrapper.current = node.getBoundingClientRect().left;
        wrapperRange.current = node.clientWidth - handleWidth.current;
      }
    }, []);
    const handleRef = useCallback(node => {
      if (node !== null) {
        console.log("change handle ref");

        // Update mutable state on change
        handleWidth.current = node.offsetWidth;
      }
    }, []);

    // Mutable state
    const offsetWrapper = useRef(0);
    const offsetMouse = useRef(0);
    const prevOffsetHandle = useRef(-1);

    const handleWidth = useRef(0); // TODO ?
    const wrapperRange = useRef(0);
    
    const setValueByOffset = (offset: number) => {
      const ratio = GetRatioByOffset(offset, wrapperRange.current);
      let value = GetUnnormalized(ratio, min, max);
      value = GetAllowableValue(value, min, max, step);
      onChange(value);
    }
    
    const updateOffsetFromValue = () => {
      const valueAllowable = GetAllowableValue(value, min, max, step);
      const ratio = GetNormalized(valueAllowable, min, max);
      const offset = GetOffsetByRatio(ratio, wrapperRange.current);
      console.log("update outer");
      
      if (offset !== prevOffsetHandle.current) {
        console.log("update inner");
        setOffsetHandle(offset);
        prevOffsetHandle.current = offset;
      }
    }

    // Prop change sync TODO reflow and update?
    useEffect(() => {
      console.log("prop change");
      updateOffsetFromValue();
      // Ensure incoming value is set to allowable value
      const allowableValue = GetAllowableValue(value, min, max, step);
      onChange(allowableValue);
    }, [min, max, step]);

    const handleDragStart = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      
      console.log("drag start");
      setDragging(true);
      offsetMouse.current = event.clientX - offsetHandle;
    };

    // useCallback ensures same function on each re-render
    const handleDrag = useCallback(
      (event: any) => {
        if (draggingRef.current) {
          event.preventDefault();
          const offset = event.clientX - offsetWrapper.current - offsetMouse.current;
          setValueByOffset(offset);
          updateOffsetFromValue();
          //console.log("drag", event);
        }
      },
      [setOffsetHandle]
    );

    const handleDragEnd = useCallback(
      (event: any) => {
        if (draggingRef.current) {
          setDragging(false);
          console.log("drag end");
        }
      },
      [setDragging]
    );

    // window and document events
    useEffect(() => {
      function handleWindowChange() {
        console.log("window");
        //reflow(); TODO
      }

      // Add event listeners
      window.addEventListener("resize", handleWindowChange);
      document.addEventListener("pointermove", handleDrag);
      document.addEventListener("pointerup", handleDragEnd);
  
      // Remove event listener on cleanup
      return () => {
        console.log("cleanup");
        window.removeEventListener("resize", handleWindowChange);
        document.removeEventListener("pointermove", handleDrag);
        document.removeEventListener("pointerup", handleDragEnd);    
      };

    }, []); // Empty array ensures effect is only run on mount

    const formattedValue = unit ? value.toFixed(0) + unit : value.toFixed(2);
    const maxFormattedStringLength = CalculateMaxFormattedCharacters(min, max, unit);

    const handleStyle = {
      transform: "translateX(" + offsetHandle + "px)",
      minWidth: maxFormattedStringLength + "em"
    };

    const sliderClasses = ["slider"];
    if (dragging) {
      sliderClasses.push("active");
    }

    return (
      <div className={sliderClasses.join(" ")}>
        <label>{label}</label>
        <div className="range" ref={rangeRef}>
          <div
            className="handle"
            ref={handleRef}
            style={handleStyle}
            onPointerDown={
              (event) => {handleDragStart(event);}
            }
            role="slider"
            aria-valuemin={min}
            aria-valuenow={value}
            aria-valuemax={max}
            >
            {formattedValue}
          </div>
        </div>
      </div>
    );
}

// Helpers

function CalculateMaxFormattedCharacters(min: number, max: number, unit?: string) {
  const formattedValueMax = unit ? max.toFixed(0) + unit : max.toFixed(2);
  const formattedValueMin = unit ? min.toFixed(0) + unit : min.toFixed(2);
  return Math.max(formattedValueMax.length, formattedValueMin.length);
}

function GetOffsetByRatio(ratio: number, wrapperRange: number) {
  return Math.round(ratio * wrapperRange);
}

function GetRatioByOffset(offset: number, wrapperRange: number) {
  return wrapperRange ? offset / wrapperRange : 0;
}

function GetNormalized(value: number, min: number, max: number) {
  let normalized = (value - min) / (max - min);
  return normalized;
}

function GetUnnormalized(value: number, min: number, max: number) {
  let unnormalized = value * (max - min) + min;
  return unnormalized;
}

function GetAllowableValue(value: number, min: number, max: number, step?: number) {
  let allowable = value;
  allowable = Math.max(value, min);
  allowable = Math.min(allowable, max);

  if (step) {
    allowable = GetClosestStep(allowable, step);
  }

  return allowable;
}

function GetClosestStep(value: number, step: number) {
  return Math.round(value / step) * step; 
}
