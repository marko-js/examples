import { render, screen } from "@marko/testing-library";
import { composeStories } from "@storybook/marko";
import * as stories from "./stories";

for (const [name, story] of Object.entries(composeStories(stories))) {
  test(name, async () => {
    await render(story);
    expect(screen.getByRole("button").outerHTML).toMatchSnapshot();
  });
}
