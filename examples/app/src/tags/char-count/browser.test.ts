import { fireEvent, render, screen } from "@marko/testing-library";
import { composeStories } from "@storybook/marko";

import * as stories from "./stories";

const { Default } = composeStories(stories);

test("counts remaining characters as you type", async () => {
  await render(Default);
  const $input = screen.getByRole("textbox");

  expect(screen.getByText(/characters left/)).toHaveTextContent(
    "50 characters left",
  );

  await fireEvent.input($input, { target: { value: "hello" } });

  expect(screen.getByText(/characters left/)).toHaveTextContent(
    "45 characters left",
  );
});
