// Require needed modules
    const Hapi = require('hapi');
    const Pusher = require('pusher');
    const Path = require('path');
    const Inert = require('inert');


    // Initialise Hapi.js server
    const server = Hapi.server({
      port: process.env.port || 4000,
      host: 'localhost',
      routes: {
        files: {
          relativeTo: Path.join(__dirname, 'public')
        }
      }
    });

    // Initialize Pusher
    const pusher = new Pusher({
      appId: 'APP_ID',
      key: 'APP_KEY',
      secret: 'APP_SECRET',
      cluster: 'APP_CLUSTER',
      encrypted: true
    });


    const init = async () => {

      // register static content plugin
      await server.register(Inert);

      // index route / homepage
      server.route({
        method: 'GET',
        path: '/',
        handler: {
          file: 'index.html'
        }
      });


      // store contact
      server.route({
        method: 'POST',
        path: '/contact',
        handler(request, h) {
          const { contact } = JSON.parse(request.payload);
          const randomNumber = Math.floor(Math.random() * 100);
          const genders = ['men', 'women'];
          const randomGender = genders[Math.floor(Math.random() * genders.length)];
          Object.assign(contact, {
            id: `contact-${Date.now()}`,
            image: `https://randomuser.me/api/portraits/${randomGender}/${randomNumber}.jpg`
          });
          pusher.trigger('contact', 'contact-added', { contact }); // pusher.trigger( channels, event, data, socketId, callback );

          return contact;
        }
      });


      // delete contact
      server.route({
        method: 'DELETE',
        path: '/contact/{id}',
        handler(request, h) {
          const { id } = request.params;
          pusher.trigger('contact', 'contact-deleted', { id });
          return id;
        }
      });

      // start server
      await server.start();
      console.log(`Server running at: ${server.info.uri}`);
    };

    // handle all unhandled promise rejections
    process.on('unhandledRejection', err => {
      console.log(err);
      process.exit(1);
    });

    // Start application
    init();