# Logistics Operation Command (LOC)

This tool is specifically made for the game "Foxhole". Its purpose is to
coordinate frontline logistics for large operations. It provides a Foxhole map
and the ability to create and coordinate delivery orders.

Drivers can pick up and deliver parts of these orders while others track their
status and progress.

## Set Up the Development Environment

### Install Dependencies

```shell
cd /path/to/repo/
npm install
```

Alternatively, use `npm ci` to install the exact versions specified in the lockfile.

### Configure Discord OAuth

This tool uses Discord OAuth as a social login provider. To use and test the
tool, you must log in through Discord.

Create or use an application in the [Discord Developer Portal](https://discord.com/developers/applications).
Then configure the following redirect URI under **OAuth2 > Redirects**. Click
**Add Redirect** or **Add Another** and enter `${BASE_URL}/auth/callback/discord`.

For a local development environment, use:

```text
http://localhost:4200/auth/callback/discord
```

### Configure the Application

1. Copy `/backend/.env.example` to `/backend/.env`.
2. Configure `BETTER_AUTH_SECRET`.
3. Add your Discord application's client ID and client secret. You can find
   these in the developer portal under your application's **OAuth2** settings.
4. Add a Discord guild/server ID. This can be any Discord server that you are
   a member of. Only members of that server can log in.

   See [Where can I find my User/Server/Message ID?](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID)
   for help finding these IDs.

### Configure the Asset CDN

Optionally configure the CDN in
[`environment.development.ts`](/frontend/src/environments/environment.development.ts).

- By default, the development environment does not use a CDN and serves local
  vanilla assets. Map and icon mods are disabled.
- The production configuration, used when building or deploying containers,
  has a CDN preconfigured and mods enabled.
- To use the production CDN during development, comment out the development
  configuration. You can also configure your own CDN and mods.
- The default production CDN is based on [jsDelivr](https://www.jsdelivr.com/)
  and the [qmob-assets repository](https://github.com/Gilbert-S/qmob-assets).
  Clone and use your own asset repository for production because you do not
  control the default repository.


### Vite Proxy

When you serve the development environment with `npm start` (`ng serve`), the
Vite proxy mirrors the reverse-proxy setup used by the production build. This
avoids the need for additional CORS configuration.

The frontend uses its own base URL and accesses the backend through the `/auth`
and `/socket.io` paths instead of a separate backend URL such as
`http://localhost:3000/socket.io`.

- [Frontend proxy configuration](/frontend/proxy.conf.json)
- [Angular serve/proxying](https://angular.dev/tools/cli/serve#proxying-to-a-backend-server)

### Run the Application

In the first shell, start the backend:

```shell
npm start --workspace=backend
```

In a second shell, start the frontend:

```shell
npm start --workspace=frontend
```

When both services are running, browse to
[http://localhost:4200](http://localhost:4200) and log in.

## Deploy to a Container Environment

The container images are not currently prebuilt or published to a registry.
Build them locally or on the target Docker host.

### Configure the Deployment

1. Copy `/container.env.example` to `/container.env`.
2. Add the required settings, including the base URL, secrets, Discord
   application client ID and secret, and Discord server ID.

### Select the Docker Context

Make sure you use the correct Docker context when deploying remotely:

```shell
docker context ls
docker context use {my-vps-ssh-context}
```

### Build and Start the Containers

```shell
docker compose --env-file container.env up -d --build
```

This builds the container images and starts the services.

### HTTPS / TLS

- If the base URL uses `https://`, give the Caddy web server and Let's Encrypt
  a minute or two to acquire TLS certificates.
- Certificate issuance fails if the base URL is invalid or the domain's DNS
  records do not point to the host running the containers.
- Caddy also issues self-signed certificates for localhost URLs and IP
  addresses. See [Caddy local HTTPS](https://caddyserver.com/docs/automatic-https#local-https).
- You can use an `http://` base URL instead, but HTTPS is recommended outside
  a development environment.

You can modify `/frontend/dockerfile`, update the Caddy configuration, and copy
your own certificates if you prefer to manage certificates instead of using
Let's Encrypt.

### Use the Application

Browse to the configured base URL and start testing.