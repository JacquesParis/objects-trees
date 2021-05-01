const application = require('./dist/main');

module.exports = application;

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT || 80),
      host: process.env.HOST || '192.168.137.1',
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
      // Use the LB4 application as a route. It should not be listening.
      listenOnStart: false,
    },
    serverSecretKey: process.env.SECRET || 'please change secret key',
  };
  application.main(config).catch((err) => {
    console.trace('Cannot start the application.', err);
    process.exit(1);
  });
}
