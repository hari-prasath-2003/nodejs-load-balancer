class HealthChecker {
  startHealthCheck(
    path: string,
    address: string,
    markServerUnhealthy: (path: string, string: string) => void,
  ) {
    setInterval(() => {
      let failure = true;
      if (failure) {
        markServerUnhealthy(path, address);
      }
    });
  }
}
