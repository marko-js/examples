import { fireEvent, render, screen } from "@marko/testing-library";

import type { ChatMessage } from "../../game/state";
import Template from "./index.marko";

const messages: ChatMessage[] = [
  { id: 1, tone: "game", text: "Welcome to RuneScape Classic." },
  { id: 2, tone: "skill", text: "You get some logs." },
  { id: 3, tone: "combat", text: "You have defeated the goblin." },
  { id: 4, tone: "quest", text: "You have reached Woodcut level 15!" },
  { id: 5, tone: "chat", text: "Guest: hello world" },
];

test("sends what was typed and clears the box", async () => {
  const said: string[] = [];
  await render(Template, {
    messages,
    open: true,
    onSay: (text: string) => said.push(text),
  });

  expect(screen.getByText("You get some logs.")).toBeInTheDocument();

  const box = screen.getByLabelText("Say") as HTMLInputElement;
  await fireEvent.input(box, { target: { value: "hello Lumbridge" } });
  await fireEvent.submit(box.form!);

  expect(said).toEqual(["hello Lumbridge"]);
  expect(box.value).toBe("");
});

test("collapsed it shows only the last few lines and no input", async () => {
  await render(Template, { messages, open: false, onSay: () => {} });

  expect(screen.queryByLabelText("Say")).toBeNull();
  expect(screen.queryByText("Welcome to RuneScape Classic.")).toBeNull();
  expect(screen.getByText("Guest: hello world")).toBeInTheDocument();
});
