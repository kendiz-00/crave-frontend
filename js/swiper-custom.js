/**
 * Swiper Custom - Slider initialization for Crave Restaurant
 */
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Swiper === 'undefined') return;

  // Hero Slider
  if (document.querySelector('.swiper-hero')) {
    new Swiper('.swiper-hero', {
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      effect: 'fade',
      fadeEffect: { crossFade: true },
      navigation: {
        nextEl: '.next-slick1',
        prevEl: '.prev-slick1',
      },
      pagination: {
        el: '.wrap-slick1-dots',
        clickable: true,
      },
    });
  }

  // Event Slider
  if (document.querySelector('.swiper-event')) {
    new Swiper('.swiper-event', {
      loop: true,
      autoplay: {
        delay: 6000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.next-slick2',
        prevEl: '.prev-slick2',
      },
      pagination: {
        el: '.wrap-slick2-dots',
        clickable: true,
      },
    });
  }

  // Review Slider
  if (document.querySelector('.swiper-review')) {
    new Swiper('.swiper-review', {
      loop: true,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      navigation: {
        nextEl: '.next-slick3',
        prevEl: '.prev-slick3',
      },
      pagination: {
        el: '.wrap-slick3-dots',
        clickable: true,
      },
    });
  }
});
