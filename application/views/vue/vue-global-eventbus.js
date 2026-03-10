const EventBus = mitt();

//Global confirm function
function $confirm(message) {
    return new Promise((resolve, reject) => {
        EventBus.emit('confirm', { message, resolve, reject });
    });
}

//Global alert function
function $alert(message, options = {}) {
    return new Promise((resolve) => {
        EventBus.emit('alert', { message, ...options, resolve });
    });
}

//Global error message extractor
function $extractErrorMessage(error) {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    if (error.response?.data) {
        return JSON.stringify(error.response.data);
    }
    return error.message || "An unknown error occurred";
}

