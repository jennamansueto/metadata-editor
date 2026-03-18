const EventBus = mitt();

// These will be registered as globalProperties on each app instance.
// Store as window globals so entry points can reference them.
window.__globalConfirm = function (message) {
    return new Promise((resolve, reject) => {
        EventBus.emit('confirm', { message, resolve, reject });
    });
};

window.__globalAlert = function (message, options = {}) {
    return new Promise((resolve) => {
        EventBus.emit('alert', { message, ...options, resolve });
    });
};

window.__globalExtractErrorMessage = function (error) {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data) {
        return JSON.stringify(error.response.data);
    }
    return error.message || "An unknown error occurred";
};

