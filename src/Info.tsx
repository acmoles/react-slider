import React, { Fragment } from 'react';

export function Info() {
  return (
    <Fragment>
      <p>
        Create a React Typescript component to work as a <br />
        <strong>precision slider</strong> control with customisable
        <br />
        minimum, maximum and step value properties.
      </p>

      <ul>
        <li>
          It should be built <em>without</em> using the HTML input element or
          any additional third party libraries.
        </li>

        <li>
          It should have basic state management to store the control values.
        </li>

        <li>
          The component props interface should be:
          <br />
          <pre>
            {`interface Props {
  label: string
  max: number
  min: number
  step: number
  value: number
  unit?: string
  onChange(value: number): void
}`}
          </pre>
        </li>

        <li>
          Two sliders should be added to look like the image below:
          <br />
          0-100 % integer range, and <br />
          0-1 proportional control.
          <br />
          <img
            src="/sliders.png"
            width="340"
            height="140"
            alt="Slider mockup"
          />
        </li>

        <li>The little details count and pay attention to user experience</li>
        <li>
          Think about what additional features a production quality slider might
          also need
        </li>
      </ul>
    </Fragment>
  );
}
