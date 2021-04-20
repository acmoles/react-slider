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
    const setDragging = useCallback((data: boolean) => {
      draggingRef.current = data;
      _setDragging(data);
    }, [_setDragging]);

    // DOM Nodes
    const rangeRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);

    // Mutable state
    const offsetWrapper = useRef<number | undefined>(0);
    const offsetMouse = useRef(0);
    const prevOffsetHandle = useRef(-1);
    const wrapperRange = useRef<number | undefined>(0);

    // Respond to layout changes
    const reflow = () => {
      offsetWrapper.current = rangeRef?.current?.getBoundingClientRect().left;
      console.log("reflow offsetWrapper: ", offsetWrapper.current);
      wrapperRange.current = (rangeRef?.current?.clientWidth ?? 0) - (handleRef?.current?.offsetWidth ?? 0); 
      console.log("reflow wrapperRange: ", wrapperRange.current);
      updateOffsetFromValue();
    }
    
    // Moving the handle
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
      
      if (offset !== prevOffsetHandle.current) {
        setOffsetHandle(offset);
        prevOffsetHandle.current = offset;
      }
    }

    // Prop change sync
    useEffect(() => {
      updateOffsetFromValue();
    }, [value]); 

    useEffect(() => {
      reflow();
      //console.log("value change"); // TODO
      // Ensure incoming value is set to allowable value
      const allowableValue = GetAllowableValue(value, min, max, step);
      onChange(allowableValue);
    }, [min, max, step]); 


    const handleDragStart = (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      
      setDragging(true);
      offsetMouse.current = event.clientX - (handleRef?.current?.getBoundingClientRect().left ?? 0);
    };

    // In event handlers, useCallback ensures same function on each re-render
    const handleDrag = useCallback(
      (event: any) => {
        if (draggingRef.current) {
          event.preventDefault();
          const offset = event.clientX - (offsetWrapper.current ?? 0) - offsetMouse.current;
          setValueByOffset(offset);
        }
      },
      [setValueByOffset, updateOffsetFromValue, offsetWrapper, offsetMouse]
    );

    const handleDragEnd = useCallback(
      (event: any) => {
        if (draggingRef.current) {
          setDragging(false);
        }
      },
      [setDragging]
    );

    // window and document events
    useEffect(() => {
      function handleWindowChange() {
        reflow();
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

    }, []);

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
            aria-valuenow={Math.round(value * 100) / 100}
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

function GetOffsetByRatio(ratio: number, wrapperRange?: number) {
  return Math.round(ratio * (wrapperRange ?? 0));
}

function GetRatioByOffset(offset: number, wrapperRange?: number) {
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
