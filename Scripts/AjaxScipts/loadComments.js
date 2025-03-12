// loadComments.js
$(document).ready(function () {
    $(".commentModal").on("show.bs.modal", function () {
        const postId = $(this).data("post-id");
        const userId = $(this).data("post-user-id");
        if (postId && userId) {
            loadCommentsInModal(userId, postId);
        } else {
            console.error("Post ID or User ID is missing.");
        }
    });

    function loadCommentsInModal(userId, postId) {
        $.ajax({
            url: '/UploadPost/GetCommentOnPost',
            type: 'GET',
            data: { userId: userId, postId: postId },
            success: function (response) {
                if (response.success) {
                    let commentsHtml = response.comments.length
                        ? response.comments.map(comment => `
                            <div class="comment mb-2" style="padding: 10px 20px;">
                                <div style="display: flex; align-items: center;">
                                    <img src="${comment.UserImageURL ? comment.UserImageURL : '/Assets/Images/user (13).png'}" style="height: 2rem; width: auto;" class="rounded-circle me-3" alt="User Avatar">
                                    <span style="display: flex;align-items: center;gap: 20px;text-align: center;white-space: nowrap; width:100%">
                                        <h6 class="modal-title">${comment.FirstName}  ${comment.LastName}</h6>
                                        <small>${comment.CommentedOn ? formatTimeAgoComment(comment.CommentedOn) : 'Unknown Date'}</small>
                                        <span style="width:100% !important">
                                            <i class="bi bi-three-dots" style="cursor:pointer" data-bs-toggle="modal" data-bs-target="#commentActionsModal" onclick="openCommentActions(${comment.CommentID}, ${comment.PostID}, ${comment.UserID}, '${comment.CommentText}')"></i>
                                        </span>
                                    </span>
                                </div>
                                <p style="padding-left: 50px; white-space: pre-wrap !important;">${comment.CommentText}</p>
                            </div>`).join("")
                        : "<p>No comments available.</p>";

                    $(`#commentsContainer${postId}`).html(commentsHtml);
                } else {
                    alert(response.message);
                }
            },
            error: function (xhr, status, error) {
                alert("Error loading comments. Please try again.");
                console.error(xhr.responseText);
            }
        });
    }

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