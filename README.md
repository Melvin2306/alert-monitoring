# changedetectionio-tor

This Docker Compose stack provides a [changedetection.io](https://github.com/dgtlmoon/changedetection.io) instance with [Playwright](https://github.com/microsoft/playwright) browser steps support and ready to use configuration for using [Tor](https://www.torproject.org/) for all your watches.

## Tor HTTP Proxy

This stack is using [avpnusr/torprivoxy](https://github.com/avpnusr/torprivoxy) as HTTP proxy to tunnel your requests through the Tor network. Make sure you have selected "Tor Network" within the "Request" tab of the given watch. By default its enabled for all watches.

You can disable using tor for single watches by choosing "Direct" within the "Request" tab of the given watch.

Make sure the `proxies.json` is present in the toplevel of your datastore directory if you run into problems. The content of `proxies.json` is based on the changedetection.io documentation.

## Email Configuration

This application supports email notifications for website changes. To set up email notifications:

1. Run the provided setup script:

   ```bash
   chmod +x setup-smtp.sh
   ./setup-smtp.sh
   ```

2. Follow the prompts to configure your SMTP settings with your email provider.

3. After configuration, restart the application to apply changes:

   ```bash
   docker compose restart main-app
   ```

For detailed instructions and troubleshooting tips, see [SMTP-SETUP.md](SMTP-SETUP.md).

## Example

An example watch is provided within [`url-watches.json`](datastore/url-watches.json). It will check the Tor api and returns your exit IP and if the connection was established via the Tor nework.

## Credits

I do not own any of the projects. Credits go to the maintainers of each project.
