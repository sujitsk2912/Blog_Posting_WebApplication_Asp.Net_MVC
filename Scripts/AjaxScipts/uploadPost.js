// @*Script for Uploading Posts*@

$(document).ready(function () {
    const $postButton = $('#submitPost'); // Post button
    const $messageText = $('#messageText'); // Textarea for post content
    const $photoUpload = $('#photoUpload'); // File input for image upload

    // Function to check if the form has data
    function checkFormData() {
        const messageText = $messageText.val() || '';
        const hasText = messageText.trim() !== '';
        const hasImage = $photoUpload[0].files.length > 0;
        $postButton.prop('disabled', !(hasText || hasImage));
    }

    // Monitor changes in the textarea and file input
    $messageText.on('input', checkFormData);
    $photoUpload.on('change', checkFormData);

    // Initial check
    checkFormData();

    // Form submission handler
    $('#postForm').submit(function (e) {
        e.preventDefault();
        var formData = new FormData(this);
        var messageText = $messageText.val() || '';
        formData.append('postContent', messageText.trim());
        var imageFile = $photoUpload[0].files[0];
        if (imageFile) formData.append('imageFile', imageFile);

        $.ajax({
            url: '/UploadPost/UploadPost',
            type: 'POST',
            data: formData,
            headers: { 'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val() },
            contentType: false,
            processData: false,
            success: function (response) {
                if (response.success) {
                    showToast('Post uploaded successfully!', 'success');
                    $('#postForm')[0].reset();
                    $('#image-preview').html('');
                    $('#postModal').modal('hide');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('Post uploading failed!', 'error');
                }
            },
            error: function (xhr, status, error) {
                showToast('Error: ' + xhr.responseText, 'error');
            }
        });
    });

    // Function to show toast notifications
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
});