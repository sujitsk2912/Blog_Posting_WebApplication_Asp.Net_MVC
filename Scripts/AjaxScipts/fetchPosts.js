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