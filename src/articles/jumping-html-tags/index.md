<style>
	.frameworks {
		display: flex;
		column-gap: 0.8rem;
	}

	.frameworks__item {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
	}

	.frameworks__item::before {
		content: '';
		width: 2em;
		height: 2em;
	}

	.frameworks__item--react::before {
		background-image: url('images/frameworks.svg#react');
	}

	.frameworks__item--angular::before {
		background-image: url('images/frameworks.svg#angular');
	}

	.frameworks__item--svelte::before {
		background-image: url('images/frameworks.svg#svelte');
	}

	.frameworks__item--preact::before {
		background-image: url('images/frameworks.svg#preact');
	}

	.frameworks__item--vue::before {
		background-image: url('images/frameworks.svg#vue');
	}

	.frameworks__item--lit::before {
		background-image: url('images/frameworks.svg#lit');
	}
</style>

If you’re building for the Web, you’re most likely writing HTML. It could be JSX, Markdown, or even Dart in your code editor, but eventually, it gets compiled to some sort of markup. And the further away from the actual tags you get, the less idea you have of what gets there. For most developers, it’s just an artifact, like a binary file.

And this is fine, I guess 🤔 We use abstraction layers for solving complex problems. At least, that’s [what they say](https://reactjs.org/docs/introducing-jsx.html#why-jsx). Don’t get me wrong, it often gets ugly: ask [HTMHell](https://www.htmhell.dev/) for examples. Fortunately, in most cases, browsers are smart enough to handle our poor markup.

But sometimes browsers take our mistakes personally, and tags start jumping around 😳

## Basic nesting

I’m sure most of the developers haven’t read the [HTML spec](https://html.spec.whatwg.org/multipage/). They might have stumbled upon it, but I get it: it’s not something you read for fun. But somehow, they more or less know how HTML works and some basic rules, including tags nesting. It’s like our native language: we’ve learned it by listening to our parents and perfected it by speaking.

For example, we all have learned that `<ul>` can only contain `<li>`. Because, you know, it’s an _unordered list_ and a _list item_. And just like in a natural language, we can move things around, and it will still make sense. We can use paragraphs instead of list items, and it will still be fine: no bullets and some extra margins, but nothing too scary.

```html
<!-- Source & DOM -->
<ul>
	<p></p>
</ul>
```

In this case, the source markup will be represented exactly the same in the DOM tree. But it feels wrong, right? It does, but I wouldn’t rely on this feeling too much. [HTML is a programming language](https://youtu.be/P1MJU6l_1WM), after all. It’s wrong because the HTML spec says so:

- [The `<ul>` element](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element)
	- Categories: Flow content
	- Content model: Zero or more `<li>`
- [The `<p>` element:](https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element)
	- Categories: Flow content
	- Content model: Phrasing content

The `<ul>`’s content model allows zero or more `<li>` elements and nothing else, apart from some scripting elements. But browsers don’t care about it, so why should we? There are many good reasons to align your markup with the spec, but let me give you the one that’s rarely mentioned.

Let’s turn the whole thing upside down and put the `<ul>` inside the `<p>`:

```html
<p>
	<ul></ul>
</p>
```

The `<p>`’s content model allows only phrasing content, and `<ul>` is flow content. But who cares? Browsers are still going to render a list inside a para… What the hell? 😬

```html
<p></p>
<ul></ul>
<p></p>
```

## What the hell?

Yes, our `<ul>` just tore the `<p>` apart by being a _wrong_ element. And this is a common behavior among modern browsers, all according to the spec. I couldn’t find a specific place in the spec that says “tear the `<p>` apart, but keep `<ul>` intact” (the [parsing section](https://html.spec.whatwg.org/multipage/parsing.html#parsing) is pretty huge), but it _should_ be in there one way or another since browsers agree on this behavior.

My favorite section is “[Unexpected markup in tables](https://html.spec.whatwg.org/multipage/parsing.html#unexpected-markup-in-tables)”, which starts with:

> Error handling in tables is, for historical reasons, especially strange.

And then tries to explain how browsers should handle the following markup:

```html
<table><b><tr><td>aaa</td></tr>bbb</table>ccc
```

Look at the result, you’ll be fascinated. Now, this is something I’d read for fun! 😁

### Jumping examples

But it’s not just paragraphs that hate you. The tables are pretty picky, too. They don’t like to host random elements inside. A `<div>` inside of the `<table>` will jump out of it, but the `<table>` will hold it together and won’t split, unlike the `<p>`.

```html
<!-- Source -->
<table>
	<div>Jump!</div>
</table>

<!-- DOM -->
<div>Jump!</div>
<table>
</table>
```

But if you decide to nest table parts outside of the `<table>`, they’ll just disappear 🫥 No tags, no problems.

```html
<!-- Source -->
<p>
	<td>I’m not here!</td>
</p>

<!-- DOM -->
<p>I’m not here!</p>
```

Nesting interactive elements into one another is a bad idea on its own, but sometimes it comes with special effects. If you nest buttons or links, the inner one will jump out of it.

```html
<!-- Source -->
<button>
	Outer
	<button>Inner</button>
</button>

<!-- DOM -->
<button>Outer</button>
<button>Inner</button>
```

But if you nest a button inside a link or vice versa, nothing will happen. They don’t like to nest only the ones of their kind (some family issues, perhaps). But in this case, it obviously looks broken, right? We almost expect it to fail by common sense. Let’s look at something a bit more practical.

### Product card

We all know this “product card” pattern: title, description, some picture, and the whole thing is a link. According to the spec, having this card wrapped in a link is fine. But once there’s a link somewhere in the description…

```html
<!-- Source -->
<a href="">
	<article>
		<h2>Jumping HTML tags</h2>
		<p>
			Another reason to
			<a href="">validate</a>
			your markup.
		</p>
	</article>
</a>
```

It’s even hard to describe what happens here. Just look at the DOM 😳

```html
<!-- DOM -->
<a href=""></a>
<article>
	<a href="">
		<h2>Jumping HTML tags</h2>
	</a>
	<p>
		<a href="">Another reason to </a>
		<a href="">validate</a>
		your markup.
	</p>
</article>
```

Another problem with this approach is that even if you avoid the nesting links, the whapper link’s content is not a good accessible description. On this website, I used the trick with an absolutely positioned pseudo-element. You can read more about it in Heydon Pickering’s “[Cards](https://inclusive-components.design/cards/#thepseudocontenttrick)” article.

* * *

Everything that we’ve just discussed was the plain markup. But I wonder what a DOM generated with JavaScript would look like. This would be useful to understand for all JS frameworks out there. Remember all those abstract layers? Yeah. But let’s start with the basics.

## DOM via JS

There are two ways of generating DOM with JavaScript: setting the whole thing to `innerHTML` (or similar) or one element at a time via `createElement()` from DOM API. Let’s start with the first one:

```js
document.body.innerHTML = `
	<p>
		<ul></ul>
	</p>
`;
```

Here we’re asking the browser to make sense of this string and build a DOM tree based on that. You might even call it declarative. In this case, we’ll get the same result as with the plain markup before: the `<p>` is torn apart again 🫠

```html
<p></p>
<ul></ul>
<p></p>
```

But if we specifically ask the browser to create elements, combine them in a certain way, and then append them to the `<body>`:

```js
const div = document.createElement('div');
const p = document.createElement('p');
p.appendChild(div);
document.body.appendChild(p);
```

Then we’ll get exactly what we’ve asked for:

```html
<p>
	<ul></ul>
</p>
```

It means that by using the DOM API, we can force the browser to render any nonsense markup we want. Let’s see what JS frameworks chose to do with this.

## DOM via frameworks

As I mentioned initially, we often use abstraction layers to generate markup. Somewhere deep down the framework guts, the actual markup is produced. After some brief testing, I’ve found that all major frameworks could be split into three groups based on how they handle incorrect nesting:

1. Care about mistakes and report errors.
2. Just generate whatever you tell them to.
3. Output the same DOM as browsers would.

I tested the `p > ul` example in a few major frameworks: React, Angular, Svelte, Vue, Preact, and Lit. It should give us a good idea of how things work across the board.

```html
<p>
	<ul></ul>
</p>
```

### Care a lot

<p class="frameworks">
	<span class="frameworks__item frameworks__item--react">React</span>
	<span class="frameworks__item frameworks__item--angular">Angular</span>
	<span class="frameworks__item frameworks__item--svelte">Svelte</span>
</p>

First of all, why would they even care? One of the reasons is consistency between server-rendered and client-rendered markup. Yes, the framework will generate the same markup in both cases, but the server one will be transformed into DOM and “fixed” by the browser. The client one will be inserted into the DOM as is.

To ensure that the browser won’t mess with the markup, these frameworks report incorrect nesting when they see it. Well, some of it, more on that later. The error messages convey more or less the same idea: the nesting is wrong.

In React’s case, it’s clear and to the point:

> Warning: validateDOMNesting(…): &lt;ul&gt; cannot appear as a descendant of &lt;p&gt;

They took care of this [back in 2015](https://github.com/facebook/react/commit/f9abf493b4685869e9feed5738d8271b0dc4e944#diff-93f9ab60008590ba55d1b674c1335520b47d7748488fe839e425498b7d533af5R24-R138) by categorizing all elements into spec-based groups (flow, phrasing, etc.) and mapping them with nesting rules. Today it looks [a bit different](https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/validateDOMNesting.js), but the idea is more or less the same: they don’t care if the markup is “valid,” they only care if it’s going to be “fixed” by the browser.

Angular suggests that some tags weren’t closed properly, which is not the case, really. And the message sounds like it has no idea what’s going on:

> Template parse errors: Unexpected closing tag “p”. It may happen when the tag has already been closed by another tag. For more info see [https://www.w3.org/TR/html5/syntax.html](https://www.w3.org/TR/html5/syntax.html#closing-elements-that-have-implied-end-tags)

They even give you the link to an outdated spec that, fortunately, redirects to the Living Standard. But this “implied end tags” section won’t ever help you to understand the issue 😔

Svelte doesn’t help much either, but at least it sounds a bit more confident:

> &lt;/p&gt; attempted to close &lt;p&gt; that was already automatically closed by &lt;ul&gt;

### Do what you tell them

<p class="frameworks">
	<span class="frameworks__item frameworks__item--preact">Preact</span>
	<span class="frameworks__item frameworks__item--vue">Vue</span>
</p>

Well, they do. It probably simplifies the implementation since you don’t have to carry around all the rules from the spec and keep them up to date. You just need to `createElement` and append it somewhere. I guess they’re fine with the lack of consistency between server and client, but I’m not sure how big of a deal it is.

### Like browsers

<p class="frameworks">
	<span class="frameworks__item frameworks__item--lit">Lit</span>
</p>

No errors, just the “fixed” DOM with the `<p>` torn apart. It most likely uses `innerHTML` under the hood at some point. The responsibility for the output is shifted to developers, but it’s easier to handle since it’s consistent with the browser’s behavior.

### Not quite

Among the “care a lot” frameworks, React’s clear error messages and spec compatibility stand out. Both Angular and Svelte don’t consider the nested buttons example a mistake. But the problem is that none of them managed to handle the product card wrapped in a link example. Even React didn’t catch the wrong nesting and rendered the DOM as the source 😬

* * *

So, the winner is Lit, that’s not even trying to construct something different from what browsers would do. But I’m grateful to React for trying to be spec-compliant. With all that, what should we do?

## Validate it

I know, after everything we’ve been through here, you might be thinking that it’s a mess. With different frameworks doing their own thing on top of that. But this kind of “behind-the-scenes controlled complexity” mess is holding everything together. How all browsers recover from our mistakes exactly the same way is fascinating.

Just like Alex Russell said [in the recent The F-Word episode](https://f-word.dev/episodes/14/):

> You can take some HTML, write it down on a back of a napkin, put it in your pocket, put it in the wash, grab it out of the dryer, uncrumple a little bit, type it back in with a bunch of typos and it will probably render something. And probably not something super different from what you meant.

This is one of the best foundations for the Web Platform we can dream of. But I’d still try to avoid wrong nesting in the first place. Remember the product card? There were four links in the resulting DOM instead of two. And one of them wrapping the header. Imagine how much harm it could do to the functionality and accessibility of the page.

Not just that! Apparently, misplaced HTML elements could cause performance issues 😭 There’s a good example in Harry Roberts’ “[Get Your Head Straight](https://youtube.com/watch?v=vgZ2B0rY4fs&t=791)” talk: one simple stray `<input>` could mess up `<head>` parsing and degrade page loading.

Fortunately, there are a few tools that can help you avoid this kind of mistakes.

### W3C HTML validator

This is the closest thing to the spec you can get. Most of you probably know it as an online service at [validator.w3.org](https://validator.w3.org/), where you can input an address, upload a file, or paste the markup. I use this service to check something quickly. But it’s 2023, and we need a tool that constantly checks markup for us. You know, CI/CD and all that 🤓

The tool behind it is called [Nu Html Checker](https://github.com/validator/validator) or v.Nu, it’s open-source and written in Java. I don’t have Java installed on my system, so I could’ve used the official [Docker image](https://validator.github.io/validator/#docker-image) to run it locally. But instead, for my blog, I use a convenient and official npm package [vnu-jar](https://www.npmjs.com/package/vnu-jar) running all checks in GitHub Actions. Here’s the npm script I run for that:

```sh
java
	-jar node_modules/vnu-jar/build/dist/vnu.jar
	--filterfile .vnurc
	dist/**/*.html
```

Let’s unfold this command:

1. The `-jar` option specifies the path to the installed tool.
2. The `--filterfile` passes the list of errors I’d like to ignore.
3. Then follows the list of files to check.

There are many more options [in the documentation](https://validator.github.io/validator/), but I’d like to focus on `--filterfile` a bit more. You know, the validator is not always correct: sometimes, you use features that aren’t in the spec yet, or you just know what you’re doing and want to ignore the warning.

The file is just a list of messages to ignore, one per line. But they’re also regular expressions, so you have some flexibility here. For example, here’s the list of messages I decided to ignore:

- Attribute “media” not allowed on element “meta” at this point.
- Attribute “fetchpriority” not allowed on element “img” at this point.
- Possible misuse of “aria-label”.*

You can copy those messages from the tool’s output. But be careful, sometimes the exact messages don’t match, which is a [known issue](https://github.com/validator/validator/issues/1070). In this case, you might want to use some wildcards to match it. For example, I used the inline `<style>` element in this article to add framework icons, and the validator considers this a mistake. With all due respect, your honor, I disagree 🧐 But I couldn’t match and filter out the following message:

> Element “style” not allowed as child of element “body” in this context.

So I used this one instead, and it worked. Note the `.*` at the end:

> Element “style” not allowed as child of element.*

As for the GitHub Actions workflow that runs this script, there’s nothing special in there. But if you’re interested, you can [check it out](https://github.com/pepelsbey/pepelsbey.dev/blob/main/.github/workflows/html.yml). I’d also recommend checking out the [Bootstrap’s script](https://github.com/twbs/bootstrap/blob/main/build/vnu-jar.js) that runs the validation. It’s a bit more sophisticated and doesn’t break the tests if Java is missing.

### HTML-validate

It’s an independent tool trying to be a bit more flexible than the validator. It can check not only full documents but also fragments of HTML. Because of that, it might be helpful for testing components. Unlike the W3C’s validator, it’s not trying to be 100% spec-compliant and might not catch some nuances. However, it managed to spot the product card’s mistake.

> &lt;a&gt; element is not permitted as a descendant of &lt;a&gt; (element-permitted-content)

I didn’t have a chance to try it myself, but it seems like a good option if the official validator doesn’t fit your CI/CD workflow or you need to validate the markup of a component. You can read more about it in the [documentation](https://html-validate.org/), check out the [source code](https://gitlab.com/html-validate/html-validate), and even [try it online](https://online.html-validate.org/).

### HTML Linters

Linters usually care about the code you’re writing, not the output. They might help you with your component’s markup, but how components work together is out of their scope. But every bit helps, right?

- The [validate-html-nesting](https://github.com/MananTank/validate-html-nesting) library implements the same principle as React: to check nesting based on categories and content models of particular elements. There are [ESLint](https://github.com/MananTank/eslint-plugin-validate-jsx-nesting) and [Babel](https://github.com/MananTank/validate-jsx-nesting) plugins for JSX based on this tool. The downsides are the same: you won’t catch some more complex cases, like product card.
- The [HTMLHint](https://htmlhint.com/) doesn’t care about your nesting, but it might help you implement a specific code style and catch some common mistakes. The [list of rules](https://htmlhint.com/docs/user-guide/list-rules) is not very long, but all of them are useful.

## No, seriously

Whatever you’re doing on the Web, it’ll be standing on the shoulders of HTML. Keep your markup tidy. It will save you from surprises, and improve the user experience. These things will never go out of fashion 😉
