import jwt from "jsonwebtoken";

const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY;
delete process.env.SECRET_JWT_KEY;

export function verify(token): { uid: string; privyId: string } {
  //
  try {
    // console.log("verify token", token);
    const decodedToken = jwt.verify(token, SECRET_JWT_KEY) as any;
    // console.log("decodedToken", decodedToken);

    return decodedToken;
  } catch (e) {
    console.error("verify token error", e);
    return null;
  }
}
