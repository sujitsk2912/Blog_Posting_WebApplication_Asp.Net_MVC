// @*Script for Post Actions*@

$(document).ready(function () {
    const loggedInUserId = @ViewBag.UserId; // Replace with your method to get the logged-in user's ID

    // Event listener for opening the post actions modal
    $(document).on('click', '[data-bs-target="#postActionsModal"]', function () {
        const postId = $(this).data('post-id');
        const postUserId = $(this).data('post-user-id');
        $('#postActionsModal').data('post-id', postId);
        $('#postActionsModal').data('post-user-id', postUserId);
        $('#postActionsContent').empty();

        if (postUserId === loggedInUserId) {
            $('#postActionsContent').append(`
                <a href="javascript:void(0)" class="text-decoration-none text-dark fw-semibold d-flex align-items-center border-bottom" style="padding:10px 0;">
                    <i class="fa-solid fa-edit me-2 text-primary"></i> Edit Post
                </a>
                <a href="javascript:void(0)" class="text-decoration-none text-danger fw-semibold d-flex align-items-center border-bottom" style="padding:10px 0;">
                    <i class="fa-solid fa-trash-alt me-2"></i> Delete Post
                </a>
            `);
        } else {
            $('#postActionsContent').append(`
                <a href="javascript:void(0)" class="text-decoration-none text-dark fw-semibold d-flex align-items-center border-bottom" style="padding:10px 0;">
                    <i class="fa-solid fa-share me-2 text-primary"></i> Share
                </a>
                <a href="javascript:void(0)" class="text-decoration-none text-dark fw-semibold d-flex align-items-center border-bottom" style="padding:10px 0;">
                    <i class="fa-solid fa-link me-2 text-primary"></i> Copy Link
                </a>
            `);
        }

        $('#postActionsContent').append(`
            <a href="javascript:void(0)" class="text-decoration-none text-secondary fw-semibold d-flex align-items-center" data-bs-dismiss="modal" aria-label="Close" style="padding:10px 0;">
                <i class="fa-solid fa-close me-2"></i> Cancel
            </a>
        `);

        $('#postActionsModal').modal('show');
    });

    // Handle Delete Post
    $(document).on('click', '#postActionsContent a.text-danger', function () {
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

    // Handle Edit Post
    $(document).on('click', '#postActionsContent a.text-dark', function () {
        const postId = $('#postActionsModal').data('post-id');
        window.location.href = `/EditPost/Index/${postId}`;
    });

    // Handle Share Post
    $(document).on('click', '#postActionsContent a.text-dark:contains("Share")', function () {
        const postId = $('#postActionsModal').data('post-id');
        const shareUrl = `${window.location.origin}/Post/Details/${postId}`;
        alert(`Share this post: ${shareUrl}`);
    });

    // Handle Copy Link
    $(document).on('click', '#postActionsContent a.text-dark:contains("Copy Link")', function () {
        const postId = $('#postActionsModal').data('post-id');
        const postUrl = `${window.location.origin}/Post/Details/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => alert('Link copied to clipboard!')).catch(() => alert('Failed to copy link.'));
    });
});