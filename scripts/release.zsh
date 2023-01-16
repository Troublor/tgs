#! /usr/bin/env zsh

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <major|minor|patch|prerelease>"
    exit 1
fi

DIR=${0:a:h}
ROOT=${DIR:h}

cmds=(jq yq git)

# shellcheck disable=SC2128
for cmd in $cmds; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Command $cmd not found. Please install it and try again."
        exit 1
    fi
done

# bump version
yarn version "$1"
v=$(jq -r .version "$ROOT"/package.json)

# update docker-compose.yaml
yq -i ".services.tgs.image = \"troublor/tgs:$v\"" "$ROOT"/docker-compose.yaml

# git commit
git add "$ROOT"/package.json "$ROOT"/docker-compose.yaml
git commit -m "chore: release v$v"
git tag "v$v"

# prepare next cycle
yarn version prerelease
git add "$ROOT"/package.json
git commit -m "chore: prepare next cycle"
