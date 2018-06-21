module.exports = () => ({
    app: {
        secret: '',
        port: process.env.PORT || 5000,
        logging: true,
        paths: {
            confirmEmail: '/confirm-email',
            magicLink: '/login'
        },
        sessions: {
            version: 1, // included in every token to easily revoke all tokens
            authorizationDuration: 5 * 60, // 5m
            accessDuration: 60 * 60, // 1h
            accessLongDuration: 7 * (60 * 60 * 24), // 1w
            refreshDuration: 30 * (60 * 60 * 24) // 30d
        }
    },
    security: {
        frames: { action: 'sameorigin' },
        cors: {
            whitelist: [/\.localhost$/]
        },
        sanitize: {
            all: {
                allowedTags: [],
            },
            normal: {
                allowedTags: ['h1','h2','p','a','blockquote','ol','ul','li','strike','strong','em','b','i','table','thead','tbody','tr','td','th']
            },
            none: {
                allowedTags: ['h1','h2','h3','h4','h5','h6','p','a','blockquote','ol','ul','li','strike','strong','em','b','i','table','thead','tbody','tr','td','th','img','video','iframe']
            }
        }
    },
    email: {
        transport: '',
        from: 'My App <noreply@myapp.com>',
        mailgun: {
            key: process.env.MAILGUN_KEY,
            domain: process.env.MAILGUN_DOMAIN,
        },
        smtp: {
            pool: false,
            maxConnections: 5,
            maxMessages: 100,
            host: 'smtp.gmail.com',
            secure: true,
            port: 465,
            // auth: {
            //     user: '',
            //     pass: '',
            // }
        }
    },
    db: {
        adapter: 'mongoose',
        url: process.env.MONGODB_URI
    },
    cache: {
        url: process.env.ELASTIC_SSL_URL,
        ignore: false,
        prefix: 'app',
        expiration: 60 * 60,
    },
    media: {
        adapter: 's3',
        local: {
            root: './data'
        },
        s3: {
            uri: process.env.AWS_S3_URI,
            publicUri: process.env.AWS_S3_ENDPOINT,
            aws_access_key_id: process.env.AWS_ACCESS_KEY_ID,
            aws_access_key_secret: process.env.AWS_SECRET_ACCESS_KEY,
            region: 'us-east-1',
            bucket: '',
        },
        folders: ['files'],
        types: {
            images: ['image/png', 'image/jpeg', 'image/gif'],
            files: ['application/pdf','application/octet-stream'],
            audio: ['audio/webm','audio/ogg','audio/mpeg3','audio/x-mpeg-3','audio/wav','audio/x-wav','audio/x-ms-wma','audio/aac','audio/mp4','audio/flac'],
            video: ['video/webm','video/mp4']
        },
        extensions: {
            images: ['png','jpg','jpeg','gif','tiff'],
            files: ['pdf', 'sketch', 'psd'],
            audio: ['webm','ogg','mp3','wav','wma','aac','m4a','flac'],
            video: ['webm', 'mp4']
        }
    },
    sockets: {
        enabled: true,
        path: '/socket.io',
    },
    search: {
        url: process.env.ELASTIC_SSL_URL,
        index: 'app',
        host: '',
        limit: 25,
        defaultType: 'doc',
        defaultMapping: {
            type: { type: 'keyword' },
            name: { type: 'text' },
        }
    }
})