import {
  LOAD_BALANCER_ALGORITHMS,
  type LoadBalancerAlgorithms,
} from "@/interface/LoadBalancerAlgorithms.js";

export function isClusterMessage(message: unknown) {
  if (!message && typeof message !== "object") return false;

  const msg = message as Record<string, unknown>;

  if (!("type" in msg)) return false;

  if ("from" in msg && msg.from !== "MASTER" && msg.from !== "WORKER")
    return false;

  return true;
}

export function isValidLBAlgorithm(
  value: any,
): value is LoadBalancerAlgorithms {
  return (
    typeof value === "string" &&
    LOAD_BALANCER_ALGORITHMS.includes(value as LoadBalancerAlgorithms)
  );
}
