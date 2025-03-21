//const BASE_URL = "http://localhost:3001";
const BASE_URL = "https://game-gen-git-segs-oncyber.vercel.app";
const GAME_API_URL = `${BASE_URL}/api/games/awe`;

const GAME_SERVER_KEY = process.env.GAME_SERVER_KEY;

delete process.env.GAME_SERVER_KEY;

export class GameApi {
  //
  static async loadGameData(opts: { id: string; draft?: boolean }) {
    // fetch the space here...
    const url = `${GAME_API_URL}?gameId=${opts.id}&draft=${opts.draft}`;
    // console.log("url", url);
    const reponse = await fetch(url, {
      headers: {
        "x-server-key": GAME_SERVER_KEY,
      },
    });

    if (!reponse.ok) {
      throw new Error("failed to load game data");
    }

    const result = await reponse.json();

    return result;
  }

  static async auth(token: string) {
    const response = await fetch(`${GAME_API_URL}/auth/${token}`);

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    return result.data?.userId;
  }
}
