module.exports = () => ({
    app: {
        secret: '',
        port: process.env.PORT || 5000,
        logging: true,
        sessions: {
            version: '1'
        }
    },
    security: {
        frames: { action: 'sameorigin' },
        cors: {
            allowOrigins: [/\.localhost$/]
        }
    },
    email: {
        transport: '',
        mailgun: {

        },
        smtp: {

        }
    },
    db: {
        adapter: 'mongoose',
        url: ''
    },
    cache: {
        url: '',
        ignore: false,
        prefix: 'app',
        expiration: 60 * 60,
    },
    media: {
        adapter: 's3',
    },
    sockets: {
        enabled: true,
        path: '/socket.io',
    }
})