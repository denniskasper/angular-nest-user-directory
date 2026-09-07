#!/usr/bin/env bash
#
# Smoke test against the built image.
#
# The browser specs run against the development server, which serves the
# frontend itself and proxies the API. They therefore say nothing about what
# is actually shipped: one Node process serving the built frontend beside
# the API, the SPA fallback, the cache rules, the compression and the
# headers. This script checks exactly that layer, against the image that is
# about to go live.
#
# Usage:
#     docker build -t user-directory .
#     docker run -d -p 3000:3000 user-directory
#     deploy/smoke-test.sh              # or: deploy/smoke-test.sh https://…
#
set -euo pipefail

BASE="${1:-http://127.0.0.1:3000}"
failed=0

# Compared in lower case: HTTP/2 lower-cases header names, HTTP/1.1 keeps
# them as the server sends them.
headers() {
    curl -sS -D - -o /dev/null "$@" | tr '[:upper:]' '[:lower:]'
}

expect() {
    local what="$1" actual="$2" wanted="$3"
    if [[ "$actual" == *"$wanted"* ]]; then
        printf '  ok      %s\n' "$what"
    else
        printf '  MISSING %s\n          expected: %s\n' "$what" "$wanted"
        failed=1
    fi
}

expect_not() {
    local what="$1" actual="$2" unwanted="$3"
    if [[ "$actual" != *"$unwanted"* ]]; then
        printf '  ok      %s\n' "$what"
    else
        printf '  FOUND   %s\n          must not contain: %s\n' "$what" "$unwanted"
        failed=1
    fi
}

# The container needs a moment after starting, and the first start also
# runs Normalization. The same route as the image's HEALTHCHECK.
printf 'Waiting for %s\n' "$BASE"
for _ in $(seq 30); do
    curl -sS -o /dev/null "$BASE/api" 2>/dev/null && break
    sleep 1
done

printf 'Smoke test against %s\n' "$BASE"

expect 'the API answers at its root' "$(curl -sS "$BASE/api")" '"roles"'
expect 'all 100 Users are listed' \
    "$(curl -sS "$BASE/api/users" | grep -o '"id":' | wc -l)" '100'
expect 'a repaired text id is fetched as a number' \
    "$(curl -sS "$BASE/api/users/74")" '"id":74'
expect 'a missing User is a JSON 404' \
    "$(headers "$BASE/api/users/999999")" 'content-type: application/json'
expect 'the API documentation is served' \
    "$(headers "$BASE/api/docs")" 'http/1.1 200'

# The root serves the application, not a directory listing or a 404.
root="$(curl -sS "$BASE/")"
expect 'the root serves the application' "$root" '<app-root>'

# Without the fallback, a device with a stale or mistyped address would get
# a bare 404 and the router would never run.
expect 'the SPA fallback serves the application on a deep route' \
    "$(curl -sS "$BASE/users/7")" '<app-root>'
expect 'the SPA fallback serves the application on /smiley' \
    "$(curl -sS "$BASE/smiley")" '<app-root>'
expect_not 'the SPA fallback stays out of the API' \
    "$(curl -sS "$BASE/api/nothing")" '<app-root>'

# The name of the built bundle is known only to the served index.html; it
# changes with every build.
asset="$(printf '%s' "$root" | grep -o 'main-[A-Za-z0-9]*\.js' | head -1)"
if [[ -z "$asset" ]]; then
    printf '  MISSING index.html refers to a built main-*.js\n'
    exit 1
fi

# Hashed files for a year, index.html never: it carries no hash and names
# the hashed ones.
expect 'the bundle may be cached for a year' \
    "$(headers "$BASE/$asset")" 'immutable'
expect 'index.html may not be cached' \
    "$(headers "$BASE/")" 'cache-control: no-cache'
expect 'the deep route may not be cached either' \
    "$(headers "$BASE/users/7")" 'cache-control: no-cache'

expect 'the bundle is compressed' \
    "$(headers -H 'Accept-Encoding: gzip' "$BASE/$asset")" 'content-encoding: gzip'
expect 'the list is compressed' \
    "$(headers -H 'Accept-Encoding: gzip' "$BASE/api/users")" 'content-encoding: gzip'

for path in '/' "/$asset" '/api/users'; do
    expect "nosniff is set on $path" "$(headers "$BASE$path")" 'x-content-type-options: nosniff'
done
expect_not 'the server does not name its framework' \
    "$(headers "$BASE/")" 'x-powered-by'

exit "$failed"
