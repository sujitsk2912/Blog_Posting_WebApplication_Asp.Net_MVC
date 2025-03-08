// @*Script for Uploading Comments on a Particular Post*@

$(document).on('click', '[id^=submitComment]', function () {
    const postId = $(this).closest('.modal').data('post-id');
    const userId = $(this).closest('.modal').data('post-user-id');
    const commentText = $(`#postCommentBox${postId}`).val().trim();

    if (!commentText) {
        alert('Please enter a comment.');
        return;
    }

    $.ajax({
        url: '/UploadPost/AddCommentOnPost',
        type: 'POST',
        data: {
            userId: userId,
            postId: postId,
            PostComment: commentText
        },
        success: function (response) {
            if (response.success) {
                $(`#postCommentBox${postId}`).val('');
                const newComment = `
                    <div style="padding:10px 20px">
                        <div style="display:flex;">
                            <img src="/Assets/Images/user (13).png" style="height:2rem;width:auto" class="rounded-circle me-3" alt="User Avatar">
                            <h6 class="modal-title">${response.commenterName || 'User'}</h6>
                        </div>
                        <p style="padding-left:50px">${commentText}</p>
                    </div>
                `;
                $(`#commentsContainer${postId}`).append(newComment);
            } else {
                alert('Failed to add comment: ' + response.message);
            }
        },
        error: function (xhr, status, error) {
            alert('Error: ' + error);
        }
    });
});