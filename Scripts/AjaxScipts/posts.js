// Post-related functionality
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

function populateBlogFeed(posts) {
    const container = $('#blogContainer');
    if (!container.length) {
        console.error('Container #blogContainer not found!');
        return;
    }
    container.empty();

    posts.forEach(post => {
        const postHTML = generatePostHTML(post);
        container.append(postHTML);
    });
}

function generatePostHTML(post) {
    // Your existing post HTML generation code
    // (The long template literal from your original code)
    // This has been truncated for brevity - keep your original implementation
}

function generateComments(comments) {
    if (!Array.isArray(comments)) {
        return '<p>No comments available.</p>';
    }

    let commentsHTML = '';
    comments.forEach(comment => {
        commentsHTML += generateCommentHTML(comment);
    });
    return commentsHTML;
}

function generateCommentHTML(comment) {
    // Your existing comment HTML generation code
    // This has been truncated for brevity - keep your original implementation
}

// Initialize post-related event handlers
$(document).ready(function () {
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

    // Load initial posts
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
});