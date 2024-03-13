import { Alert } from "./Alert";

export default {
  Alerts: (
    <div className="space-y-4 flex flex-col items-center p-10">
      <Alert type="info" title="Info">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Alert>
      <Alert type="success" title="Success">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Alert>
      <Alert type="warning" title="Warning">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Alert>
      <Alert type="error" title="Error">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </Alert>
    </div>
  ),
};
