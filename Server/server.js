const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');
const io = require("./lib/socketserver");
const socket = require('./subservers/socket');
const passport = require('passport');
const config = require('./config/config');
const mediasoup = require('mediasoup');
const logger = require('./logger');


const mediasoupWorkers = [];
logger.mediasoups(mediasoup);
//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();

//Configure our app
app.use(cors());
app.use(require('morgan')('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(session({ secret: 'Onclassroom', cookie: { maxAge: 60000000 }, resave: false, saveUninitialized: false }));

//Public files
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')))


if (!isProduction) {
    app.use(errorHandler());
}

//Error handlers & middlewares
if (!isProduction) {
    app.use((err, req, res, next) => {
        console.log("error", err);
        return res.status(400).json({ err });
    });
}

//Configure Mongoose
mongoose.connect(config.URI, config.DB_OPTIONS)
    .then(() => {
        // models
        require('./apps/models');
        require('./apps/user/models');
        require('./apps/homepage/models');
        require('./apps/meetiing/models');
        require('./apps/exam/question.models');
        require('./apps/exam/models');
        //configure passport
        require('./config/passport');
        app.use(passport.initialize())
        app.use(passport.session())
            //configure routes
        app.use(require('./apps/routes'));
        //server
        runMediasoupWorkers();
        const server = require("https").createServer(config.SERVER_OPTIONS, app)
            .listen(config.LISTENING_PORT, config.LISTENING_HOST, () => {
                console.log(`Server running on https://${config.LISTENING_HOST}:${config.LISTENING_PORT}/`)
            });

        socket.ioserver(server, mediasoupWorkers);
        //io.ioserver(server);
    });
mongoose.set('debug', true);

async function runMediasoupWorkers() {
    const { numWorkers } = config.mediasoup;

    console.info('running %d mediasoup Workers...', numWorkers);

    for (let i = 0; i < numWorkers; ++i) {
        const worker = await mediasoup.createWorker({
            logLevel: config.mediasoup.worker.logLevel,
            logTags: config.mediasoup.worker.logTags,
            rtcMinPort: config.mediasoup.worker.rtcMinPort,
            rtcMaxPort: config.mediasoup.worker.rtcMaxPort
        });

        worker.on('died', () => {
            logger.error(
                'mediasoup Worker died, exiting  in 2 seconds... [pid:%d]', worker.pid);

            setTimeout(() => process.exit(1), 2000);
        });

        mediasoupWorkers.push(worker);
    }
}