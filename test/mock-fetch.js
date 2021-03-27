import { rest } from "msw";
import { setupServer } from "msw/node";
import { readFile } from "fs/promises";

const server = setupServer(
  rest.get("/image", async (req, res, ctx) => {
    const image = await readFile("./test/__fixtures__/image.gif");
    return res(ctx.set("Content-Type", "image/gif"), ctx.body(image));
  }),
  rest.get("/animation", async (req, res, ctx) => {
    const animation = await readFile("./test/__fixtures__/animation.gif");
    return res(ctx.set("Content-Type", "image/gif"), ctx.body(animation));
  }),
);

const setup = () => {
  // Establish API mocking before all tests.
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
};

export { setup };
