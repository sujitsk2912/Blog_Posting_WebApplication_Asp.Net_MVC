// uploadComments.js
$(document).ready(function () {
    function toggleCommentButton() {
        $('.postCommentBox').each(function () {
            const commentContent = $(this).val().trim();
            $(this).next('.submitCommentBtn').prop('disabled', commentContent === '');
        });
    }

    $(document).on('input change', '.postCommentBox', toggleCommentButton);

    $(document).on('click', '[id^="submitComment"]', function () {
        const postId = $(this).attr('id').replace('submitComment', '');
        const commentBox = $(`#postCommentBox${postId}`);
        const commentContent = commentBox.val().trim();

        if (!commentContent) {
            showToast('Comment cannot be empty.', 'warning');
            return;
        }

        const postUserId = @ViewBag.UserId;

        if (!postUserId) {
            showToast('Error: User information is missing.', 'error');
            return;
        }

        $.ajax({
            url: '/UploadPost/AddCommentOnPost',
            type: 'POST',
            data: {
                userId: postUserId,
                postId: postId,
                PostComment: commentContent
            },
            success: function (response) {
                if (response.success) {
                    showToast('Comment posted successfully!', 'success');
                    commentBox.val('');
                    loadCommentsInModal(postUserId, postId);
                    toggleCommentButton();
                } else {
                    showToast('Error: ' + response.message, 'error');
                }
            },
            error: function (xhr, status, error) {
                showToast('Error posting comment. Please try again.', 'error');
            }
        });
    });
});