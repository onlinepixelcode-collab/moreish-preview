// Password gate for the private preview: any username + PREVIEW_PASSWORD (set in Netlify, not in code).
export default async (request: Request, context: { next: () => Promise<Response> }) => {
  const password = Netlify.env.get("PREVIEW_PASSWORD");
  if (!password) return new Response("Preview is locked: set PREVIEW_PASSWORD in Netlify.", { status: 503 });
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const [, pass] = atob(header.slice(6)).split(/:(.*)/s);
      if (pass === password) {
        const res = await context.next();
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
        return res;
      }
    } catch (_) { /* fall through */ }
  }
  return new Response("Just Moreish preview: please sign in.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Just Moreish preview", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow" },
  });
};
