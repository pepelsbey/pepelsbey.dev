The other day [Thomas Steiner](https://blog.tomayac.com/) kindly decided to share my “[Jumping HTML tags](https://pepelsbey.dev/articles/jumping-html-tags/)” article and got frustrated because after selecting and copying the title of the article he got this:

> JUMPING HTML TAGS. ANOTHER REASON TO VALIDATE YOUR MARKUP

It wasn’t some rich text editor, just regular text input. I suppose Thomas didn’t want to shout at his readers and had to normalize the case before [sharing it](https://toot.cafe/@tomayac/110108026079630471). Thank you, Thomas! 😊

But why would I type my titles in uppercase? First of all, this is how [Mark Shakhov](https://www.facebook.com/mark.jpeg.71) designed it, and I like it a lot. Second, I don’t actually type them like that: you can check [the list of all articles](https://pepelsbey.dev/articles/) where the case is normal. I use CSS to style it like this only on the article page:

```css
.lead__title {
	margin: 0;
	line-height: 1.1;
	text-wrap: balance;
	text-transform: uppercase;
	font-weight: normal;
	font-family: var(--font-family-heading);
}
```

At first, it didn’t make any sense: I often copy titles of my newly published articles to share them on different platforms: [Mastodon](https://mastodon.social/@pepelsbey), [Twitter](https://twitter.com/pepelsbey_dev), [Telegram](https://t.me/pepelsbey_dev). So I tried to copy the title in Firefox, my browser of choice, and I got a pretty reasonable result:

> Jumping HTML tags. Another reason to validate your markup

Then I did the same in Chrome and Safari and got the uppercase. There we go again 🙄

<div class="update">

**Update:** Chrome changed the behavior to match Firefox’s in version 127, released on July 23rd, 2024, although it wasn’t mentioned in the [release notes](https://developer.chrome.com/release-notes/127). But enough spoilers, keep reading.

</div>

## The problem

As I mentioned in the article that caused it, Web standards are the main thing that holds the whole Web platform together. In our case, it’s the [CSS Text Module](https://www.w3.org/TR/css-text-3/#propdef-text-transform) spec, which says, plain and simple, about the `text-transform` property:

> This property transforms text for styling purposes. It has no effect on the underlying content, and must not affect the content of a plain text copy & paste operation.

It means that Chrome and Safari are wrong. Whether you agree with this behavior or not, it’s against the spec. Unfortunately, I couldn’t find a relevant test in the [WPT suite](https://wpt.fyi/results/css/css-text/text-transform?label=experimental&label=master&aligned) for the `text-transform` property. But it’s not just Firefox that goes against the crowd. Two other browsers with independent engines used to do the same: Internet Explorer and Opera 12 on Presto.

I’m late to the party here, it’s been discussed for years. There are browser bugs in [Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=325231) and [Safari](https://bugs.webkit.org/show_bug.cgi?id=43202) that you can subscribe to or even better, vote for and post your use cases. And if you enjoy lengthy CSSWG discussions, grab yourself a drink and read [this one](https://github.com/w3c/csswg-drafts/issues/3775) started by [Brian Kardell](https://bkardell.com/). And the classic “[Copying content styled with text-transform](https://adrianroselli.com/2012/06/copying-content-styled-with-text.html)” article by Adrian Roselly published in 2012, giving it the accessibility perspective.

I called the next part “The solution” at first, but honestly, it’s a questionable trick 🙃

## A questionable trick

Apart from how it’s described in the spec and my opinion on what browser is correct (the one that’s not causing frustration), there’s a user perspective to consider. I don’t want readers of my blog to normalize the case or dig into the source code whenever they want to share my articles. I’d like the behavior described in the spec to be the default one for Chrome and Safari users. Damn, I want to be able to select the title of my article on my iPhone and get the actual title, not the shouty version of it.

That’s why I quickly put together a small script that hijacks the `copy` event and puts the source text in the clipboard. The event is only fired when the whole title or some part of it is selected. It works just fine via shortcuts, context menus, or select tooltips on touch devices.

```js
document
	.querySelector('.lead__title')
	.addEventListener('copy', (event) => {
		event.clipboardData.setData(
			'text/plain',
			event.target.textContent
		);

		event.preventDefault();
	});
```

I was pleasantly surprised to see how easy it was to implement. But of course, it’s just a questionable trick with downsides. It’ll copy the whole title even if you select a single word. If you extend the selection beyond the title, it’ll copy just the title. I’m pretty sure there’s more, but fortunately, “Select All” or a significant selection extension stops the script from hijacking the event.

Would I recommend using this script? Only if you really need this and there’s no other way of working around the issue. Meanwhile, I hope this wave of interest will lead browsers and CSSWG to a better solution. It’s a tricky problem, and there’s the truth behind both arguments. We might need a new property to control this behavior, but I’d start by aligning with the spec.
