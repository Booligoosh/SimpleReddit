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

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // Favicon
  if (pathname === "/favicon.ico")
    return fetch("https://files.ethan.link/simplereddit.ico");
  // Robots.txt
  if (pathname === "/robots.txt")
    return new Response("User-agent: *\nDisallow: /");
  // Subreddit pages
  if (pathname.startsWith("/r/")) return subredditPage(request, url);
  // Home page
  if (pathname === "/") return homePage();
  // Home page form submissions
  if (pathname === "/form") {
    return Response.redirect(
      `${url.origin}/r/${url.searchParams.get("subreddit")}`,
      301
    );
  }
  // 404 catch-all
  return notFoundPage();
}

function homePage() {
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
        <p>No distractions. No comments sections. No stylesheets. No JavaScript.</p>
        <p>Just an HTML-only Reddit client to stop you entering an internet time vortex.</p>
        <br><br>
        <form action="/form" method="get">
          r/<input name="subreddit" placeholder="Enter a subreddit name" autofocus required />
          <button>Go to subreddit</button>
        </form>
        <br><br>
        <p><small>Made by <a href="https://ethan.link">Ethan</a>, source code on <a href="https://github.com/Booligoosh/SimpleReddit">GitHub</a></small></p>
      </center>
    </body>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "Content-Security-Policy": CSP,
    },
  });
}

async function subredditPage(request, url) {
  const subreddit = url.pathname.split("/")[2];
  const { data } = await fetch(
    `https://www.reddit.com/r/${subreddit}.json`
  ).then((r) => r.json());

  if (!data) return notFoundPage();

  const name = data.children[0].data.subreddit_name_prefixed;
  // Redirect to nicely capitalised version, without any trailing bits
  if (url.pathname !== `/${name}`) {
    return Response.redirect(`${url.origin}/${name}`, 302);
  }
  const html = `
    <!DOCTYPE html>
    <head>
      <meta name="viewport" content= "width=device-width, initial-scale=1.0">
      <title>${name} &bull; SimpleReddit</title>
    </head>
    <body>
      <h1>${name}</h1>
      <hr/>
      ${data.children
        .slice(0, 15)
        .map(
          ({ data }) => `
            <a ${
              !data.is_self
                ? `href="${
                    data.secure_media?.reddit_video?.fallback_url ?? data.url
                  }"`
                : ""
            }>
              ${getTag(data)} ${data.title}
            </a>
            <br>
            ${new Date(data.created_utc * 1000).toLocaleString([], {
              month: "short",
              weekday: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              timeZone: request.cf?.timezone,
            })}
            ${data.stickied ? "(pinned)" : ""}
            <br>
            ${data.ups} upvotes
            ${
              data.is_self
                ? `
            <details>
              <summary>Self text</summary>
              ${data.selftext_html
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&")}
            </details>
            `
                : ""
            }
          <hr/>`
        )
        .join("")}
      Ok, stop reading reddit now and go for a walk :)
    </body>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "Content-Security-Policy": CSP,
    },
  });
}

function notFoundPage() {
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
