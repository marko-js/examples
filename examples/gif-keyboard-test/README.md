
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

4. Get your API key! It should be a randomly generated string. Be sure to save that string somewhere safe as you will need it later.
</details>

## Overview of Marko {#overview}

Before we dive right into building, let's talk get an overview of how Marko works.

### What is Marko?

Marko is a high-performing, efficient Front End library for building user interface components without much boilerplate. Marko is heabily optimized for fast rendering that easily scales, easily maintainable and easily writable. If you know HTML, CSS and JavaScript, you will feel right at home with Marko.

Lets do an overview of Marko using an example. Example from [Marko Counter Example](https://markojs.com/try-online/?file=%2Fgist%2Fcomponents%2Fcounter%2Fstyle.css&gist=8fe46bc5866605aca0dfeec202604011). You also can view a portion of this example by clicking down on the dropdown below.

<details>

```js
class {
  onCreate() {
    this.state = { count: 0 };
  }
  increment(delta) {
    this.state.count += delta;
  }
}

$ var count = state.count;

<div.click-count>
  <div.count class={
      positive: count > 0,
      negative: count < 0
    }>
    ${count}
  </div>
  <button on-click('increment', -1)>
    -1
  </button>
  <button on-click('increment', 1)>
    +1
  </button>
</div>

style {
  .click-count button {
      background: #4285f4;
      color: #ffffff;
      border: 1px solid #1266f1;
      display: inline-block;
      padding: 12px 32px;
      height: 26px;
      line-height: 26px;
      cursor: pointer;
  }

  .click-count .count {
      background: #fff;
      border: 1px solid #1266f1;
      display: inline-block;
      height: 26px;
      line-height: 26px;
      vertical-align: middle;
      padding-right: 13px;
  }

  .click-count .count.positive {
      background: rgb(86, 239, 165);
  }

  .click-count .count.negative {
      background: rgb(235, 182, 176);
  }
}

```
</details>


Don't worry if you don't understand even most of the code. We will explain the specific features of Marko in greater detail. What this code snippet shows is that we can write components using HTML, CSS and JavaScript.

A component in Marko is basically a building block for a user interface. What Marko allows is the building parts of a UI which we can then use to build an entire interface.

In this example, the `Counter` component compromises of three other components, the `click-count` callbacks div, and the two `button` that are built in with their corresponding `on-click` functions and styles. We can then call this component in another file by referring it as `<Counter />`

Notice that in the example, we have a `this.state` in this component.  This is known as the *state* of the component, which is essentially the properties of a component. We will talk more about state and how we can pass them around our application, so don't worry if it doesn't make much sense yet.

#### How does Marko Work?

Lets look at a simpler example. Again, don't freak out if you don't understand the syntax for Marko just yet.

Suppose we have a component called `<list-of-numbners />` that looks something like this:

```html
<div.list-of-numbers>
  <for|count| from=1 to=5 step=1>
    <li key=count>
      ${count}: {count}
    </li>
  </for>
</div>
```

If we then call `<list-of-numbers />` from another component, the output HTML would be

```html
<div.list-of-numbers>
  <li key=1>
    1: 1
  </li>
  <li key=2>
    2: 2
  </li>
  <li key=3>
    3: 3
  </li>
  <li key=4>
    4: 4
  </li>
  <li key=5>
    5: 5
  </li>
</div>
```

That's right, Marko components output HTML. Alright, it's an oversimplication. What actually happens is that Marko renders the `<list-of-numbers />` directly to the VDOM which then quickly renders the view on the browswer.

What is a VDOM? At a high level, a VDOM is just a representation of the actual DOM (the actual model that is render on the browswer) that is more efficient to update than DOM maniuplation. The implementation details on how Marko does it can be found [here](https://markojs.com/docs/why-is-marko-fast/).

The `<list-of-numbers />` component only renders the build-in DOM components as the above code snippet above. We are allowed to compose components with other components we made. This for example, we can have a component called `<three-lists-of-numbers` /> by writing the following:

```html
<div.three-lists-of-numbers>
  <list-of-numbers />
  <list-of-numbers />
  <list-of-numbers />
</div>
```

The above component (`<three-list-of-numbers />`) will render the `<list-of-numbers />` three time every time we call `<three-list-of-numbers />`. Although the example is a bit contrieved, the example shows that we can encapsulate components inside other components. This allows us to build more complex UIs from simplier components.

## Before Coding

### Identifying the main components and subcomponents

Before we start to write code for out GIF Keyboard, it is worth spending some time planning ahead as to what the application would look like and what are the major components of our application.

Here's a rough mock of what our GIF Keyboard would look like:

![The Worst MockUp for a GIF Keyboard by MS Paint](tutorial-images/mockup1.png)

The first thing to do is figure out what the main components are for the application. Once we identify the main components, we identify the sub-components of those main components. We can keep doing this, in this application however, it identifying the main components and the corresponding subcomponents should be enough.

The image below displays the mock and the main components.

![The Worst MockUp for a GIF Keyboard by MS Paint with Main Components](tutorial-images/mockup2.png)

In this image, we have two main components for our GIF keyboard. We will let the red main component to be `<SearchBox />` and the blue main component to be `<ImageGallery />`.

The `<SearchBox />` Component will be take in user input and then passes the term to GIPHY and loads the result on the `<ImageGallery />` component. We will talk more about the `<SearchBox />` component later. The `<ImageGallery />` component will display all the relevant gifs from the user input in `<SearchBox />` and two buttons, left and right, that will allow them to scroll through gifs.

Since we are allowed to encapsulate Marko components with other components, we can break the `<ImageGallery />` into subcomponents. The subcomponents for `<ImageGallery />` are boxed below in green and orange.

![The Worst MockUp for a GIF Keyboard by MS Paint with subcomponents](tutorial-images/mockup3.png)

We will name the orange subcomponent as `<Images />` subcomponent and the green subcomponents as `<ScrollButtons />`. Notice that while we identified three subcomponents, we only need to write two new subcomponents. We will go into further details once we start writing code for these components and subcomponents.

Here is the component hierarchy we have identified:

```
giphy-keyboard
  - SearchBox
  - ImageGallery
    - Images
    - ScrollButton
```

And here's the component hierarchy in picture:

![The Worst MockUp for a GIF Keyboard by MS Paint with subcomponents](tutorial-images/mockup4.png)

### Before Starting Marko with this Project

There are a couple of things that we need to do before we starting writing the components for this project.

We need to install [node-fetch](https://github.com/node-fetch/node-fetch), which can be done by:

```npm install --save node-fetch```

Next, we should create a `.constants` file that we will use to access the API key that we got from .giphy. In `marko-giphy-keyboard`, create a script called `APIKEY.constants.js`. Then in that file, save the following line:

```js
export const GIPHYAPIKEY = `Insert your GIPHY API Key in between the backtacks`;
```

You should have already [recieved your API Key from GIPHY](https://developers.giphy.com/docs/api#quick-start-guide). If not, follow the directions to revieve your API key and then insert that key in the above line.

Next go to the `.gitignore` file and add the following two lines at the bottom:

```
package-lock.json
*.constants.js
```

This is to prevent your git repo from getting too big as well as preventing your GIPHY API Key from being public. This may not be the best practice in a normal environment. For purpose of this tutorial, the hiding of the `package-lock` and the API key are suffice.

In `/src/pages/index/index.marko`, remove all the generated code and then add the following lines at the top:

```js
import fetch from 'node-fetch'
import {GIPHYAPIKEY} from './../../../APIKEY.constants.js'

class {
  displayAPIKey(){
    console.log('The API Key: ', GIPHYAPIKEY);
  }
}

<p on-click("displayAPIKey")>
  Hello Marko!
</p>
```

Run the program (`npm run dev`), then run go into the browswer console and make sure you're able to see your GIPHY API key in the console by clicking on `Hello Marko`. If you're able to see the API key after clicking on the element, you are good to go! You may also remove the `logo.svg` in the `index` folder.

We installed our require dependacy, prevented our API key from accidentally being made public and made our API key useable.

## Writing Code with Marko

As stated before, the purpose of this tutorial is to not necessarily write the most elegant or follow all the best practices of Marko. The purpose of this tutorial is to get an overview of Marko main features and how we can use them. This tutorial will first set up the appropriate HTML and JavaScript logic for each component. Then once each component is integrated with each other, we will focus on the styling (CSS).

### Searchbox in GIPHY and `state` in Marko

Before we implement the actual searching, what we are going to do first is implement the search box.

In `/src/pages/index/index.marko`, replace the `<p>` tag with the following:

```html
<input
  type="text"
  on-input("updateSearchTerm")
  placeholder="Enter a value"
  value=state.searchTerm
/>
<p>
  The current search term ${state.searchTerm}
</p>
```

In the class, remove the entire `displayAPIKey` signature and then add the following lines of code to the class:

```js
onCreate(){
  this.state = {
    searchTerm: '',
  }
}
updateSearchTerm(event){
  this.state = {
    searchTerm: event.target.value,
  }
}
```

Your code should look like this in the following dropdown in `/src/pages/index/index.marko`:

<details>

```js
import fetch from 'node-fetch'
import {GIPHYAPIKEY} from './../../../APIKEY.constants.js'

class {
  onCreate(){
    this.state = {
      searchTerm: '',
    }
  }
  updateSearchTerm(event){
    this.state = {
      searchTerm: event.target.value,
    }
  }
}

<input
  type="text"
  on-input("updateSearchTerm")
  placeholder="Enter a value"
  value=state.searchTerm
/>
<p>
  The current search term ${state.searchTerm}
</p>

```
</details>

The result is that as you type, the text should also change. Should look something like the following GIF:

![State Only Implementation](tutorial-images/demo1.gif)

Alright, that was a lot of new code that we added that you may not be familar with. Lets breakdown what we have added.
