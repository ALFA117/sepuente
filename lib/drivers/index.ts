import { env } from "../env";
import { MockDriver } from "./mock";
import { EtherfuseDriver } from "./etherfuse";
import type { RampDriver } from "./types";

let _driver: RampDriver | null = null;

export function getDriver(): RampDriver {
  if (!_driver) {
    _driver = env.DRIVER === "etherfuse" ? new EtherfuseDriver() : new MockDriver();
  }
  return _driver;
}

export type { RampDriver } from "./types";
