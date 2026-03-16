export const LOAD_BALANCER_ALGORITHMS = [
  "round-robin",
  "least-connections",
] as const;

export type LoadBalancerAlgorithms = (typeof LOAD_BALANCER_ALGORITHMS)[number];
