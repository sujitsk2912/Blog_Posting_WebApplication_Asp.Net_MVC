// commentActions.js
let currentCommentData = {};

function openCommentActions(commentID, postID, userID, commentText) {
    currentCommentData = { commentID, postID, userID, commentText };

    const loggedInUserId = @ViewBag.UserId;
    let actionsHtml = '';

    if (userID === loggedInUserId) {
        actionsHtml = `
            <button type="button" class="text-primary" style="border: 0 !important;">Edit Comment</button>
            <button type="button" id="deleteCommentBtn" data-bs-dismiss="modal" aria-label="Close" class="text-danger closeAllModals">Delete Comment</button>
        `;
    } else {
        actionsHtml = `
            <button type="button" data-bs-dismiss="modal" aria-label="Close" class="text-danger">Report Comment</button>
        `;
    }

    actionsHtml += `
        <button type="button" id="closeAllModals" data-bs-dismiss="modal" aria-label="Close" class="text-secondary">Cancel</button>`;

    $('#commentActionsContent').html(actionsHtml);

    const actionModal = new bootstrap.Modal(document.getElementById('commentActionsModal'));
    actionModal.show();

    $("#deleteCommentBtn").off("click").on("click", function () {
        deleteComment(currentCommentData);
    });
}

function deleteComment(data) {
    $.ajax({
        url: '/UploadPost/DeleteComment',
        type: 'POST',
        data: {
            postID: data.postID,
            commentID: data.commentID,
        },
        success: function (response) {
            if (response.success) {
                showToast("Comment deleted successfully!", 'success');
                loadCommentsInModal(data.userID, data.postID);
            } else {
                showToast("Failed to delete comment.", 'error');
            }
        },
        error: function () {
            showToast("Error deleting comment.", 'error');
        }
    });
}