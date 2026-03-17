const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders,
  });
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: jsonHeaders,
  });
}

export async function onRequestGet(context) {
  const { results } = await context.env.DB.prepare(
    `
      SELECT
        id,
        topic,
        detail,
        author_name,
        author_mode,
        created_at
      FROM prayers
      ORDER BY created_at DESC
      LIMIT 100
    `
  ).all();

  return json({ prayers: results ?? [] });
}

export async function onRequestPost(context) {
  let payload;

  try {
    payload = await context.request.json();
  } catch {
    return json({ error: "No se pudo leer la oración enviada." }, 400);
  }

  const topic = typeof payload.topic === "string" ? payload.topic.trim() : "";
  const detail = typeof payload.detail === "string" ? payload.detail.trim() : "";
  const authorMode =
    payload.authorMode === "named" || payload.authorMode === "anonymous"
      ? payload.authorMode
      : "anonymous";
  const rawAuthorName =
    typeof payload.authorName === "string" ? payload.authorName.trim() : "";
  const authorName =
    authorMode === "named" ? rawAuthorName.slice(0, 60) : "Anónimo";

  if (topic.length < 4 || topic.length > 120) {
    return json(
      { error: "El motivo breve debe tener entre 4 y 120 caracteres." },
      400
    );
  }

  if (detail.length < 12 || detail.length > 2000) {
    return json(
      { error: "El detalle debe tener entre 12 y 2000 caracteres." },
      400
    );
  }

  if (authorMode === "named" && authorName.length < 2) {
    return json(
      { error: "Para publicar con tu nombre, escribe al menos 2 caracteres." },
      400
    );
  }

  const prayer = {
    id: crypto.randomUUID(),
    topic,
    detail,
    authorName,
    authorMode,
    createdAt: new Date().toISOString(),
  };

  await context.env.DB.prepare(
    `
      INSERT INTO prayers (
        id,
        topic,
        detail,
        author_name,
        author_mode,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `
  )
    .bind(
      prayer.id,
      prayer.topic,
      prayer.detail,
      prayer.authorName,
      prayer.authorMode,
      prayer.createdAt
    )
    .run();

  return json(
    {
      prayer: {
        id: prayer.id,
        topic: prayer.topic,
        detail: prayer.detail,
        author_name: prayer.authorName,
        author_mode: prayer.authorMode,
        created_at: prayer.createdAt,
      },
    },
    201
  );
}
