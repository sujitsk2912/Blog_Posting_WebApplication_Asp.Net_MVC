// @*Script for adjusting post content box*@

$(document).ready(function () {
    const $messageText = $('#message-text');

    // Function to adjust textarea height dynamically
    function adjustTextareaHeight() {
        $messageText.height('auto'); // Reset height to auto
        $messageText.height($messageText[0].scrollHeight); // Set height to scrollHeight
    }

    // Adjust height on input
    $messageText.on('input', function () {
        adjustTextareaHeight();
    });

    // Initial height adjustment
    adjustTextareaHeight();
});