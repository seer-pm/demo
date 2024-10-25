import { DehydratedState } from "@tanstack/react-query";

declare global {
  namespace Vike {
    interface PageContext {
      dehydratedState: DehydratedState;
      title?: string;
    }
  }
}
