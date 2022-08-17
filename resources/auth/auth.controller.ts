import { Context, createHttpError } from "oak";
import { compare, genSalt, hash } from "bcrypt";
import { Status } from "std/http/http_status.ts";
import { getNumericDate, sign } from "../../common/jwt.ts";
import { User } from "../user/user.model.ts";
import { JWT_CRYPTO_KEY } from "../../common/config.ts";

export async function signup(ctx: Context) {
  const { name, email, password } = await ctx.request.body({ type: "json" })
    .value;
  const user = await User.findOne({ email });
  if (user) {
    throw createHttpError(
      Status.Conflict,
      "User with this email already exists",
    );
  } else {
    // TODO Move JWT token generation to User model once API is provided
    const _id = await User.insertOne({
      name,
      email,
      password: await hash(password, await genSalt()),
    });
    const iat = getNumericDate(new Date());
    const exp = iat + 60 * 60 * 24;
    const token = await sign({ sub: _id, iat, exp }, JWT_CRYPTO_KEY);
    ctx.response.status = Status.Created;
    ctx.response.body = { token, data: { user: { _id, name, email } } };
    // TODO Should the JWT token be sent as a cookie?
    ctx.cookies.set("token", token, { httpOnly: true });
  }
}

export async function signin(ctx: Context) {
  const body = await ctx.request.body().value;
  const user = await User.findOne({
    email: body.email,
  }) as {
    _id: string;
    password: string;
    isAdmin: boolean;
  };
  if (!user) {
    throw createHttpError(
      Status.BadRequest,
      "Incorrect email address or password",
    );
  }
  const isPasswordCorrect = await compare(
    body.password,
    user.password,
  );
  if (!isPasswordCorrect) {
    throw createHttpError(
      Status.BadRequest,
      "Incorrect email address or password",
    );
  } else {
    ctx.response.status = Status.OK;
    // TODO Move JWT token generation to User model once API is provided
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60 * 24;
    ctx.response.body = {
      _id: user._id,
      token: await sign({
        sub: user._id,
        iat,
        exp,
        isAdmin: user.isAdmin,
      }, JWT_CRYPTO_KEY),
    };
  }
}

export function removeAccount(ctx: Context) {
  // TODO
}
