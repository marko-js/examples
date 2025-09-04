import { fireEvent, render, screen } from "@marko/testing-library";
import { composeStories } from "@storybook/marko";

import * as stories from "./stories";

const { Default, Double } = composeStories(stories);

test("Default", async () => {
  const { emitted } = await render(Default);
  const $btn = screen.getByRole("button");

  expect($btn).toHaveTextContent("0");

  await fireEvent.click($btn);

  expect($btn).toHaveTextContent("1");
  expect(emitted("increment")).toHaveLength(1);
});

test("Double", async () => {
  const { emitted } = await render(Double);
  const $btn = screen.getByRole("button");

  expect($btn).toHaveTextContent("0");

  await fireEvent.click($btn);

  expect($btn).toHaveTextContent("2");
  expect(emitted("increment")).toHaveLength(1);
});
