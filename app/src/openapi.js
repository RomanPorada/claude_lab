const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };
const q = (name, type = "string") => ({ name, in: "query", schema: { type } });

module.exports = {
  openapi: "3.0.3",
  info: { title: "Atoms & Molecules API", version: "2.0.0" },
  components: { securitySchemes: { bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { summary: "Health check (перевіряє зʼєднання з БД)", responses: { 200: { description: "OK" }, 503: { description: "DB unavailable" } } } },
    "/atoms": { get: { summary: "Список атомів", parameters: [q("types"), q("massMin", "number"), q("massMax", "number"), q("q")], responses: { 200: { description: "OK" } } } },
    "/atoms/{id}": { get: { summary: "Атом за id", parameters: [idParam], responses: { 200: { description: "OK" }, 404: { description: "Not found" } } } },
    "/molecules": { get: { summary: "Список молекул", parameters: [q("phases"), q("molarMin", "number"), q("molarMax", "number"), q("q")], responses: { 200: { description: "OK" } } } },
    "/auth/register": { post: { summary: "Реєстрація (повертає JWT)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string" }, password: { type: "string" }, confirmPassword: { type: "string" } } } } } }, responses: { 201: { description: "Created" }, 400: { description: "Validation error" }, 409: { description: "Email exists" } } } },
    "/auth/login": { post: { summary: "Вхід (повертає JWT)", requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { email: { type: "string" }, password: { type: "string" } } } } } }, responses: { 200: { description: "OK" }, 401: { description: "Bad credentials" } } } },
    "/auth/me": { get: { summary: "Поточний користувач", security: [{ bearer: [] }], responses: { 200: { description: "OK" }, 401: { description: "No/invalid token" } } } },
    "/orders": {
      get: { summary: "Мої замовлення", security: [{ bearer: [] }], responses: { 200: { description: "OK" }, 401: { description: "No/invalid token" } } },
      post: { summary: "Створити замовлення", security: [{ bearer: [] }], responses: { 201: { description: "Created" }, 401: { description: "No/invalid token" } } },
    },
    "/molecules/{id}": { get: { summary: "Молекула за id", parameters: [idParam], responses: { 200: { description: "OK" }, 404: { description: "Not found" } } } },
  },
};
