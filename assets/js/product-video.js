(function($) {
    'use strict';

    $(function() {
        if (typeof tryAuraVideoData === 'undefined' || !tryAuraVideoData.video) {
            return;
        }

        const videoData = tryAuraVideoData.video;

        $(document).on('click', '.try-aura-video-thumbnail a', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const $gallery = $('.woocommerce-product-gallery');
            const $mainImageWrapper = $gallery.find('.woocommerce-product-gallery__wrapper');
            const $mainImage = $mainImageWrapper.find('.woocommerce-product-gallery__image').first();

            // If video is already showing, do nothing
            if ($mainImageWrapper.find('.try-aura-video-player-container').length) {
                return;
            }

            let videoHtml = '';
            if (videoData.platform === 'youtube') {
                const videoId = getYoutubeId(videoData.url);
                if (videoId) {
                    videoHtml = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                }
            } else {
                videoHtml = `<video width="100%" height="auto" controls autoplay><source src="${videoData.url}" type="video/mp4">${navigator.appName === 'Microsoft Internet Explorer' ? 'Your browser does not support the video tag.' : ''}</video>`;
            }

            if (videoHtml) {
                const $container = $('<div class="try-aura-video-player-container"></div>').html(videoHtml);
                $mainImageWrapper.prepend($container);
                $mainImage.hide();

                // Handle clicking other thumbnails to remove video
                $('.woocommerce-product-gallery__image:not(.try-aura-video-thumbnail)').on('click', function() {
                    $container.remove();
                    $mainImage.show();
                });
            }
        });

        function getYoutubeId(url) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : false;
        }
    });
})(jQuery);
