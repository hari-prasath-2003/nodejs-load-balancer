import type { BackendPoolMap } from "./BackendPoolMap.js";
import type { LoadBalancerAlgorithms } from "./LoadBalancerAlgorithms.js";

export type ClusterMessage =
  | {
      from: "MASTER";
      type: "INIT_ROUTING_CONFIG";
      backendPool: BackendPoolMap;
      loabBalancerAlgorithm: LoadBalancerAlgorithms;
    }
  | {
      from: "MASTER";
      type: "UPDATE_LB_ALGORITHM";
      newAlgorithm: LoadBalancerAlgorithms;
    };
