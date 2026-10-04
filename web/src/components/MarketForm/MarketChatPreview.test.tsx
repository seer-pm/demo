// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import MarketChatPreview from "./MarketChatPreview";
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
it("refines an editable draft, blocks incomplete review and never publishes", () => {
  render(<MarketChatPreview onManual={() => {}} />);
  expect(screen.getByText("AI preview · simulated")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Will Bitcoin reach/ }));
  fireEvent.click(screen.getByRole("button", { name: /Preview market/ }));
  expect(screen.getByRole("alert")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Deadline (23:59 UTC)"), { target: { value: "2099-12-31" } });
  fireEvent.change(screen.getByLabelText("Resolution source"), { target: { value: "Official exchange close" } });
  fireEvent.click(screen.getByRole("button", { name: /Refine resolution rules/ }));
  expect((screen.getByLabelText("Resolution rules") as HTMLTextAreaElement).value).toContain(
    "Official exchange close by 2099-12-31",
  );
  fireEvent.click(screen.getByRole("button", { name: /Preview market/ }));
  expect(screen.getByText("This is a preview card. Publishing is not connected.")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue editing" }));
  expect((screen.getByLabelText("Resolution source") as HTMLInputElement).value).toBe("Official exchange close");
});
it("leaves unsupported prompts honest and keeps draft contents intact", () => {
  const manual = vi.fn();
  render(<MarketChatPreview onManual={manual} />);
  fireEvent.click(screen.getByRole("button", { name: /Will Bitcoin reach/ }));
  fireEvent.change(screen.getByLabelText("Your market idea or refinement"), {
    target: { value: "Invent something entirely different" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send message" }));
  expect(screen.getByText(/Free-form AI refinement will be connected/)).toBeTruthy();
  expect((screen.getByLabelText("Market question") as HTMLTextAreaElement).value).toContain("Bitcoin");
  fireEvent.click(screen.getByRole("button", { name: /Use manual form/ }));
  expect(manual).toHaveBeenCalledOnce();
});
