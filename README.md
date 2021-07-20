# [SimpleReddit](https://simplereddit.ethan.link)

No distractions. No comments sections. No stylesheets. No JavaScript.

Just an HTML-only Reddit client to stop you entering an internet time vortex.
## FAQs

### Why did you make this?

I wanted a quick way to check Reddit, stay up-to-date and read interesting things without getting distracted.

If I intentionally want to go down a Reddit rabbithole, I'll browse it via [Libreddit](https://github.com/spikecodes/libreddit) (which is still a lot better than the normal Reddit UI!)

### Why is there no CSS or JavaScript?

Why should there be CSS or JavaScript? I think the site works just fine, and it's a bit of a proof to myself and others that you can make a perfectly functional and usable site using the powers of plain HTML alone.

### Are you sure there's no CSS or JS? Not even a sneaky little `style=""`?

There's none! For proof, here's the site's [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP):

```
default-src 'none'; img-src https://simplereddit.ethan.link/favicon.ico
```

This means the allowed sources for scripts and styles is `'none'`, so even if there was any CSS or JS on the page (including via attributes), the browser would refuse to run it!

### How/where does this run?

It's a single no-dependency JavaScript file intended to be deployed via [Cloudflare Workers](https://workers.cloudflare.com). It should be pretty easy port to any hosting/infrastructure though, as it's a single JS file that can be easily adapted.

### Can I self-host this?

Sure! To host on your own Cloudflare account, just clone the repo, update the details in `wrangler.toml`, then run `wrangler publish` in your terminal.

If you want to self-host elsewhere, it shouldn't be too hard to adapt the JS file, the only things that will need changing is where `handleRequest` is called from, and possibly the method used to return HTTP responses.

### Can I contribute?

Since it's a fairly small-scale project, I'm not sure how many things there are that need doing! But if you have any ideas or find any bugs, feel free to leave an issue or pull request.

If you enjoy SimpleReddit and want to leave a small tip, you can [☕ buy me a coffee](https://www.buymeacoffee.com/Booligoosh).