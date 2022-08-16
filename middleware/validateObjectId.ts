import { LOGGER } from "../common/Logger.ts";
import { RouteParams, RouterContext } from "../deps.ts";

const OBJECT_ID_REGEX = /^[0-9a-f]{24}$/;

export function validateObjectId<T extends string>(_id: string | string[]) {
  return async function (
    ctx: RouterContext<T, RouteParams<T>>,
    next: () => Promise<unknown>,
  ) {
    if (Array.isArray(_id)) {
      if (_id.every((id) => validate(ctx.params[id]))) {
        LOGGER.debug("ObjectID is valid");
        await next();
      } else {
        LOGGER.debug("ObjectID is NOT valid");
        ctx.response.status = 400;
        ctx.response.body = "Invalid ObjectIds";
      }
    } else {
      if (validate(ctx.params[_id])) {
        LOGGER.debug("ObjectID is valid");
        await next();
      } else {
        LOGGER.debug("ObjectID is NOT valid");
        ctx.response.status = 400;
        ctx.response.body = "Invalid ObjectId";
      }
    }
  };
}

function validate(string: string | undefined) {
  return string && OBJECT_ID_REGEX.test(string);
}
