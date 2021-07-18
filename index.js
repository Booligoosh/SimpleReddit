const CSP =
  "default-src 'none'; img-src https://simplereddit.ethan.link/favicon.ico";

addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event.request).catch(
      (err) =>
        new Response(err.stack, {
          status: 500,
          headers: {
            "Content-Security-Policy": CSP,
          },
        })
    )
  );
});

/**
 * Many more examples available at:
 *   https://developers.cloudflare.com/workers/examples
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const ORIGIN = "https://simplereddit.ethan.link";

  const GLOBAL_STYLES = `
  * {
    box-sizing: border-box;
    /*transition-property: color, background-color, border-color;
    transition-duration: 200ms;
    transition-timing-function: ease-in-out;*/
  }
  :root {
    --bg: hsl(0,0%,100%);
    --color: hsl(0,0%,20%);
    --border-color: hsl(0,0%,95%);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: hsl(0,0%,20%);
      --color: hsl(0,0%,100%);
      --border-color: hsl(0,0%,30%);
    }
  }
  body {
    font-family: 'Helvetica Neue', sans-serif;
    margin: 0;
    color: var(--color);
    background-color: var(--bg);
    filter: grayscale(1);
  }`;

  const { pathname, searchParams } = new URL(request.url);

  if (pathname === "/favicon.ico") {
    return fetch("https://files.ethan.link/simplereddit.ico");
  }

  if (pathname.startsWith("/r/")) {
    const subreddit = pathname.split("/")[2];
    const { data } = await fetch(
      `https://www.reddit.com/r/${subreddit}.json`
    ).then((r) => r.json());

    // Otherwise, it'll go to the 404 return near the end of the file
    if (data) {
      const name = data.children[0].data.subreddit_name_prefixed;
      // Redirect to nicely capitalised version, without any trailing bits
      if (request.url !== `${ORIGIN}/${name}`) {
        return Response.redirect(`${ORIGIN}/${name}`, 302);
      }
      const html = `
      <!DOCTYPE html>
      <head>
        <meta name="viewport" content= "width=device-width, initial-scale=1.0">
        <title>${name} &bull; SimpleReddit</title>
      </head>
      <body>
        <main>
          <h1 class="title">${name}</h1>
          <hr/>
          ${data.children
            .slice(0, 15)
            .map(
              ({ data }) => `
            <div class="item">
              <a class="item-title" ${
                !data.is_self
                  ? `href="${
                      data.secure_media?.reddit_video?.fallback_url ?? data.url
                    }"`
                  : ""
              }>
                ${getTag(data)} ${data.title}
              </a>
              <div class="item-meta">
              ${new Date(data.created_utc * 1000).toLocaleString([], {
                month: "short",
                weekday: "short",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                timeZone: request.cf?.timezone,
              })}
              ${data.stickied ? "(pinned)" : ""}
              </div>
              <div class="item-meta">${data.ups} upvotes</div>
              ${
                data.is_self
                  ? `
              <details>
                <summary>Self text</summary>
                <div>
                  ${data.selftext_html
                    .replaceAll("&lt;", "<")
                    .replaceAll("&gt;", ">")
                    .replaceAll("&amp;", "&")}
                </div>
              </details>
              `
                  : ""
              }
            </div>
            <hr/>
          `
            )
            .join("")}
          <div class="end">Ok, stop reading reddit now and go for a walk :)</div>
        </main>
      </body>
      ${
        searchParams.get("style")
          ? `
      <style>
      ${GLOBAL_STYLES}
      main {
        width: 700px;
        max-width: 100%;
        margin: 0 auto;
        padding: 4rem 1rem;
      }
      .title {
        margin: 0;
      }
      .item-title {
        font-size: 1.1rem;
        margin-bottom: .2rem;
        display: block;
        color: inherit;
        text-decoration: none;
      }
      .item-meta {
        opacity: .5;
        font-size: .9rem;
      }
      details {
        margin-top: .5rem;
      }
      summary {
        cursor: pointer;
      }
      details a {
        color: inherit;
      }
      hr {
        border: none;
        border-top: 1px solid var(--border-color);
        margin: 1rem 0;
      }
      .end {
        margin-top: 4rem;
        opacity: .5;
        text-align: center;
        font-style: italic;
      }
      </style>
      `
          : ""
      }
      `;
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache",
          "Content-Security-Policy": CSP,
        },
      });
    }
  }

  if (pathname === "/") {
    const html = `
    <!DOCTYPE html>
    <head>
      <meta name="viewport" content= "width=device-width, initial-scale=1.0">
      <title>SimpleReddit</title>
    </head>
    <body>
      <center>
        <br><br><br>
        <h1>SimpleReddit</h1>
        <p>No distractions. No comments. No stylesheets. No JavaScript.</p>
        <p>Just an HTML-only Reddit client to stop you entering an internet time vortex.</p>
        <br><br>
        <form action="/form" method="get">
          r/<input name="subreddit" placeholder="Enter a subreddit name" autofocus required />
          <button>Go to subreddit</button>
        </form>
        <br><br>
        <p><small>Made by <a href="https://ethan.link" target="_blank">Ethan</a></small></p>
      </center>
    </body>
    ${
      searchParams.get("style")
        ? `
    <style>
    ${GLOBAL_STYLES}
    body {
      padding: 2rem;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    form {
      font-size: 1.1rem;
      text-align: center;
    }
    input {
      color: var(--color);
      background-color: var(--bg);
      border: 1px solid var(--border-color);
      font: inherit;
      padding: .2rem .4rem;
      border-radius: 5px;
    }
    button {
      margin-top: 1rem;
      font: inherit;
      color: inherit;
      font-size: 1rem;
      background-color: var(--border-color);
      /*border: 1px solid var(--color);*/
      padding: .2rem .4rem;
      border-radius: 5px;
      cursor: pointer;
    }
    </style>
    `
        : ""
    }
    `;
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        "Content-Security-Policy": CSP,
      },
    });
  }

  if (pathname === "/form") {
    return Response.redirect(
      `${ORIGIN}/r/${searchParams.get("subreddit")}`,
      301
    );
  }

  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Security-Policy": CSP,
    },
  });
}

function getTag(data) {
  if (data.is_self) return "📝";
  if (data.is_video) return "📽";
  if (["i.redd.it", "i.imgur.com"].includes(data.domain)) return "📸";
  return "🔗";
  // if (data.is_self) return "[self]"
  // if (data.is_video) return "[video]"
  // if (data.domain === "i.redd.it") return "[image]"
  // return "[link]"
}
