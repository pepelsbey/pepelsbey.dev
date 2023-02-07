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

I looked at the example in the docs and suddenly realized that it won’t work in Safari. Why? Because of the behavior, I talked about in the recent [Conditionally adaptive CSS](https://pepelsbey.dev/articles/conditionally-adaptive/#a-catch) article.

Long story short, although Safari does load the CSS with non-matching `media="print"` at the low priority, it still blocks the rendering until the very last CSS file is loaded. And this is exactly what this trick relies on: a quick rendering of the critical CSS, not blocked by the deferred styles.

## Lazy demo

But that was just a hunch, I needed to test the actual behavior. Here’s the slightly modified demo from the previous article I used for testing:

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

The markup is almost the same, but I replaced `print` value with `not all`, which is the opposite of the `all` [per spec](https://www.w3.org/TR/mediaqueries-4/#mq-not) and makes much more sense here. The _critical.css_ contains the background color and size for the image that will come next:

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

In Safari, we can finally see that the title of this article is not exaggerating:

<figure>
    <video controls muted playsinline width="2048" height="1152">
        <source src="video/safari.mp4" type="video/mp4">
    </video>
</figure>

It takes 23 seconds to show anything at all. And we get background color and image at the same time, which makes lazy loading useless. Definitely broken, if you ask me.

## What now?

There are two things. First, I’d suggest not relying on this lazy-loading technique anymore. Fortunately, it fails gracefully in Safari, but only if you use it for something non-critical. I’ve seen it used for lazy-loading base64-encoded fonts and images, which is a bad idea in general and does more harm than good.

Second, please stop by [at the WebKit issue](https://bugs.webkit.org/show_bug.cgi?id=39455) I mentioned and share your use cases and concerns. It might help to draw attention and raise the priority. It’s not an imaginary use case or specific performance optimization for printing styles anymore. It seems like it’s breaking the Web.

## Update

- There’s a [similar issue](https://bugs.chromium.org/p/chromium/issues/detail?id=1001078) in Chrome implementation for `@import` media conditions. Apparently, it’s the case for the rest of the browsers, too.
- The next day after I published this article, the [PR fixing this behavior in WebKit](https://github.com/WebKit/WebKit/pull/9746) was opened. We might see the updated behavior in Safari TP very soon!
