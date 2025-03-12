// fetchPosts.js
$(document).ready(function () {
    $.ajax({
        url: '/Home/GetPosts',
        type: 'GET',
        success: function (response) {
            populateBlogFeed(response);
        },
        error: function (xhr, status, error) {
            console.error('AJAX Error:', xhr.responseText);
        }
    });

    function populateBlogFeed(posts) {
        const container = $('#blogContainer');
        container.empty();

        posts.forEach(post => {
            const postHTML = `
                <div class="card mb-4">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <img id="getUserImage" onclick="getUserProfile(${post.UserID})" src="${post.UserImageURL ? post.UserImageURL : '/Assets/Images/user (13).png'}" style="height:3rem;width:auto;cursor:pointer" class="rounded-circle me-3" alt="User Avatar">
                            <div style="display: flex;justify-content: space-between;align-items: self-start;width: 100%;">
                                <div>
                                    <h6 id="getUsername" onclick="getUserProfile(${post.UserID})" style="cursor:pointer" class="mb-0">${post.FirstName || ''} ${post.LastName || ''}</h6>
                                    <small id="getPostedOn" class="text-muted">${post.PostedOn ? formatTimeAgo(post.PostedOn) : 'Unknown Date'}</small>
                                </div>
                                <span>
                                    <i class="bi bi-three-dots" data-bs-toggle="modal" data-bs-target="#postActionsModal" data-post-id="${post.PostID || ''}" data-post-user-id="${post.UserID || ''}" style="cursor:pointer"></i>
                                </span>
                            </div>
                        </div>
                        <p id="getPostContent">${(post.PostContent || '').replace(/\n/g, '<br>')}</p>
                        ${post.PostImageURL ? `<img id="getPostImage" src="${post.PostImageURL}" class="img-fluid" style="aspect-ratio: 1 / 1; border-radius:5px; object-fit: cover; width: 100%;" alt="Blog Image">` : ''}
                        <hr />
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-outline-danger btn-sm"><i class="fa-solid fa-heart pe-1"></i>Like</button>
                            <button data-bs-toggle="modal" onclick="loadCommentsInModal(${post.UserID}, ${post.PostID})" data-bs-target="#commentModal${post.PostID || ''}" class="btn btn-outline-secondary btn-sm"><i class="fa-solid fa-comment pe-1"></i>Comment</button>
                            <button class="btn btn-outline-success btn-sm"><i class="fa-solid fa-share pe-1"></i>Share</button>
                            <button class="btn btn-outline-info btn-sm"><i class="fa-solid fa-bookmark pe-1"></i>Save</button>
                        </div>
                    </div>
                </div>
            `;
            container.append(postHTML);
        });
    }
});


// uploadPost.js
$(document).ready(function () {
    function togglePostButton() {
        const content = $('#postContent').val().trim();
        const hasImage = $('#photo-upload')[0].files.length > 0;
        $('#submitPost').prop('disabled', !hasImage);
    }

    function previewImage(event) {
        const preview = document.getElementById('image-preview');
        preview.innerHTML = "";
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('position-relative', 'd-inline-block');
                const img = document.createElement('img');
                img.src = e.target.result;
                img.classList.add('img-fluid', 'mt-2');
                img.style.aspectRatio = "1 / 1";
                img.style.width = "100%";
                img.style.objectFit = "cover";
                const closeIcon = document.createElement('i');
                closeIcon.className = 'fa-solid fa-circle-xmark position-absolute top-0 end-0 text-danger fs-4 m-1';
                closeIcon.style.cursor = "pointer";
                closeIcon.onclick = function () {
                    preview.innerHTML = "";
                    $('#photo-upload').val('');
                    togglePostButton();
                };
                imgContainer.appendChild(img);
                imgContainer.appendChild(closeIcon);
                preview.appendChild(imgContainer);
            };
            reader.readAsDataURL(file);
        }
    }

    $('#postContent, #photo-upload').on('input change', togglePostButton);

    $('#submitPost').on('click', function () {
        const formData = new FormData();
        formData.append('postContent', $('#postContent').val());
        formData.append('imageFile', $('#photo-upload')[0].files[0]);
        formData.append('__RequestVerificationToken', $('[name="__RequestVerificationToken"]').val());

        $.ajax({
            url: '/UploadPost/UploadPost',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                if (response.success) {
                    showToast('Post uploaded successfully!', 'success');
                    $('#postForm')[0].reset();
                    $('#image-preview').html("");
                    togglePostButton();
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast('Post uploading failed!', 'error');
                }
            },
            error: function (xhr, status, error) {
                alert('Error: ' + error);
            }
        });
    });

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

