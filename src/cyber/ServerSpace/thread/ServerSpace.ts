import type { RoomState } from "../../schema/RoomState";
import * as ethers from "ethers";
import * as Tokens from "../../libs/tokens";
import { exitGame, loadGame } from "../loadGame";
import { ServerApi, ServerHandler } from "./ServerApi";
// @ts-ignore
import { Web3Api, LocalProvider } from "@oogg/server-engine";
import { PlayerData } from "../../abstract/types";
import { PrivyServer } from "../../libs/PrivyServer";

export interface ServerSpaceParams {
  gameData: any;
  debugPhysics?: boolean;
  isDraft?: boolean;
  serverHandler: ServerHandler;
}

export class ServerSpace {
  //
  engine = null;
  playerManager = null;
  space = null;
  spawn: any = null;
  // avatar = null;
  // coins = null;
  // coinModel = null;

  state: RoomState = null;

  serverApi: ServerApi = null;

  dt = 1 / 60;
  iv = null;
  time = 0;

  maxFrame = 0;
  avgFrame = 0;

  static create() {
    //
    globalThis.$$serverSpace = new ServerSpace();
  }

  constructor() {}

  private canLoadComponent(component: any) {
    // this is a little hacky, should be moved to the engine
    // But since this still can change often, keeping it here
    // so that we can make quick changes
    return (
      component.type === "prefab" ||
      component.type === "script" ||
      component.type === "model" ||
      component.type === "mesh" ||
      component.type === "group" ||
      component.type === "avatar" ||
      component.type === "navmesh" ||
      // This will be handled by the engine by checking
      // either (deprecate) "use server" or config.server == true
      component.type?.startsWith("script") ||
      component.collider?.enabled ||
      component.script?.tag?.includes("@server") ||
      component.type === "spawn"
    );
  }

  async init(opts: ServerSpaceParams) {
    //
    const { gameData } = opts;

    this.spawn = gameData.components["spawn"];

    this.serverApi = new ServerApi(opts.serverHandler);

    const secrets = gameData.components.multiplayer?.secrets;

    secrets?.forEach((secret) => {
      process.env[secret.key] = secret.value;
    });

    /*
    this is causing weird issues on fly.io servers
    GlobalRegistrator.register({
      url: "http://localhost:3000",
      width: 1920,
      height: 1080,
    });
    */

    console.log("Loading game space...");

    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const ALCHEMY_KEY = process.env.ALCHEMY_KEY;

    delete process.env.PRIVATE_KEY;
    delete process.env.ALCHEMY_KEY;

    const res = await loadGame(gameData, {
      debugPhysics: opts.debugPhysics ?? true,
      serverApi: {
        GameServer: this.serverApi,
        Ai: this.serverApi.ai,
        Web3: new Web3Api({
          web3provider: new LocalProvider({
            privateKey: PRIVATE_KEY,
            alchemyKey: ALCHEMY_KEY,
          }),
        }),
        Tokens: Tokens,
        PrivyServer: new PrivyServer(),
      },
      serverLibs: {
        ethers,
      },
      isDraft: opts.isDraft ?? true,
      filter: (component: any) => {
        return this.canLoadComponent(component);
      },
    });

    this.engine = res.engine;

    this.playerManager = res.players;

    this.space = this.engine.getCurrentSpace();

    console.log("Game space loaded");

    // this.coins = coins;
    this.space.physics.active = true;

    this.space.physics.update(1 / 60);

    this.time = Date.now() / 1000;

    this.iv = setInterval(() => {
      const now = Date.now() / 1000;
      let dt = now - this.time;
      this.time = now;
      this.update(dt);
      const dts = Date.now() / 1000 - now;
      //
      this.maxFrame = Math.round(Math.max(dts, this.maxFrame) * 1000);
      this.avgFrame = Math.round(dts * 1000);
    }, 1000 / 60);

    return {
      entities: this.serverApi._entitiesSchema,
    };
  }

  async handleRpcRequest({ request, sessionId }) {
    //
    const { data, msgId } = request;

    let isReq = !!data.method;

    let event = isReq
      ? this.engine.Events.RPC_REMOTE_REQ
      : this.engine.Events.RPC_REMOTE_RES;

    this.engine.notify(event, {
      data,
      msgId,
      sessionId,
    });
  }

  private _getRpcRecipient(rpcId: string) {
    //
    return this.space.components.find((c) => {
      return c._rpcId === rpcId;
    });
  }

