import config from "@colyseus/tools";
import { rooms } from "./rooms";
import { initializeExpress } from "./express";
import { flyProxy, flyMachine, flyApp } from "./env";

const publicAddress =
  flyProxy && flyMachine ? `${flyProxy}/${flyMachine}` : null;

export default config({
  options: {
    publicAddress,
  },
  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    Object.keys(rooms).forEach((key) => {
      gameServer.define(key, rooms[key]);
    });
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    initializeExpress(app);
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
    console.log("Fly app:", flyApp);
    console.log("Fly machine:", flyMachine);
    console.log("Fly proxy:", flyProxy);

    if (publicAddress) {
      console.log(`Public address is ${publicAddress}`);
    }
  },
});
