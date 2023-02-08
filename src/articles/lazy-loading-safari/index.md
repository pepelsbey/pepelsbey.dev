I know, it’s a strong statement. You might even call it clickbait. But hear me out! Remember this old trick that allowed us to load only critical CSS and defer the rest? Yes, the one that used `media="print"` to change the value to `all` in the `onload` event.

```html
<link
    rel="stylesheet"
    href="critical.css"
>
<link
    rel="stylesheet"
    href="deferred.css"
    media="print"
    onload="this.media='all'"
>
<noscript>
    <link
        rel="stylesheet"
        href="deferred.css"
    >
</noscript>
```

It first caught my eye back in 2019 in [The Simplest Way to Load CSS Asynchronously](https://www.filamentgroup.com/lab/load-css-simpler/) article by Scott Jehl. It was simple, elegant, and fail-proof: the `<noscript>` element would make sure that CSS is loaded even if JavaScript is disabled.

And it’s still used today, mainly to cut the cost of blocking resources and improve performance. I stumbled upon it again in the docs for the newly-released [eleventy-plugin-bundle](https://github.com/11ty/eleventy-plugin-bundle), a nice helper for Eleventy.

I looked at the example in the docs and suddenly realized that it won’t work in Safari. Why? Because of the behavior I talked about in the recent [Conditionally adaptive CSS](https://pepelsbey.dev/articles/conditionally-adaptive/#a-catch) article.

Long story short, although Safari does load the CSS with non-matching `media="print"` at the low priority, it still _might_ block the rendering until the very last CSS file is loaded. And this is exactly what this trick relies on: a quick rendering of the critical CSS, not blocked by the deferred styles.

Turns out, it’s a bit more complicated. Let’s take a look at the demo.

## Lazy demo

Here’s the slightly modified demo from the previous article I used for testing:

<iframe
    src="demo/index.html"
    height="280" loading="lazy"
    title="Demo with the word “lazy” repeated on the violet background."
></iframe>

```html
<link
    rel="stylesheet"
    href="deferred.css"
    media="not all"
    onload="this.media='all'"
>
```

The markup is almost the same, but I replaced `print` value with `not all`, which is the opposite of the `all` [per spec](https://www.w3.org/TR/mediaqueries-4/#mq-not) and makes much more sense here. There’s no real content on the page, it’s just a demo, after all. The _critical.css_ contains the background color and size for the image that will come next:

```css
body {
    background-color: #9073c9;
    background-size: 327px 280px;
}
```

And here comes the image, in the _deferred.css:_

```css
body {
    background-image: url('data:image/png;base64,…');
}
```

Like in the previous article, I used over-bloated base64-encoded PNG as a background image to make styles heavier. To make things even more interesting, I launched the demo using [slow-static-server](https://www.npmjs.com/package/slow-static-server).

This is how it loads in Chrome:

<figure>
    <video controls muted playsinline width="2048" height="1152">
        <source src="video/chrome.mp4" type="video/mp4">
    </video>
</figure>

1. The critical CSS is loaded instantly, and we see the background color.
2. The deferred CSS loads for 23 seconds, and only then we see the background image.

In Safari, we can finally see what the title of this article is all about:

<figure>
    <video controls muted playsinline width="2048" height="1152">
        <source src="video/safari.mp4" type="video/mp4">
    </video>
</figure>

It takes 23 seconds to show anything at all. And we get background color and image at the same time, which makes lazy loading useless. Definitely broken, if you ask me. So, this is it, right? Well, it was until I got feedback from WebKit engineers: apparently, this behavior depends on the length of the content 🤔

## Full body

You don’t really expect browsers to load CSS differently depending on the length of the content, do you? Well, it seems like this is exactly what’s happening in Safari. If the length of the page’s `<body>` is 200 characters or less, the deferred CSS will block the rendering.

Yes, I manually entered 200 zeroes, and the demo still worked the same, but when I entered one more, it suddenly got fixed. It’s funny that spaces don’t count, only characters. I’m sorry, but I had to try this: it takes only 34 🤡 emojis to make it work. Some Unicode magic, I guess.

<figure>
    <video controls muted playsinline width="2048" height="1152">
        <source src="video/funny.mp4" type="video/mp4">
    </video>
</figure>

The good news is that this behavior just got fixed [in the PR to the WebKit engine](https://github.com/WebKit/WebKit/pull/9746) the next day I published the first version of this article. We might see the updated behavior in [Safari TP](https://developer.apple.com/safari/technology-preview/) very soon! But the question remains…

## What now?

I’d be careful with this lazy-loading technique. Fortunately, it works fine in Safari with regular websites, with content usually more than 200 characters. But I can imagine a SPA that would look like this:

```html
<body>
    <script src="https://unpkg.com/react@18.0.0/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js" crossorigin></script>
    <script src="app.js"></script>
</body>
```

This content won’t pass the 200 characters threshold for regular CSS loading, and the critical CSS will be blocked. So what? I’ve seen deferred styles used for lazy-loading base64-encoded fonts and images, which is a bad idea in general and does more harm than good.

But `<link>` is not the only way to load CSS with media conditions. There’s also `@import`:

```html
<link
    rel="stylesheet"
    href="dark.css"
    media="(prefers-color-scheme: dark)"
>

<style>
    @import url('dark.css') (prefers-color-scheme: dark);
</style>
```

Both of these are supposed to work the same way, but not a single browser prioritizes CSS loading for `@import` media conditions for now. But there’s an [issue for Chromium](https://bugs.chromium.org/p/chromium/issues/detail?id=1001078) not getting enough attention. You know what to do if you want to see this fixed: press the ⭐️
