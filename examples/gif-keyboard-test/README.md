
# Tutorial: Intro to Marko

This tutorial doesn't assume any existing Marko knowledge.

## Before We Start the Tutorial {#before-we-start-the-tutorial}

We will build a GIF Keyboard using the [GIPHY API](https://developers.giphy.com/docs/api#quick-start-guide) during this tutorial. While this tutorial will go over most features of Marko, the code may not follow the best coding practices for Marko projects. Nevertheless, the features and techniques in the tutorial are used to building any Marko Application and mastering them will give you a deep understanding of how Marko works.

> Tip:
>
>This tutorial is design for people who **learn by doing** or **learn by example.** To get overview of Marko and its syntax, you can check out the [reference](https://markojs.com/docs/reference-overview/) section and play around with some of the [examples](https://markojs.com/try-online/?file=%2Fmarko-color-picker%2Findex.marko&gist=) that we have.


The tutorial is divided into several sections:

* [Setup for the Tutorial](#setup-for-the-tutorial) will give you **a starting point** to follow the tutorial.
* [Overview](#overview) will teach you **the fundamentals** of Marko how Marko works.

### What Are We Building? {#what-are-we-building}

In this tutorial, we'll show how to build a GIF Keyboard with Marko using the GIPHY API.

You can see what we'll be building here: **[Final Result]()**. Don't worry if this doesn't make sense! The goal of this tutorial is to help you understand Marko and its syntax.

### Prerequisites {#prerequisites}

We will assume you have basic knowledge of HTML, CSS and JavaScript.

## Setup for the Tutorial {#setup-for-the-tutorial}

We recommend that you set up your Marko Project locally. Here are the steps to follow:

1. Make sure you have a recent version of [Node.js](https://nodejs.org/en/) installed.
2. Follow the [installation instructions for Marko cli](https://markojs.com/docs/installing/) to make a new project. Once installed, follow the steps:

```bash
npx @marko/create
***Type your project name*** > marko-giphy-keyboard
```

```bash
Choose a template …  Use ↑ and ↓. Return ⏎ to submit.
❯ Default starter app // Select this option
  Example from marko-js/examples
```

3. Access the project by going into the `marko-giphy-keyboard` folder and open the source code with your favorite editor. Then run the following commands to run the program:


```bash
cd marko-giphy-keyboard
npm run dev
```

Open `http://localhost:3000` in the browser, you see this following:

[Insert the marko start image here]

We recommend following [using a Marko Syntax Highlighting Editor plugin](hhttps://markojs.com/docs/editor-plugins/) for your editor.

### Help, I'm Stuck! {#help-im-stuck}

If you get stuck, check out our [StackOverFlow page](https://stackoverflow.com/questions/tagged/marko). You can also check out our [Marko Glitter Chat](https://gitter.im/marko-js/marko) and post your questions.

### Getting the GIPHY API Key

You will need to get an API Key from [GIPHY](https://giphy.com/) to fetch data from the GIPHY API. You can do so by following the [quickstart guide](https://developers.giphy.com/docs/api#quick-start-guide). For your convenience, we have include instructions below:

<details>

1. In the GIPHY quickstart guide, click on the `Create an App` button.

2. On the Dashboard page, click the `Create an App` button. In the dialog, select the `Select API` option.

3. For `Your App Name`, you can enter "Marko Sample GIF Keyboard" for the name of the application. For the description, you can write "For Marko based GIF keybard". Then select `Create App`.

4.
</details>

## Overview {#overview}
