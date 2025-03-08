// @*Script for Image Preview*@

$(document).ready(function () {
    // Image Preview Function
    window.previewImage = function (event) {
        var reader = new FileReader();
        reader.onload = function () {
            $('#image-preview').html(`
                <img src="${reader.result}" class="img-fluid rounded mb-3" alt="Preview Image">
            `);
        };
        reader.readAsDataURL(event.target.files[0]);
    };

    // Bind the previewImage function to the file input's change event
    $('#photoUpload').on('change', function (event) {
        previewImage(event);
    });
});