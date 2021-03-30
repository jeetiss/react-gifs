import { rest } from "msw";
import { setupServer } from "msw/node";
import { readFile } from "fs/promises";

const imageP = readFile("./test/__fixtures__/image.gif");
const animationP = readFile("./test/__fixtures__/animation.gif");

const server = setupServer(
  rest.get("/image", async (req, res, ctx) => {
    const image = await imageP;
    return res(ctx.set("Content-Type", "image/gif"), ctx.body(image));
  }),
  rest.get("/animation", async (req, res, ctx) => {
    const animation = await animationP;
    return res(ctx.set("Content-Type", "image/gif"), ctx.body(animation));
  }),
  rest.get("/error", async (req, res, ctx) => {
    const image = await imageP;
    return res(ctx.set("Content-Type", "image/png"), ctx.body(image));
  })
);

const setup = () => {
  // Establish API mocking before all tests.
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
};

export { setup };
