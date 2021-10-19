const os = require('os');
const fs = require('fs');
const path = require('path');

module.exports = {
    LISTENING_PORT: process.env.PORT || 3030,
    LISTENING_HOST: '192.168.43.176',
    SERVER_OPTIONS: {
        key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
    },
    URI: 'mongodb://localhost/Onclassroom',
    DB_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    },

    mediasoup: {
        numWorkers: Object.keys(os.cpus()).length,
        // mediasoup Worker settings.
        worker: {
            logLevel: 'warn',
            logTags: [
                'info',
                'ice',
                'dtls',
                'rtp',
                'srtp',
                'rtcp'
            ],
            rtcMinPort: 40000,
            rtcMaxPort: 49999
        },
        // mediasoup Router settings.
        router: {
            // Router media codecs.
            mediaCodecs: [{
                    kind: 'audio',
                    mimeType: 'audio/opus',
                    clockRate: 48000,
                    channels: 2
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP8',
                    clockRate: 90000,
                    parameters: {
                        'x-google-start-bitrate': 1000
                    }
                },
                {
                    kind: 'video',
                    mimeType: 'video/VP9',
                    clockRate: 90000,
                    parameters: {
                        'profile-id': 2,
                        'x-google-start-bitrate': 1000
                    }
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '4d0032',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000
                    }
                },
                {
                    kind: 'video',
                    mimeType: 'video/h264',
                    clockRate: 90000,
                    parameters: {
                        'packetization-mode': 1,
                        'profile-level-id': '42e01f',
                        'level-asymmetry-allowed': 1,
                        'x-google-start-bitrate': 1000
                    }
                }
            ]
        },
        // mediasoup WebRtcTransport settings.
        webRtcTransport: {
            listenIps: [
                // change 192.0.2.1 IPv4 to your server's IPv4 address!!
                { ip: '192.168.43.176', announcedIp: null }

                // Can have multiple listening interfaces
                // change 2001:DB8::1 IPv6 to your server's IPv6 address!!
                // { ip: '2001:DB8::1', announcedIp: null }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            enableSctp: true,
            initialAvailableOutgoingBitrate: 1000000,
            minimumAvailableOutgoingBitrate: 600000,
            // Additional options that are not part of WebRtcTransportOptions.
            maxIncomingBitrate: 1500000
        }
    }
}