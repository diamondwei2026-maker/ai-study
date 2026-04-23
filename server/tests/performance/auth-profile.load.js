import autocannon from "autocannon";

const baseUrl = process.env.LOAD_TEST_BASE_URL ?? "http://localhost:3000";
const connections = Number(process.env.LOAD_TEST_CONNECTIONS ?? 200);
const duration = Number(process.env.LOAD_TEST_DURATION ?? 30);
const loginPhone = process.env.LOAD_TEST_PHONE ?? "13800138000";
const loginPassword = process.env.LOAD_TEST_PASSWORD ?? "Pass1234";
const refreshToken = process.env.LOAD_TEST_REFRESH_TOKEN ?? "";
const accessToken = process.env.LOAD_TEST_ACCESS_TOKEN ?? "";

function runScenario(title, options) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== ${title} ===`);

    const instance = autocannon(
      {
        url: `${baseUrl}${options.path}`,
        method: options.method,
        connections,
        duration,
        headers: options.headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        console.log({
          latencyP95: result.latency.p95,
          errors: result.errors,
          non2xx: result.non2xx,
          requestsPerSecond: result.requests.average,
        });
        resolve(result);
      },
    );

    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  await runScenario("POST /api/auth/login", {
    path: "/api/auth/login",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: {
      phone: loginPhone,
      password: loginPassword,
    },
  });

  if (refreshToken) {
    await runScenario("POST /api/auth/refresh", {
      path: "/api/auth/refresh",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: {
        refreshToken,
      },
    });
  } else {
    console.warn(
      "Skipped /api/auth/refresh scenario because LOAD_TEST_REFRESH_TOKEN is missing.",
    );
  }

  if (accessToken) {
    await runScenario("GET /api/user/profile", {
      path: "/api/user/profile",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } else {
    console.warn(
      "Skipped /api/user/profile scenario because LOAD_TEST_ACCESS_TOKEN is missing.",
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
