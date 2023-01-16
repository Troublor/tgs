# Troublor General Purpose Server

## Dependency

```
yarn
```

The program depends on `PostgreSQL`, and several other programs specified in `src/system-dependency.ts`.
But they are optional to install if one uses docker image to deploy.

## Build

```
yarn build
```

## Usage

### Configuration

The program relies on a configuration file, which is by default `config.yaml` but can be alternatively specified
by `TGS_CONFIG` environment variable.
`config.dev.yaml` and `config.prod.yaml` are provided as examples.
The schema is defined in `src/config/schema.ts`.

The program also relies on `rclone`, whose config `rclone.conf` should be put in `.rclone` folder with OneDrive
authentication.

### Run

```
yarn dev
```

for development mode, or

```
yarn start
```

for production mode.

`docker-compose.yaml` provides an example of how to run the program in production mode with docker image.

## Deployment

```
yarn release [minor|major|patch]
```

Any tag `vx.x.x` pushed to the repository will trigger a GitHub Action to publish a docker image with that version.

## License

[MIT](LICENSE)
