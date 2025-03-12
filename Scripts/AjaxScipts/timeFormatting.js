// Time formatting functions
function formatTimeAgo(postedOn) {
    if (!postedOn) return "Unknown time";

    const postDate = new Date(postedOn);
    if (isNaN(postDate)) return "Invalid date";

    const now = new Date();
    const diff = Math.floor((now - postDate) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 172800) return `Yesterday`;
    return `${Math.floor(diff / 86400)} days ago`;
}

function formatTimeAgoComment(postedOn) {
    if (!postedOn) return "Unknown time";

    const postDate = new Date(postedOn);
    if (isNaN(postDate)) return "Invalid date";

    const now = new Date();
    const diff = Math.floor((now - postDate) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return `Yesterday`;
    return `${Math.floor(diff / 86400)} days ago`;
}