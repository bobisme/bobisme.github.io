#!/usr/bin/env bash
set -euo pipefail

rm -rf static/pgmm static/pgqp
cp -R pgmm static/pgmm
cp -R pgqp static/pgqp
