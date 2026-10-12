document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-bhama-reel]").forEach(function (tile) {
    var video = tile.querySelector("video");
    if (!video) return;

    tile.addEventListener("click", function () {
      document.querySelectorAll("[data-bhama-reel] video").forEach(function (other) {
        if (other !== video) other.pause();
      });

      if (video.paused) {
        video.muted = false;
        video.controls = true;
        video.play();
      } else {
        video.pause();
      }
    });

    video.addEventListener("pause", function () {
      video.controls = false;
      video.muted = true;
    });
  });
});
