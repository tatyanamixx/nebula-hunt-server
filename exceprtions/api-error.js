module.exports = class ApiError extends Error {
    status;
    errors;

    constructor (status, message, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static UnauthorizedError () {
        return new ApiError(401, "The user is not authorization")
    }

    static BadRequest (message, errors = []) {
        return new ApiError(400, message, errors)
    }

    static Internal (message) {
        return new ApiError (500, message)        
    }

    static Forbidden (message) {
        return new ApiError (403, message)        
    }

}