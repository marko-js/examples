import { fireEvent, render, screen } from "@marko/testing-library";
import { composeStories } from "@storybook/marko";

import * as stories from "./stories";

const { Default, Double } = composeStories(stories);

test("Default", async () => {
  const onIncrement = vi.fn();
  await render(Default, { onIncrement });
  const $btn = screen.getByRole("button");

  expect($btn).toHaveTextContent("0");

  await fireEvent.click($btn);

  expect($btn).toHaveTextContent("1");
  expect(onIncrement).toHaveBeenCalled();
});

test("Double", async () => {
  const onIncrement = vi.fn();
  await render(Double, { onIncrement });
  const $btn = screen.getByRole("button");

  expect($btn).toHaveTextContent("0");

  await fireEvent.click($btn);

  expect($btn).toHaveTextContent("2");
  expect(onIncrement).toHaveBeenCalled();
});