  startGame() {
    //
    this.space.start();
  }

  stopGame() {
    //
    this.space.stop();
  }

  async onJoin(player: PlayerData) {
    //
    if (this.space == null) {
      console.error("Space not loaded!");
      return;
    }

    const p = this.playerManager.addPlayer(player, {
      collision: true,
    });

    // console.log("Added player", player.sessionId);
    // console.log("Players", Object.keys(this.playerManager.players));

    this.serverApi._roomJoin(player);

    await p.avatarReady;
  }

  _netstateCache = new WeakMap<{ version: number; state: any }>();

  onBeforePatch() {
    //
    const entities = this.serverApi._entitiesSchema;

    let state = {
      players: {},
      entities: {},
    };

    Object.keys(entities).forEach((entity) => {
      //
      const cs = this.space.components.byType(entity);

      cs.forEach((c) => {
        //
        let current = c.data.netState;

        if (current) {
          //
          let cached = this._netstateCache.get(c);

          if (cached == null) {
            cached = {
              version: 0,
              state: undefined,
              rpcId: c._rpcId,
            };
            this._netstateCache.set(c, cached);
          }

          if (cached.state !== current) {
            cached.state = current;
            cached.version++;
          } else {
            return;
          }
          state.entities[entity] ??= [];
          state.entities[entity].push(cached);
        }
      });
    });

    Object.keys(this.playerManager.players).forEach((sessionId) => {
      //
      const player = this.playerManager.players[sessionId];

      state.players[sessionId] = player.data;
    });

    return state;
  }

  onLeave(player: PlayerData) {
    //
    this.playerManager.removePlayer(player.sessionId);

    this.serverApi._roomLeave(player);
  }

  onPlayerState(data: PlayerData, isAuth = false) {
    //
    const player = this.playerManager.get(data.sessionId);

    if (this.spawn.useUserAvatar && player.avatar) {
      if (data.vrmUrl && data.vrmUrl !== player.avatar.vrmUrl) {
        // console.log(
        //   "Update VRM",
        //   data.sessionId,
        //   data.vrmUrl,
        //   player.avatar.collider.raw.radius()
        // );
        player.avatar.updateVRM(data.vrmUrl).then(() => {
          // TODO, move to engine
          const dims = player.avatar.getDimensions();
          player.avatar.rigidBody?._updateColliders(dims);
          // console.log("VRM Updated", player.avatar.collider.raw.radius());
        });
      }
    }

    if (!isAuth) {
      //
      const avatar = player.avatar;

      avatar.position.set(
        data.position.x || avatar.position.x,
        data.position.y || avatar.position.y,
        data.position.z || avatar.position.z
      );

      avatar.rotation.y = data.rotation.y || avatar.rotation.y;

      if (avatar.collider) {
        avatar.collider.rigidBody.setTranslation(avatar.position);
        avatar.collider.rigidBody.setRotation(avatar.quaternion);
      }

      if (data.animation && data.animation !== avatar.animation) {
        avatar.animation = data.animation;
      }

      if (data.scale && data.scale !== avatar.avatarScale) {
        avatar.avatarScale = data.scale;
      }

      if (data.text != null && data.text !== avatar.text) {
        avatar.text = data.text;
      }
    }

    this.serverApi._roomPlayerState(data);
  }

  private _accumulatedTime = 0;

  update(dt: number) {
    //
    let now = Date.now() / 1000;

    this.engine.notify(this.engine.Events.ANIM_UPDATE, this.dt, now);

    this.engine.notify(this.engine.Events.PRE_UPDATE, this.dt, now);

    this._accumulatedTime += dt;

    while (this._accumulatedTime >= this.dt) {
      //
      this.engine.notify(this.engine.Events.FIXED_UPDATE, this.dt, now);

      this.space.physics.updateFixed(this.dt);

      this._accumulatedTime -= this.dt;

      now += this.dt;
    }

    this.engine.notify(
      this.engine.Events.JUST_AFTER_PHYSICS_UPDATE,
      this.dt,
      now
    );
  }

  dispose() {
    //
    // GlobalRegistrator.unregister();
    try {
      //
      console.log("Disposing game space");

      this.stopGame();

      clearInterval(this.iv);

      exitGame();
    } catch (err) {
      //
      console.error("Error disposing dispace", err);
    }
  }
}
