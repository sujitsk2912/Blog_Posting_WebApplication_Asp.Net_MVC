// Utility functions
function showToast(message, type) {
    const toastContainer = $('#toastContainer');
    const toast = $(`
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `);
    toastContainer.append(toast);
    const bsToast = new bootstrap.Toast(toast[0]);
    bsToast.show();
    toast.on('hidden.bs.toast', () => toast.remove());
}

function adjustTextareaHeight($textarea) {
    $textarea.height('auto');
    $textarea.height($textarea[0].scrollHeight);
}