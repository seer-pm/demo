import Button from "./Button";

export default {
  Buttons: (
    <div className="space-y-4 flex flex-col items-center pt-10">
      <Button variant="primary" size="large" text="Button" />
      <Button variant="primary" size="large" disabled text="Button" />
      <Button variant="primary" size="small" text="Button" />
      <Button variant="secondary" size="large" text="Button" />
      <Button variant="secondary" size="large" disabled text="Button" />
      <Button variant="secondary" size="small" text="Button" />
      <Button variant="tertiary" size="large" text="Button" />
      <Button variant="tertiary" size="large" disabled text="Button" />
      <Button variant="tertiary" size="small" text="Button" />
    </div>
  ),
};
