import { fireEvent, render, screen } from "@marko/testing-library";

import type { ChatMessage } from "../../game/state";
import Template from "./index.marko";

const messages: ChatMessage[] = [
  { id: 1, tone: "game", text: "Welcome to RuneScape Classic." },
  { id: 2, tone: "skill", text: "You get some logs." },
];

test("sends what was typed and clears the box", async () => {
  const said: string[] = [];
  await render(Template, {
    messages,
    onSay: (text: string) => said.push(text),
  });

  expect(screen.getByText("You get some logs.")).toBeInTheDocument();

  const box = screen.getByLabelText("Say") as HTMLInputElement;
  await fireEvent.input(box, { target: { value: "hello Lumbridge" } });
  await fireEvent.submit(box.form!);

  expect(said).toEqual(["hello Lumbridge"]);
  expect(box.value).toBe("");
});

test("an empty message is not sent", async () => {
  const said: string[] = [];
  await render(Template, {
    messages,
    onSay: (text: string) => said.push(text),
  });

  const box = screen.getByLabelText("Say") as HTMLInputElement;
  await fireEvent.submit(box.form!);

  expect(said).toEqual([""]);
});
