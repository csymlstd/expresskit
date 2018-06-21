const config = require('../config')
const Dependency = require('../config/dependencies')

const request = Dependency.get('request')
const uuid = Dependency.get('uuid')
const path = require('path')
const mimeTypes = require('mime-types')

if(config.media.adapter == 's3') {
    const S3 = require('aws-sdk/clients/s3')
    const aws = new S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
    })
}

const Media = {
    // Generate s3 Presigned URL to Download
    getDownloadURL(key, filename) {
        return new Promise((resolve, reject) => {
            let params = {
                Bucket: config.media.s3.bucket || process.env.AWS_S3_BUCKET,
                Key: key,
                Expires: 5000,
                ResponseContentDisposition: `attachment; filename=${filename || key}`
            }

            aws.getSignedUrl('getObject', params, (err, data) => {
                if(err) return reject(err)

                let response = {
                    signedRequest: data
                }

                return resolve(response)
            })
        })
    },

    // Generate s3 Presigned URL to Upload
    getUploadURL(filename, mime, folder = '') {
        return new Promise((resolve, reject) => {
            if(!filename || !mime) return reject('Invalid media')

            let ext = Media.getExtension(filename)

            // Check if media type and extension is valid
            if(!Media.isAllowedExtension(filename)) return reject('Invalid file extension')
            if(!Media.isAllowedType(mime)) return reject('Invalid file type')
            if(!Media.isAllowedFolder(folder)) return reject('Invalid folder')

            // Generate unique key
            let key = Media.generateFilename(ext)

            let params = {
                Bucket: config.media.s3.bucket || process.env.AWS_S3_BUCKET,
                Key: `${folder}/${key}`,
                Expires: 1000,
                ContentType: mime,
                ACL: 'public-read'
            }

            aws.getSignedUrl('putObject', params, (err, data) => {
                if(err) return reject(err)

                let response = {
                    key,
                    filename,
                    signedRequest: data,
                    contentType: mime,
                    acl: 'public-read',
                    url: `https://${params.Bucket}.s3.amazonaws.com/${key}`
                }

                return resolve(response)
            })
        })
    },

    async uploadExternalURL(url, folder = '') {
        return new Promise((resolve, reject) => {
            let external = axios.get(url, {
                responseType: 'arraybuffer'
            })

            let mime = external.headers['content-type']
            let size = external.headers['content-length']
            let ext = mimeTypes.extension(mime)
            let key = Media.generateFilename(ext)

            // Check if media type and extension is valid
            if(!Media.isAllowedExtension(filename)) return reject('Invalid file extension')
            if(!Media.isAllowedType(mime)) return reject('Invalid file type')
            if(!Media.isAllowedFolder(folder)) return reject('Invalid folder')

            let params = {
                Bucket: config.media.s3.bucket,
                Key: `${folder}/${key}`,
                ContentType: mime,
                ACL: 'public-read',
                Body: external.data
            }

            aws.upload(params, (err, data) => {
                if(err) return reject(err)
                return resolve(data)
            })
        })
    },

    isAllowedType(mime) {
        let types = []
        Object.keys(config.media.types).forEach(key => types = [...types, ...config.media.types[key]])
        return types.indexOf(mimetype) > -1
    },

    isAllowedExtension(ext) {
        let extensions = []
        Object.keys(config.media.extensions).forEach(key => extensions = [...extensions, ...config.media.extensions[key]])
        return extensions.indexOf(ext) > -1
    },

    isAllowedFolder(folder) {
        let folders = []
        return config.media.folders.indexOf(folder) > -1
    },

    isImage(mime) {
        return config.media.images.indexOf(mime) > -1
    },

    isAudio(mime) {
        return config.media.audio.indexOf(mime) > -1
    },

    isFile(mime) {
        return config.media.files.indexOf(mime) > -1
    },

    isVideo(mime) {
        return config.media.videos.indexOf(mime) > -1
    },

    generateFilename(ext) {
        if(!ext) return false
        return `${uuid()}.${ext}`
    },

    getExtension(path) {
        const extreg = /(?:\.([^.]+))?$/
        return extreg.exec(filename)[1]
    },

    bytesToSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        if (bytes === 0) return 'n/a'
        let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
        if (i === 0) return bytes + ' ' + sizes[i]
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
    },

    toSeconds(ms) {
        return (ms / 1000).toFixed(2)
    }
}

module.exports = Media