// postActions.js
$(document).ready(function () {
    const loggedInUserId = @ViewBag.UserId;

    $(document).on('click', '[data-bs-target="#postActionsModal"]', function () {
        const postId = $(this).data('post-id');
        const postUserId = $(this).data('post-user-id');
        $('#postActionsModal').data('post-id', postId);
        $('#postActionsModal').data('post-user-id', postUserId);
        $('#postActionsContent').empty();

        if (postUserId === loggedInUserId) {
            $('#postActionsContent').append(`
                <button type="button" class="text-primary" style="border: 0 !important;">Edit Post</button>
                <button type="button" class="text-danger">Delete Post</button>
            `);
        } else {
            $('#postActionsContent').append(`
                <button type="button" class="text-success">Share</button>
                <button type="button" class="text-primary">Copy Link</button>
            `);
        }

        $('#postActionsContent').append(`
            <button type="button" data-bs-dismiss="modal" aria-label="Close" class="text-secondary">Cancel</button>
        `);

        $('#postActionsModal').modal('show');
    });

    $(document).on('click', '#postActionsContent button.text-danger', function () {
        const postId = $('#postActionsModal').data('post-id');
        const userId = $('#postActionsModal').data('post-user-id');
        Swal.fire({
            title: 'Are you sure?',
            text: 'You are about to delete this post!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/UploadPost/DeletePost',
                    type: 'POST',
                    data: {
                        userId: userId,
                        postId: postId,
                        __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
                    },
                    success: function (response) {
                        if (response.success) {
                            $(`[data-post-id="${postId}"]`).closest('.card').remove();
                            Swal.fire({
                                title: 'Deleted!',
                                text: 'Your post has been deleted.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            }).then(() => window.location.reload());
                        } else {
                            showToast('Failed to delete post: ' + response.message, 'error');
                        }
                    },
                    error: function (xhr, status, error) {
                        showToast('Error occurred: ' + error, 'error');
                    }
                });
            }
        });
    });

    $(document).on('click', '#postActionsContent a.text-primary', function () {
        const postId = $('#postActionsModal').data('post-id');
        window.location.href = `/EditPost/Index/${postId}`;
    });

    $(document).on('click', '#postActionsContent a.text-primary:contains("Share")', function () {
        const postId = $('#postActionsModal').data('post-id');
        const shareUrl = `${window.location.origin}/Post/Details/${postId}`;
        alert(`Share this post: ${shareUrl}`);
    });

    $(document).on('click', '#postActionsContent a.text-primary:contains("Copy Link")', function () {
        const postId = $('#postActionsModal').data('post-id');
        const postUrl = `${window.location.origin}/Post/Details/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => alert('Link copied to clipboard!')).catch(() => alert('Failed to copy link.'));
    });
});