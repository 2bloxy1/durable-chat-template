export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "POST" && path === "/announce") {
      try {
        const { code } = await request.json();  // Read body once

        const studentMap = {
          "001": "Bob Jones",
          "002": "Kimberly Johnson",
        };

        const name = studentMap[code];
        if (!name) {
          return new Response("Invalid code", { status: 400 });
        }

        // Read queue from KV or empty array
        const queue = JSON.parse(await env.DISMISS_KV.get("queue") || "[]");
        queue.push(name);
        await env.DISMISS_KV.put("queue", JSON.stringify(queue));

        // Read log from KV or empty array
        const log = JSON.parse(await env.DISMISS_KV.get("log") || "[]");
        log.push({ name, timestamp: new Date().toISOString() });
        await env.DISMISS_KV.put("log", JSON.stringify(log));

        return new Response("Added to queue", { status: 200 });

      } catch (err) {
        return new Response("Invalid request body", { status: 400 });
      }
    }

    if (request.method === "GET" && path === "/queue") {
      const queue = await env.DISMISS_KV.get("queue");
      return new Response(queue || "[]", {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "GET" && path === "/log") {
      const log = await env.DISMISS_KV.get("log");
      return new Response(log || "[]", {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST" && path === "/clear") {
      await env.DISMISS_KV.put("queue", JSON.stringify([]));
      return new Response("Queue cleared", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }
};
