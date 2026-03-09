import { env } from "./config/index.js";
import { createServer } from "./server.js";

const app = createServer();

app.listen(env.PORT, () => {
  console.log(`XiaowenAgent listening on http://localhost:${env.PORT}`);
});
