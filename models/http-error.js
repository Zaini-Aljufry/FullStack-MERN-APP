class HttpError extends Error {
    constructor(_message,_code) {
        super(_message)
        this.code = _code
    }
}

module.exports = HttpError