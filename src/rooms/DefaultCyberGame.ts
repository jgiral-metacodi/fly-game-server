import { GameSession } from "../cyber";
import { PlayerState } from "../cyber/schema/PlayerState";

export class DefaultCyberGame extends GameSession {
  //
  maxPlayers = 500;

  // fps
  tickRate = 20;
  patchRate = 20;
  reconnectTimeout = 0;
  iv: any;

  serverEngine = { enabled: true };

  async onPreload() {
    //
    this.logger.log("Preloading...");
  }

  static onAuth(token: any, request: any): Promise<void> {
    console.log("Authenticating...", token);
    return Promise.resolve();
  }

  async onJoin(player) {
    this.logger.log(player.sessionId, player.userId, "joined!");
  }

  onLeave(player) {
    this.logger.log(player.sessionId, player.userId, "left!");
  }

  onMessage(message: any, player: PlayerState): void {
    //
    super.onMessage(message, player);

    //
    // this.logger.log("Message received from", player.sessionId, message);
    // if (message.type === "collect") {
    //   //
    //   const coin = this.state.coins.get(message.coinId);
    //   if (coin.owner) {
    //     //
    //     console.error("Coin already collected by", coin.owner);
    //     return;
    //   }
    //   coin.owner = player.sessionId;
    //   // this.sendMint(player);
    // } else if (message.type == "declare-address") {
    //   // UNTRUSTED
    //   if (!message.address) return;
    //   player.address = message.address;
    // }
  }

  // async sendMint(player: PlayerState) {
  //   if (!player.address) return;

  //   const word = solidityPackedKeccak256(["string"], [crypto.randomUUID()]);

  //   const hashedMessage = solidityPackedKeccak256(
  //     ["address", "bytes32"],
  //     [player.address, word]
  //   );

  //   const { v, r, s } = Signature.from(
  //     await wallet.signMessage(getBytes(hashedMessage))
  //   );

  //   this.send(
  //     {
  //       type: "mint-opportunity",
  //       payload: {
  //         word,
  //         signature: { v, r, s },
  //       },
  //     },
  //     player.sessionId
  //   );
  // }

  // onUpdate(dt: number): void {
  //   this.logger.log("updating...");
  //   this.state.players.forEach((player) => {
  //     //
  //     player.position.x += 0.01;
  //   });
  // }

  onDispose() {
    this.logger.log("disposed");
  }
}
