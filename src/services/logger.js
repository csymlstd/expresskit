module.exports = {
    error: (e) => {
        e.type = 'Server error'
        e.status = 500
        return e
    },
    send: (type = 'Server error', message, status = 500) => {
        switch(type) {
            case 'Server error':
                status = 500
                break
            case 'Not found':
                status = 404
                break
            case 'Unpublished':
                status = 403
                break
            case 'Access denied':
                status = 403
                break
            case 'Not authorized':
                status = 401
                break
            case 'Validation error':
                status = 400
                break
        }

        let err = new Error(message)
        err.type = type
        err.status = status
        return err
    },
    log(type, message, err = {}) {
        console.log(type, '-', message)
        console.error(err.stack || err)
        return err
    },
    kill(err) {
        console.error(err.stack || err)
        process.exit(1)
    }
}